/**
 * Aquilla business-logic engine — pure, dependency-free, server-side source of
 * truth for all money and status math. Imported by Supabase Edge Functions
 * (Deno) and unit-tested by Vitest. NEVER trust the client for any of this.
 *
 * Money is handled in dollars with cent-rounding to mirror the product spec and
 * the quoted prices shown to users. Use `toCents()` at the Stripe boundary.
 */

/** Aquilla takes 15% of the agreed labor price. */
export const LABOR_RATE = 0.15;
/** Aquilla takes 5% of pass-through parts. */
export const PARTS_RATE = 0.05;
/** Disclosed flat fee when a job can't be completed. Aquilla still takes 15%. */
export const VISIT_FEE = 20;
/** Guardrail only engages once a pro has at least this many total jobs. */
export const MIN_JOBS = 5;
/** Completion rate below this pauses the pro (rule 7). */
export const MIN_COMPLETION_RATE = 0.5;
/** Hours a side has to confirm before the job auto-confirms (rule 6). */
export const AUTO_CONFIRM_HOURS = 24;

/** Round to whole cents (2 dp), avoiding binary float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Convert a dollar amount to integer cents for Stripe. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export interface JobSplit {
  /** Aquilla's cut: 15% of labor + 5% of parts. */
  fee: number;
  /** Gross the customer pays. */
  total: number;
  /** What the pro receives after the fee. */
  payout: number;
}

/**
 * Split a job into Aquilla's fee and the pro's payout.
 * fee = 15% of labor + 5% of parts; payout = total − fee.
 */
export function splitJob(parts: number, labor: number): JobSplit {
  const p = Math.max(0, parts || 0);
  const l = Math.max(0, labor || 0);
  const fee = round2(l * LABOR_RATE + p * PARTS_RATE);
  const total = round2(p + l);
  const payout = round2(total - fee);
  return { fee, total, payout };
}

/**
 * Split a labor-only price (no parts) — the common single-visit case.
 * Aquilla takes a flat 15%.
 */
export function splitLabor(price: number): JobSplit {
  return splitJob(0, price);
}

/** The $20 visit fee split: Aquilla takes 15% → pro nets $17. */
export function splitVisitFee(): JobSplit {
  return splitLabor(VISIT_FEE);
}

// ---------------------------------------------------------------------------
// Success-rate guardrail (rule 7)
// ---------------------------------------------------------------------------

export interface GuardrailState {
  /** completed / (completed + incomplete); null with no history. */
  completionRate: number | null;
  /** Total jobs that count toward the rate. */
  totalJobs: number;
  /** True once the pro is under review: ≥ MIN_JOBS and rate < 50%. */
  underReview: boolean;
  /** Pros under review cannot charge the visit fee. */
  canChargeVisitFee: boolean;
  /** Pros under review are paused from new assignments. */
  canReceiveJobs: boolean;
}

/**
 * Evaluate the success-rate guardrail. Completing jobs restores access, so this
 * is a pure function of the current completed / incomplete counts.
 */
export function evaluateGuardrail(
  completed: number,
  incomplete: number,
): GuardrailState {
  const total = Math.max(0, completed) + Math.max(0, incomplete);
  const completionRate = total === 0 ? null : completed / total;
  const underReview =
    total >= MIN_JOBS &&
    completionRate !== null &&
    completionRate < MIN_COMPLETION_RATE;
  return {
    completionRate,
    totalJobs: total,
    underReview,
    canChargeVisitFee: !underReview,
    canReceiveJobs: !underReview,
  };
}

// ---------------------------------------------------------------------------
// Dual confirmation + auto-confirm (rules 5 & 6)
// ---------------------------------------------------------------------------

/**
 * Outcome of evaluating both sides' completion confirmations:
 * - `pending`  — at least one side hasn't answered yet
 * - `release`  — both confirmed complete → release funds
 * - `dispute`  — the sides disagree → hold funds for review
 */
export type ConfirmDecision = "pending" | "release" | "dispute";

/**
 * Resolve a completion given each side's answer. `null` means "no response yet".
 * Both must confirm complete to release; any disagreement disputes the job.
 */
export function resolveConfirmation(
  customer: boolean | null,
  pro: boolean | null,
): ConfirmDecision {
  if (customer === null || pro === null) return "pending";
  return customer && pro ? "release" : "dispute";
}

export interface AutoConfirmResult {
  decision: ConfirmDecision;
  /** Effective customer answer after applying auto-confirm. */
  customer: boolean;
  /** Effective pro answer after applying auto-confirm. */
  pro: boolean;
  /** Which sides were auto-confirmed because they didn't respond in time. */
  autoConfirmed: Array<"customer" | "pro">;
}

/**
 * Apply the 24h auto-confirm rule: any side that hasn't responded by the
 * deadline is treated as confirming completion, so the pro still gets paid.
 *
 * `now` and `deadline` are epoch milliseconds; auto-confirm only applies once
 * the deadline has passed.
 */
export function applyAutoConfirm(
  customer: boolean | null,
  pro: boolean | null,
  now: number,
  deadline: number,
): AutoConfirmResult {
  const elapsed = now >= deadline;
  const autoConfirmed: Array<"customer" | "pro"> = [];

  let c = customer;
  let p = pro;
  if (elapsed) {
    if (c === null) {
      c = true;
      autoConfirmed.push("customer");
    }
    if (p === null) {
      p = true;
      autoConfirmed.push("pro");
    }
  }

  return {
    decision: resolveConfirmation(c, p),
    customer: c ?? false,
    pro: p ?? false,
    autoConfirmed,
  };
}

/** Deadline (epoch ms) for confirmation given when completion was proposed. */
export function confirmDeadlineFrom(proposedAtMs: number): number {
  return proposedAtMs + AUTO_CONFIRM_HOURS * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Job status machine (server-authoritative)
// ---------------------------------------------------------------------------

export type JobStatusName =
  | "requested" | "accepted" | "en_route" | "arrived" | "awaiting_part"
  | "completed" | "visit_fee" | "disputed" | "cancelled";

/**
 * The only status transitions the server will allow. Completion (`completed`)
 * and disputes are reached through the dual-confirm flow, not a direct write;
 * `visit_fee` is a pro action gated by the guardrail. Terminal states have no
 * outgoing edges.
 */
export const JOB_TRANSITIONS: Record<JobStatusName, JobStatusName[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["awaiting_part", "visit_fee", "completed", "disputed"],
  awaiting_part: ["completed", "visit_fee", "disputed"],
  completed: [],
  visit_fee: [],
  disputed: [],
  cancelled: [],
};

/** True if `to` is a permitted next status from `from`. */
export function canTransition(from: JobStatusName, to: JobStatusName): boolean {
  return JOB_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses a pro advances through while heading to / on the job. */
export const DISPATCH_STATUSES: JobStatusName[] = ["en_route", "arrived"];

/** A status from which nothing more can happen. */
export function isTerminal(status: JobStatusName): boolean {
  return JOB_TRANSITIONS[status]?.length === 0;
}
