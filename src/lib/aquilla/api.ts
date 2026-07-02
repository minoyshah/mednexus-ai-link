/**
 * Aquilla API client — the single typed seam between the app and the backend
 * Edge Functions. Every money/status mutation goes through here (never direct
 * table writes; RLS blocks them by design). `supabase.functions.invoke`
 * attaches the signed-in user's JWT automatically.
 *
 * Screens currently run on in-memory mock data; swapping a screen to live data
 * means calling these + the realtime hooks (useJobStatus / useJobChat), with
 * no shape changes — params mirror the functions' validators exactly.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type ProProfileRow = Database["public"]["Tables"]["pro_profiles"]["Row"];
export type DisputeRow = Database["public"]["Tables"]["disputes"]["Row"];

export type Trade =
  | "roadside" | "plumb" | "elec" | "hvac" | "lock" | "roof" | "pest"
  | "appliance" | "garage" | "handy" | "paint" | "land" | "move" | "clean" | "other";

export type JobStatusName =
  | "requested" | "accepted" | "en_route" | "arrived" | "awaiting_part"
  | "completed" | "visit_fee" | "disputed" | "cancelled";

/** Invoke an Edge Function and unwrap { data | error } into a value-or-throw. */
async function call<T>(fn: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(fn, { body });
  if (error) {
    // Surface the function's JSON error message when present.
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      const detail = await ctx.json().catch(() => null);
      throw new Error(detail?.error ?? error.message);
    }
    throw new Error(error.message);
  }
  return data as T;
}

/* ---------------------------------------------------------------------------
 * Jobs — lifecycle
 * ------------------------------------------------------------------------- */

export interface CreateJobInput {
  trade: Trade;
  problem: string;
  /** Broadcast "Other" job any matching pro can claim. */
  is_open?: boolean;
  /** Customer budget — required when is_open. */
  budget?: number;
  address?: string;
  lat?: number;
  lng?: number;
}

export const jobs = {
  create: (input: CreateJobInput) => call<{ job: JobRow }>("jobs-create", { ...input }),

  /** Pro accepts a direct request. */
  accept: (jobId: string) => call<{ job: JobRow }>("jobs-accept", { job_id: jobId }),

  /** Assigned pro sets the price; the server computes fee + payout. */
  quote: (jobId: string, laborAmount: number, partsAmount = 0) =>
    call<{ job: JobRow }>("jobs-quote", {
      job_id: jobId,
      labor_amount: laborAmount,
      parts_amount: partsAmount,
    }),

  /** Pro advances the dispatch state (en_route → arrived → …). */
  updateStatus: (jobId: string, status: JobStatusName) =>
    call<{ job: JobRow }>("jobs-update-status", { job_id: jobId, status }),

  /** Either side answers the dual completion confirmation (rules 5 & 6). */
  confirm: (jobId: string, completed: boolean) =>
    call<{ status: JobStatusName }>("jobs-confirm", { job_id: jobId, completed }),

  cancel: (jobId: string) => call<{ job: JobRow }>("jobs-cancel", { job_id: jobId }),

  /** Open + trade/area-matched requests visible to the signed-in pro. */
  nearby: () => call<{ jobs: JobRow[] }>("jobs-nearby"),

  /** Job needs a part: parts deposit now, labor on the return visit. */
  needsPart: (jobId: string, partsAmount: number, opts?: {
    laborAmount?: number;
    returnDate?: string;
    partNote?: string;
  }) =>
    call<{ job: JobRow }>("jobs-needs-part", {
      job_id: jobId,
      parts_amount: partsAmount,
      labor_amount: opts?.laborAmount,
      return_date: opts?.returnDate,
      part_note: opts?.partNote,
    }),

  /** Couldn't complete: charge the disclosed $20 visit fee (guardrail-gated). */
  visitFee: (jobId: string) => call<{ job: JobRow }>("jobs-visit-fee", { job_id: jobId }),
};

/* ---------------------------------------------------------------------------
 * Open ("Other") jobs — claim & select
 * ------------------------------------------------------------------------- */

export const openJobs = {
  /** Pro claims an open job. */
  claim: (jobId: string) => call<{ claim: unknown }>("open-jobs-claim", { job_id: jobId }),
  /** Customer picks one claiming pro. */
  select: (jobId: string, proId: string) =>
    call<{ job: JobRow }>("open-jobs-select", { job_id: jobId, pro_id: proId }),
};

/* ---------------------------------------------------------------------------
 * Payments — escrow via Stripe (server holds/captures; client only confirms)
 * ------------------------------------------------------------------------- */

export const payments = {
  /**
   * Place the manual-capture hold for the agreed price. Returns the
   * PaymentIntent client_secret for stripe.confirmCardPayment on the client.
   */
  authorize: (jobId: string) =>
    call<{ payment_intent_id: string; client_secret: string }>("payments-authorize", {
      job_id: jobId,
    }),

  /** Refund a captured job or void a still-held authorization. */
  refund: (jobId: string) =>
    call<{ result: "voided" | "refunded" }>("payments-refund", { job_id: jobId }),
};

/* ---------------------------------------------------------------------------
 * Pro onboarding & payouts
 * ------------------------------------------------------------------------- */

export interface ProOnboardInput {
  trades: Trade[];
  area?: string;
  radius_miles?: number;
  lat?: number;
  lng?: number;
  experience?: string;
  license_number?: string;
  license_state?: string;
  insured?: boolean;
  background_check_consent: boolean;
}

export const pro = {
  onboard: (input: ProOnboardInput) =>
    call<{ pro_profile: ProProfileRow }>("pro-onboard", { ...input }),

  /** Start/continue Stripe Connect payout setup; open the returned URL. */
  connectLink: () => call<{ url: string }>("stripe-connect-link"),

  /** Admin only: approve/reject a pro's verification. */
  verify: (proId: string, approve: boolean) =>
    call<{ pro_profile: ProProfileRow }>("pro-verify", { pro_id: proId, approve }),
};

/* ---------------------------------------------------------------------------
 * Disputes (admin console)
 * ------------------------------------------------------------------------- */

export const disputes = {
  resolve: (
    disputeId: string,
    resolution: "release" | "refund" | "split",
    opts?: { note?: string; proAmount?: number },
  ) =>
    call<{ dispute: DisputeRow; job_status: JobStatusName }>("disputes-resolve", {
      dispute_id: disputeId,
      resolution,
      note: opts?.note,
      pro_amount: opts?.proAmount,
    }),
};

export const api = { jobs, openJobs, payments, pro, disputes };
export default api;
