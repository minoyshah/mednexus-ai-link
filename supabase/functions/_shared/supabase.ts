import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { HttpError } from "./http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/**
 * Client scoped to the caller's JWT. Subject to RLS — use it for reads and to
 * confirm the caller's identity, never to bypass policies.
 */
export function userClient(req: Request): SupabaseClient {
  const authorization = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
}

/**
 * Service-role client. Bypasses RLS — use ONLY for server-authoritative writes
 * (prices, status transitions, payouts) after the caller has been authorized.
 */
export function serviceClient(): SupabaseClient {
  if (!SERVICE_ROLE_KEY) throw new HttpError(500, "Service role key not configured");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Resolve and require the authenticated caller, or throw 401. */
export async function requireUser(req: Request): Promise<{ user: User; client: SupabaseClient }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new HttpError(401, "Missing Authorization header");
  const client = userClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Unauthorized");
  return { user: data.user, client };
}
