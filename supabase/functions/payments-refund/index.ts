// POST payments-refund — refund a captured job or void a still-held one.
// Customer-initiated for their own job. (Admin dispute resolution uses the same
// underlying refundJob helper via disputes-resolve.)
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, assertCustomer } from "../_shared/jobs.ts";
import { getStripe, refundJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertCustomer(job, user.id);

  const result = await refundJob(service, getStripe(), jobId);
  if (result === "none") throw new HttpError(404, "No payment to refund");
  return json({ result });
}));
