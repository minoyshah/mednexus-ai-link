// POST stripe-webhook — Stripe → Aquilla event sink. Public function
// (verify_jwt=false in config.toml); authenticated by the Stripe signature.
// Idempotent via the webhook_events table so retried events are no-ops.
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";
import { getStripe } from "../_shared/stripe.ts";

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      raw, sig!, WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider(),
    );
  } catch (e) {
    return new Response(`Bad signature: ${e instanceof Error ? e.message : e}`, { status: 400 });
  }

  const service = serviceClient();

  // Idempotency: first writer wins; duplicates short-circuit.
  const { error: dupe } = await service
    .from("webhook_events")
    .insert({ stripe_event_id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });
  if (dupe) {
    if (dupe.code === "23505") return new Response("ok (duplicate)", { status: 200 });
    console.error("webhook_events insert failed:", dupe.message);
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await service.from("pro_profiles")
          .update({ payouts_enabled: !!acct.payouts_enabled && !!acct.charges_enabled })
          .eq("stripe_account_id", acct.id);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.job_id;
        await service.from("payments").update({ status: "captured" }).eq("stripe_payment_intent_id", pi.id);
        // Ensure a payout is on record for a captured authorization.
        if (jobId && pi.metadata?.kind === "authorization") {
          const { data: job } = await service.from("jobs")
            .select("pro_id, payout_amount, fee_amount").eq("id", jobId).single();
          const { data: existing } = await service.from("payouts").select("id").eq("job_id", jobId).maybeSingle();
          if (job?.pro_id && !existing) {
            await service.from("payouts").insert({
              job_id: jobId, pro_id: job.pro_id,
              amount: job.payout_amount, fee: job.fee_amount, status: "in_transit",
            });
          }
        }
        break;
      }
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await service.from("payments").update({ status: "canceled" }).eq("stripe_payment_intent_id", pi.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await service.from("payments").update({ status: "failed" }).eq("stripe_payment_intent_id", pi.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await service.from("payments").update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent as string);
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const pi = dispute.payment_intent as string | null;
        if (pi) {
          const { data: payment } = await service.from("payments")
            .select("job_id").eq("stripe_payment_intent_id", pi).maybeSingle();
          if (payment?.job_id) {
            await service.from("jobs").update({ status: "disputed" }).eq("id", payment.job_id);
            await service.from("disputes").insert({ job_id: payment.job_id, reason: "stripe chargeback" });
          }
        }
        break;
      }
      default:
        break; // ignore unhandled types
    }

    await service.from("webhook_events").update({ processed: true }).eq("stripe_event_id", event.id);
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(`webhook ${event.type} handler error:`, e);
    return new Response("handler error", { status: 500 }); // let Stripe retry
  }
});
