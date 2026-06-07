// POST jobs-update-status — the assigned pro advances the dispatch state
// (en_route → arrived). Other transitions have their own dedicated endpoints.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqString } from "../_shared/validate.ts";
import { loadJob, assertAssignedPro, updateJob } from "../_shared/jobs.ts";
import { canTransition, DISPATCH_STATUSES, type JobStatusName } from "../_shared/engine.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const status = reqString(body, "status") as JobStatusName;

  if (!DISPATCH_STATUSES.includes(status)) {
    throw new HttpError(400, "status must be one of: " + DISPATCH_STATUSES.join(", "));
  }

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertAssignedPro(job, user.id);
  if (!canTransition(job.status, status)) {
    throw new HttpError(409, `Cannot move from ${job.status} to ${status}`);
  }

  const updated = await updateJob(service, jobId, { status });
  return json({ job: updated });
}));
