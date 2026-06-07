// POST jobs-accept — a pro accepts a requested (non-open) job.
// Enforces the guardrail (verified, not paused) and trade match, then assigns
// the pro and moves the job to `accepted`.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, loadProProfile, assertProCanWork, updateJob } from "../_shared/jobs.ts";
import { canTransition } from "../_shared/engine.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const pro = await loadProProfile(service, user.id);
  assertProCanWork(pro);

  const job = await loadJob(service, jobId);
  if (job.is_open) throw new HttpError(409, "Open jobs are taken via claim/select");
  if (!canTransition(job.status, "accepted")) throw new HttpError(409, `Cannot accept a ${job.status} job`);
  // Targeted request must match this pro; otherwise it must be unassigned.
  if (job.pro_id && job.pro_id !== user.id) throw new HttpError(403, "Job is assigned to another pro");
  if (!pro.trades.includes(job.trade)) throw new HttpError(403, "Job is not in your trades");

  const updated = await updateJob(service, jobId, {
    pro_id: user.id,
    status: "accepted",
    accepted_at: new Date().toISOString(),
  });
  return json({ job: updated });
}));
