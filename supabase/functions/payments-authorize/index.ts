// POST payments-authorize — the customer books a quoted job: place a
// manual-capture hold for the agreed price (Aquilla fee + pro destination).
// Returns the PaymentIntent client_secret for the client to confirm the card.
// Funds are only captured later, on completion.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, assertCustomer } from "../_shared/jobs.ts";
import { getStripe, authorizeJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertCustomer(job, user.id);
  if (job.status !== "requested" && job.status !== "accepted") {
    throw new HttpError(409, `Cannot authorize payment for a ${job.status} job`);
  }

  const pi = await authorizeJob(service, getStripe(), job);
  return json({ payment_intent_id: pi.id, client_secret: pi.client_secret });
}));
