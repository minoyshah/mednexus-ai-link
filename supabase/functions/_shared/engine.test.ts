import { describe, it, expect } from "vitest";
import {
  splitJob,
  splitLabor,
  splitVisitFee,
  evaluateGuardrail,
  resolveConfirmation,
  applyAutoConfirm,
  confirmDeadlineFrom,
  toCents,
  canTransition,
  isTerminal,
  VISIT_FEE,
  AUTO_CONFIRM_HOURS,
} from "./engine";

describe("fee math — splitJob (15% labor + 5% parts)", () => {
  it("charges 15% on labor and 5% on parts", () => {
    // labor 100 -> fee 15; parts 100 -> fee 5; total fee 20
    expect(splitJob(100, 100)).toEqual({ fee: 20, total: 200, payout: 180 });
  });

  it("labor-only behaves like a flat 15%", () => {
    expect(splitJob(0, 130)).toEqual({ fee: 19.5, total: 130, payout: 110.5 });
    expect(splitLabor(130)).toEqual(splitJob(0, 130));
  });

  it("parts-only takes just 5%", () => {
    expect(splitJob(200, 0)).toEqual({ fee: 10, total: 200, payout: 190 });
  });

  it("rounds fee and payout to whole cents", () => {
    // labor 99.99 -> 14.9985 -> 15.00 ; parts 10.01 -> 0.5005 -> 0.50
    const s = splitJob(10.01, 99.99);
    expect(s.fee).toBe(15.5);
    expect(s.total).toBe(110);
    expect(s.payout).toBe(94.5);
  });

  it("treats negative or missing inputs as zero", () => {
    expect(splitJob(-50, -50)).toEqual({ fee: 0, total: 0, payout: 0 });
    // @ts-expect-error exercising runtime guard
    expect(splitJob(undefined, undefined)).toEqual({ fee: 0, total: 0, payout: 0 });
  });

  it("payout + fee always reconciles to the total", () => {
    for (const [p, l] of [[0, 95], [60, 130], [12.5, 47.75], [200, 350]]) {
      const { fee, total, payout } = splitJob(p, l);
      expect(round2cents(payout + fee)).toBe(total);
    }
  });
});

describe("visit fee", () => {
  it("is $20 with Aquilla's 15% cut, pro nets $17", () => {
    expect(VISIT_FEE).toBe(20);
    expect(splitVisitFee()).toEqual({ fee: 3, total: 20, payout: 17 });
  });
});

describe("toCents (Stripe boundary)", () => {
  it("converts dollars to integer cents", () => {
    expect(toCents(110.5)).toBe(11050);
    expect(toCents(19.5)).toBe(1950);
    expect(toCents(0.1)).toBe(10);
  });
});

describe("success-rate guardrail (rule 7)", () => {
  it("does not engage before 5 total jobs, even at 0%", () => {
    const g = evaluateGuardrail(0, 4);
    expect(g.totalJobs).toBe(4);
    expect(g.underReview).toBe(false);
    expect(g.canChargeVisitFee).toBe(true);
    expect(g.canReceiveJobs).toBe(true);
  });

  it("pauses a pro at >= 5 jobs with rate < 50%", () => {
    const g = evaluateGuardrail(2, 3); // 40% over 5 jobs
    expect(g.completionRate).toBeCloseTo(0.4);
    expect(g.underReview).toBe(true);
    expect(g.canChargeVisitFee).toBe(false);
    expect(g.canReceiveJobs).toBe(false);
  });

  it("exactly 50% is allowed (not below threshold)", () => {
    const g = evaluateGuardrail(3, 3); // 50% over 6 jobs
    expect(g.underReview).toBe(false);
  });

  it("completing jobs restores access", () => {
    expect(evaluateGuardrail(2, 3).underReview).toBe(true);
    // pro completes more jobs -> back above 50%
    expect(evaluateGuardrail(5, 3).underReview).toBe(false);
    expect(evaluateGuardrail(5, 3).canReceiveJobs).toBe(true);
  });

  it("reports null rate with no history", () => {
    expect(evaluateGuardrail(0, 0).completionRate).toBeNull();
  });
});

describe("dual confirmation (rule 5)", () => {
  it("is pending until both respond", () => {
    expect(resolveConfirmation(null, null)).toBe("pending");
    expect(resolveConfirmation(true, null)).toBe("pending");
    expect(resolveConfirmation(null, true)).toBe("pending");
  });

  it("releases only when both confirm complete", () => {
    expect(resolveConfirmation(true, true)).toBe("release");
  });

  it("disputes on any disagreement", () => {
    expect(resolveConfirmation(true, false)).toBe("dispute");
    expect(resolveConfirmation(false, true)).toBe("dispute");
    expect(resolveConfirmation(false, false)).toBe("dispute");
  });
});

describe("auto-confirm (rule 6)", () => {
  const t0 = 1_000_000;
  const deadline = confirmDeadlineFrom(t0);

  it("sets the deadline 24h out", () => {
    expect(deadline - t0).toBe(AUTO_CONFIRM_HOURS * 3600 * 1000);
  });

  it("does nothing before the deadline", () => {
    const r = applyAutoConfirm(true, null, deadline - 1, deadline);
    expect(r.decision).toBe("pending");
    expect(r.autoConfirmed).toEqual([]);
  });

  it("auto-confirms the unanswered side after 24h so the pro is paid", () => {
    const r = applyAutoConfirm(true, null, deadline, deadline);
    expect(r.decision).toBe("release");
    expect(r.pro).toBe(true);
    expect(r.autoConfirmed).toEqual(["pro"]);
  });

  it("auto-confirms both sides if neither responded", () => {
    const r = applyAutoConfirm(null, null, deadline + 5, deadline);
    expect(r.decision).toBe("release");
    expect(r.autoConfirmed).toEqual(["customer", "pro"]);
  });

  it("does NOT override an explicit dispute after the deadline", () => {
    // customer said not-completed; deadline passing must not flip to release
    const r = applyAutoConfirm(false, null, deadline + 5, deadline);
    expect(r.decision).toBe("dispute");
    expect(r.autoConfirmed).toEqual(["pro"]);
  });
});

describe("job status machine", () => {
  it("allows the normal dispatch progression", () => {
    expect(canTransition("requested", "accepted")).toBe(true);
    expect(canTransition("accepted", "en_route")).toBe(true);
    expect(canTransition("en_route", "arrived")).toBe(true);
    expect(canTransition("arrived", "completed")).toBe(true);
    expect(canTransition("arrived", "awaiting_part")).toBe(true);
    expect(canTransition("awaiting_part", "completed")).toBe(true);
  });

  it("allows cancellation before arrival and visit fee on site", () => {
    expect(canTransition("requested", "cancelled")).toBe(true);
    expect(canTransition("en_route", "cancelled")).toBe(true);
    expect(canTransition("arrived", "visit_fee")).toBe(true);
  });

  it("rejects skips and illegal jumps", () => {
    expect(canTransition("requested", "arrived")).toBe(false);
    expect(canTransition("requested", "completed")).toBe(false);
    expect(canTransition("arrived", "cancelled")).toBe(false); // can't cancel once on site
    expect(canTransition("accepted", "visit_fee")).toBe(false);
  });

  it("treats completed / visit_fee / disputed / cancelled as terminal", () => {
    for (const s of ["completed", "visit_fee", "disputed", "cancelled"] as const) {
      expect(isTerminal(s)).toBe(true);
      expect(canTransition(s, "accepted")).toBe(false);
    }
    expect(isTerminal("requested")).toBe(false);
  });
});

// local helper mirroring engine rounding for the reconciliation assertion
function round2cents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
