// POST jobs-visit-fee — the job couldn't be completed; charge the $20 visit fee
// (Aquilla still takes 15%). Blocked by the guardrail for pros under review
// (rule 7). Counts against the pro's completion rate via the DB trigger.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, loadProProfile, assertProCanWork, assertAssignedPro, updateJob } from "../_shared/jobs.ts";
import { canTransition, splitVisitFee, VISIT_FEE } from "../_shared/engine.ts";
import { getStripe, offSessionCharge, voidJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertAssignedPro(job, user.id);

  // Guardrail: pros under review can't charge the visit fee.
  const pro = await loadProProfile(service, user.id);
  assertProCanWork(pro);

  if (!canTransition(job.status, "visit_fee")) {
    throw new HttpError(409, `Cannot charge a visit fee from ${job.status}`);
  }

  const { fee, payout } = splitVisitFee();

  // Charge the $20 visit fee off-session, then release the labor hold from booking.
  const stripe = getStripe();
  await offSessionCharge(service, stripe, job, "visit_fee", VISIT_FEE, fee);
  await voidJob(service, stripe, jobId);

  const updated = await updateJob(service, jobId, {
    visit_fee_amount: VISIT_FEE,
    agreed_price: VISIT_FEE,
    fee_amount: fee,
    payout_amount: payout,
    status: "visit_fee",
    completed_at: new Date().toISOString(),
  });
  return json({ job: updated });
}));
