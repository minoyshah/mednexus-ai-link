// POST jobs-confirm — either side confirms (or disputes) completion.
// Delegates to the submit_confirmation() SECURITY DEFINER RPC, called with the
// caller's own JWT so the DB knows which side answered. Both-complete → job
// completes (funds released in the Stripe step); disagreement → disputed/held.
import { handle, json } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqBool } from "../_shared/validate.ts";
import { loadJob } from "../_shared/jobs.ts";
import { getStripe, captureJob } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { client } = await requireUser(req); // user-scoped: auth.uid() identifies the side
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const completed = reqBool(body, "completed");

  const { data: status, error } = await client.rpc("submit_confirmation", {
    p_job: jobId,
    p_completed: completed,
  });
  if (error) throw error;

  // Both sides agreed → release the held funds and record the payout. The
  // confirmation already committed in the DB, so a capture hiccup must not fail
  // the request — the webhook / cron-auto-confirm reconciles uncaptured holds.
  if (status === "completed") {
    try {
      const service = serviceClient();
      const job = await loadJob(service, jobId);
      await captureJob(service, getStripe(), job);
    } catch (e) {
      console.error("capture on confirm failed (will reconcile):", e instanceof Error ? e.message : e);
    }
  }
  return json({ status });
}));
