import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { HttpError } from "./http.ts";

/** Throw 403 unless the user is a platform admin (profiles.is_admin). */
export async function assertAdmin(service: SupabaseClient, userId: string): Promise<void> {
  const { data } = await service.from("profiles").select("is_admin").eq("id", userId).single();
  if (!data?.is_admin) throw new HttpError(403, "Admin only");
}
