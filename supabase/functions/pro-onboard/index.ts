// POST pro-onboard — create/update the caller's pro profile (rule: pros must
// complete onboarding before receiving jobs). Licensed trades require a license
// + insurance; everyone consents to a background check. Verification stays
// `pending` until approved (handled separately), so onboarding alone does not
// grant job access.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, optString, reqBool, isTrade, LICENSED_TRADES, type Trade } from "../_shared/validate.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);

  const trades = body.trades;
  if (!Array.isArray(trades) || trades.length === 0 || !trades.every(isTrade)) {
    throw new HttpError(400, "trades must be a non-empty array of valid trades");
  }
  const needsLicense = (trades as Trade[]).some((t) => LICENSED_TRADES.has(t));

  const area = optString(body, "area");
  const radiusMiles = typeof body.radius_miles === "number" ? Math.round(body.radius_miles) : 10;
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;
  const insured = body.insured === true;
  const consent = reqBool(body, "background_check_consent");
  if (!consent) throw new HttpError(400, "Background check consent is required");

  const license_number = optString(body, "license_number");
  const license_state = optString(body, "license_state");
  if (needsLicense && (!license_number || !license_state || !insured)) {
    throw new HttpError(400, "Licensed trades require a license number, state, and insurance");
  }

  const service = serviceClient();
  const { data, error } = await service
    .from("pro_profiles")
    .upsert({
      id: user.id,
      trades,
      area,
      lat,
      lng,
      radius_miles: radiusMiles,
      experience: optString(body, "experience"),
      license_number,
      license_state: license_state ? license_state.toUpperCase() : null,
      insured,
      background_check_consent: consent,
      verification_status: "pending",
      status: "onboarding",
    }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;

  await service.from("profiles").update({ is_pro: true }).eq("id", user.id);
  return json({ pro_profile: data }, 201);
}));
