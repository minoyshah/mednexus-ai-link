// POST jobs-quote — the assigned pro sets the agreed price for a job.
// The server computes the fee + payout from parts/labor; the client never does.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqMoney, optMoney } from "../_shared/validate.ts";
import { loadJob, assertAssignedPro, quoteFields, updateJob } from "../_shared/jobs.ts";
import { isTerminal } from "../_shared/engine.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const labor = reqMoney(body, "labor_amount");
  const parts = optMoney(body, "parts_amount") ?? 0;

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertAssignedPro(job, user.id);
  if (isTerminal(job.status)) throw new HttpError(409, `Job is ${job.status}`);

  const updated = await updateJob(service, jobId, quoteFields(parts, labor));
  return json({ job: updated });
}));
