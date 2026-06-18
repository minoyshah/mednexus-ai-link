// POST jobs-needs-part — the pro can't finish today and schedules a return.
// A parts deposit is computed now (charged in the Stripe step) so the pro isn't
// fronting the cost; labor is captured on completion. Sets `awaiting_part`.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqMoney, optMoney, optString } from "../_shared/validate.ts";
import { loadJob, assertAssignedPro, quoteFields, updateJob } from "../_shared/jobs.ts";
import { canTransition, splitJob } from "../_shared/engine.ts";
import { getStripe, offSessionCharge } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const parts = reqMoney(body, "parts_amount");
  const labor = optMoney(body, "labor_amount") ?? 0;
  const returnDate = optString(body, "return_date");
  const partNote = optString(body, "part_note");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertAssignedPro(job, user.id);
  if (!canTransition(job.status, "awaiting_part")) {
    throw new HttpError(409, `Cannot schedule a return from ${job.status}`);
  }

  // Charge the parts deposit now (5% parts fee) so the pro isn't fronting cost;
  // the labor balance stays on the booking hold and is captured on completion.
  if (parts > 0) {
    const partsFee = splitJob(parts, 0).fee;
    await offSessionCharge(service, getStripe(), job, "deposit", parts, partsFee);
  }

  const updated = await updateJob(service, jobId, {
    ...quoteFields(parts, labor),
    deposit_amount: parts, // parts deposit charged on approval
    status: "awaiting_part",
    return_date: returnDate,
    part_note: partNote,
  });
  return json({ job: updated });
}));
