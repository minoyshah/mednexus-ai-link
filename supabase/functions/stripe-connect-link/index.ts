// POST stripe-connect-link — start/continue a pro's Stripe Connect payout setup.
// Creates an Express connected account if needed and returns an onboarding link.
// `payouts_enabled` is flipped later by the account.updated webhook.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const stripe = getStripe();
  const service = serviceClient();

  const { data: pro } = await service
    .from("pro_profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!pro) throw new HttpError(403, "Complete pro onboarding first");

  let accountId = pro.stripe_account_id as string | null;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_type: "individual",
      metadata: { user_id: user.id },
    });
    accountId = account.id;
    await service.from("pro_profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: Deno.env.get("STRIPE_CONNECT_REFRESH_URL") ?? "http://localhost:8080/pro/onboarding",
    return_url: Deno.env.get("STRIPE_CONNECT_RETURN_URL") ?? "http://localhost:8080/pro",
    type: "account_onboarding",
  });
  return json({ url: link.url });
}));
