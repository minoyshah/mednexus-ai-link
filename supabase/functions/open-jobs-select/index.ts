// POST open-jobs-select — the customer picks one claiming pro for an open job.
// Assigns the pro, prices the job at the posted budget (server computes the
// fee/payout), and marks the other claims rejected.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, assertCustomer, quoteFields, updateJob } from "../_shared/jobs.ts";
import { canTransition } from "../_shared/engine.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const proId = reqUuid(body, "pro_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertCustomer(job, user.id);
  if (!job.is_open || !canTransition(job.status, "accepted")) {
    throw new HttpError(409, `Cannot select a pro for a ${job.status} job`);
  }

  // The chosen pro must actually have claimed this job.
  const { data: claim } = await service
    .from("job_claims").select("id").eq("job_id", jobId).eq("pro_id", proId).maybeSingle();
  if (!claim) throw new HttpError(404, "That pro has not claimed this job");

  // Price the open job at the agreed budget (labor only, no parts).
  const updated = await updateJob(service, jobId, {
    pro_id: proId,
    status: "accepted",
    accepted_at: new Date().toISOString(),
    ...quoteFields(0, job.budget ?? 0),
  });

  await service.from("job_claims").update({ status: "rejected" }).eq("job_id", jobId);
  await service.from("job_claims").update({ status: "selected" }).eq("job_id", jobId).eq("pro_id", proId);

  return json({ job: updated });
}));
