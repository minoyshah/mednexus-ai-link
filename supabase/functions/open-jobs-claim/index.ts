// POST open-jobs-claim — a pro claims an open ("Other") broadcast job (rule 8).
// The customer later picks one of the claimants via open-jobs-select.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, loadProProfile, assertProCanWork } from "../_shared/jobs.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const pro = await loadProProfile(service, user.id);
  assertProCanWork(pro);

  const job = await loadJob(service, jobId);
  if (!job.is_open || job.status !== "requested") {
    throw new HttpError(409, "Job is not open for claims");
  }
  // Non-"other" open jobs still respect the pro's trades; "other" is anyone.
  if (job.trade !== "other" && !pro.trades.includes(job.trade)) {
    throw new HttpError(403, "Job is not in your trades");
  }

  const { data, error } = await service
    .from("job_claims")
    .insert({ job_id: jobId, pro_id: user.id, status: "claimed" })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "Already claimed");
    throw error;
  }
  return json({ claim: data }, 201);
}));
