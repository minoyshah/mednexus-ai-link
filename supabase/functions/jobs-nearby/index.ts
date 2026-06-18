// GET/POST jobs-nearby — requests visible to the calling pro: matching trade,
// inside their service area, and only if they're verified/active/online
// (rules 7 & 9). All of that is enforced inside the nearby_jobs() RPC.
import { handle, json } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(handle(async (req) => {
  const { client } = await requireUser(req); // user-scoped: RPC keys off auth.uid()
  const { data, error } = await client.rpc("nearby_jobs");
  if (error) throw error;
  return json({ jobs: data ?? [] });
}));
