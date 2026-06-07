// POST jobs-confirm — either side confirms (or disputes) completion.
// Delegates to the submit_confirmation() SECURITY DEFINER RPC, called with the
// caller's own JWT so the DB knows which side answered. Both-complete → job
// completes (funds released in the Stripe step); disagreement → disputed/held.
import { handle, json } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqBool } from "../_shared/validate.ts";

Deno.serve(handle(async (req) => {
  const { client } = await requireUser(req); // user-scoped: auth.uid() identifies the side
  const body = await parseBody(req);
  const jobId = reqUuid(body, "job_id");
  const completed = reqBool(body, "completed");

  const { data, error } = await client.rpc("submit_confirmation", {
    p_job: jobId,
    p_completed: completed,
  });
  if (error) throw error;
  return json({ status: data });
}));
