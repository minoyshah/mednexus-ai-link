// POST disputes-resolve — admin settles a held dispute (rule 5: funds stay held
// until reviewed). Three outcomes:
//   release → pro is right: capture the hold, job completes, pro paid.
//   refund  → customer is right: refund/void the hold, no payout.
//   split   → capture `pro_amount` to the pro, the remainder is returned.
// Moving the job to `completed` also runs the guardrail trigger, so a fair
// resolution updates the pro's completion stats.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, optString, optMoney } from "../_shared/validate.ts";
import { assertAdmin } from "../_shared/admin.ts";
import { loadJob } from "../_shared/jobs.ts";
import { getStripe, captureJob, refundJob } from "../_shared/stripe.ts";
import { toCents } from "../_shared/engine.ts";

type Resolution = "release" | "refund" | "split";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const service = serviceClient();
  await assertAdmin(service, user.id);

  const body = await parseBody(req);
  const disputeId = reqUuid(body, "dispute_id");
  const resolution = body.resolution as Resolution;
  if (!["release", "refund", "split"].includes(resolution)) {
    throw new HttpError(400, "resolution must be release, refund, or split");
  }
  const note = optString(body, "note");

  const { data: dispute } = await service.from("disputes").select("*").eq("id", disputeId).single();
  if (!dispute) throw new HttpError(404, "Dispute not found");
  if (dispute.status !== "open") throw new HttpError(409, `Dispute already ${dispute.status}`);

  const job = await loadJob(service, dispute.job_id as string);
  const stripe = getStripe();

  let disputeStatus: string;
  let jobStatus: string;

  if (resolution === "release") {
    await captureJob(service, stripe, job); // pro paid in full
    disputeStatus = "resolved_release";
    jobStatus = "completed";
  } else if (resolution === "refund") {
    await refundJob(service, stripe, job.id); // customer made whole
    disputeStatus = "resolved_refund";
    jobStatus = "cancelled";
  } else {
    // split: capture only the admin-set amount to the pro; Stripe releases the rest.
    const proAmount = optMoney(body, "pro_amount");
    if (proAmount == null || proAmount <= 0 || proAmount > job.agreed_price) {
      throw new HttpError(400, "split requires a pro_amount between 0 and the agreed price");
    }
    const { data: payment } = await service
      .from("payments").select("*").eq("job_id", job.id).eq("kind", "authorization")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!payment?.stripe_payment_intent_id || payment.status !== "requires_capture") {
      throw new HttpError(409, "No held authorization to split");
    }
    await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
      amount_to_capture: toCents(proAmount),
      idempotencyKey: `split_${job.id}`,
    });
    await service.from("payments").update({ status: "captured" }).eq("id", payment.id);
    await service.from("payouts").insert({
      job_id: job.id, pro_id: job.pro_id, amount: proAmount, fee: 0, status: "in_transit",
    });
    disputeStatus = "resolved_split";
    jobStatus = "completed";
  }

  await service.from("jobs").update({ status: jobStatus }).eq("id", job.id);
  const { data: resolved } = await service.from("disputes").update({
    status: disputeStatus,
    resolution_note: note,
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  }).eq("id", disputeId).select("*").single();

  return json({ dispute: resolved, job_status: jobStatus });
}));
