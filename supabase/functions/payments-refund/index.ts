// POST payments-refund — refund a captured job or void a still-held one.
// Customer-initiated for their own job, or used when a dispute resolves in the
// customer's favor. (Admin dispute resolution arrives in Step 6.)
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, assertCustomer } from "../_shared/jobs.ts";
import { getStripe, voidJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertCustomer(job, user.id);
  const stripe = getStripe();

  const { data: payment } = await service
    .from("payments").select("*").eq("job_id", jobId).eq("kind", "authorization")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!payment?.stripe_payment_intent_id) throw new HttpError(404, "No payment to refund");

  if (payment.status === "requires_capture") {
    await voidJob(service, stripe, jobId);
    return json({ result: "voided" });
  }
  if (payment.status === "captured") {
    const refund = await stripe.refunds.create(
      { payment_intent: payment.stripe_payment_intent_id, refund_application_fee: true, reverse_transfer: true },
      { idempotencyKey: `refund_${jobId}` },
    );
    await service.from("payments").update({ status: "refunded" }).eq("id", payment.id);
    await service.from("payouts").update({ status: "reversed" }).eq("job_id", jobId);
    return json({ result: "refunded", refund_id: refund.id });
  }
  throw new HttpError(409, `Payment is ${payment.status}; nothing to refund`);
}));
