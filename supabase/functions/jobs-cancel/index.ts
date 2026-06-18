// POST jobs-cancel — the customer cancels before the pro arrives (any payment
// authorization is voided in the Stripe step).
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid } from "../_shared/validate.ts";
import { loadJob, assertCustomer, updateJob } from "../_shared/jobs.ts";
import { canTransition } from "../_shared/engine.ts";
import { getStripe, voidJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");

  const service = serviceClient();
  const job = await loadJob(service, jobId);
  assertCustomer(job, user.id);
  if (!canTransition(job.status, "cancelled")) {
    throw new HttpError(409, `Cannot cancel a ${job.status} job`);
  }

  // Release any uncaptured authorization hold (no-op if nothing was authorized).
  // Best-effort: a Stripe hiccup shouldn't block the cancellation itself.
  try {
    await voidJob(service, getStripe(), jobId);
  } catch (e) {
    console.error("void on cancel failed:", e instanceof Error ? e.message : e);
  }

  const updated = await updateJob(service, jobId, {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  });
  return json({ job: updated });
}));
