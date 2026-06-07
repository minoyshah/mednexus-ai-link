// POST pro-verify — admin approves or rejects a pro's verification. This is the
// gate the whole job pipeline depends on: jobs-accept, jobs-nearby,
// open-jobs-claim and jobs-visit-fee all require verification_status=verified.
// Approving activates the pro; rejecting sends them back to onboarding.
import { handle, json } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqUuid, reqBool } from "../_shared/validate.ts";
import { assertAdmin } from "../_shared/admin.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const service = serviceClient();
  await assertAdmin(service, user.id);

  const body = await parseBody(req);
  const proId = reqUuid(body, "pro_id");
  const approve = reqBool(body, "approve");

  const { data, error } = await service
    .from("pro_profiles")
    .update({
      verification_status: approve ? "verified" : "rejected",
      status: approve ? "active" : "onboarding",
    })
    .eq("id", proId)
    .select("id, verification_status, status")
    .single();
  if (error) throw error;
  return json({ pro_profile: data });
}));
