import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { HttpError } from "./http.ts";
import { paymentAmounts, toCents, type JobStatusName } from "./engine.ts";

const SECRET = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

/** Lazily-built Stripe client (Deno fetch transport). Throws if unconfigured. */
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!SECRET) throw new HttpError(500, "STRIPE_SECRET_KEY is not configured");
  if (!_stripe) {
    _stripe = new Stripe(SECRET, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return _stripe;
}

interface JobLike {
  id: string;
  customer_id: string;
  pro_id: string | null;
  agreed_price: number;
  fee_amount: number;
  payout_amount: number;
  status: JobStatusName;
}

/** Get or create the platform Stripe customer for a user, cached on profiles. */
export async function ensureCustomer(
  service: SupabaseClient,
  stripe: Stripe,
  userId: string,
): Promise<string> {
  const { data: profile } = await service
    .from("profiles").select("stripe_customer_id, email, full_name, phone").eq("id", userId).single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: profile?.email ?? undefined,
    name: profile?.full_name ?? undefined,
    phone: profile?.phone ?? undefined,
    metadata: { user_id: userId },
  });
  await service.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

/** The pro's connected account id, or 403 if they aren't payout-ready. */
export async function proConnectedAccount(service: SupabaseClient, proId: string): Promise<string> {
  const { data } = await service
    .from("pro_profiles").select("stripe_account_id, payouts_enabled").eq("id", proId).single();
  if (!data?.stripe_account_id || !data.payouts_enabled) {
    throw new HttpError(409, "Pro has not finished Stripe payout setup");
  }
  return data.stripe_account_id;
}

/**
 * Authorize (hold) the agreed price for a job as a manual-capture destination
 * charge: Aquilla keeps the application fee, the rest is destined for the pro.
 * The customer's payment method is saved off-session so later visit-fee / parts
 * charges can be taken without re-prompting. Returns the PI for client confirm.
 */
export async function authorizeJob(service: SupabaseClient, stripe: Stripe, job: JobLike) {
  if (!job.pro_id) throw new HttpError(409, "Job has no assigned pro");
  if (job.agreed_price <= 0) throw new HttpError(409, "Job has no agreed price yet");

  const customer = await ensureCustomer(service, stripe, job.customer_id);
  const destination = await proConnectedAccount(service, job.pro_id);
  const { amountCents, applicationFeeCents } = paymentAmounts(job.agreed_price, job.fee_amount);

  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    capture_method: "manual",
    customer,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination },
    setup_future_usage: "off_session",
    metadata: { job_id: job.id, kind: "authorization" },
  }, { idempotencyKey: `auth_${job.id}` });

  await service.from("payments").insert({
    job_id: job.id, kind: "authorization", amount: job.agreed_price,
    stripe_payment_intent_id: pi.id, status: "requires_capture",
  });
  return pi;
}

/** Find the open authorization payment for a job, if any. */
async function authPayment(service: SupabaseClient, jobId: string) {
  const { data } = await service
    .from("payments").select("*").eq("job_id", jobId).eq("kind", "authorization")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

/**
 * Capture the held authorization on completion and record the pro payout.
 * Idempotent: a job already captured is left untouched.
 */
export async function captureJob(service: SupabaseClient, stripe: Stripe, job: JobLike) {
  const payment = await authPayment(service, job.id);
  if (!payment?.stripe_payment_intent_id) return; // nothing authorized (e.g. test/no-pay)
  if (payment.status === "captured") return; // already done

  await stripe.paymentIntents.capture(payment.stripe_payment_intent_id, {
    idempotencyKey: `cap_${job.id}`,
  });
  await service.from("payments").update({ status: "captured" }).eq("id", payment.id);

  // Record payout once (destination charge already routed funds to the pro).
  const { data: existing } = await service
    .from("payouts").select("id").eq("job_id", job.id).maybeSingle();
  if (!existing && job.pro_id) {
    await service.from("payouts").insert({
      job_id: job.id, pro_id: job.pro_id,
      amount: job.payout_amount, fee: job.fee_amount, status: "in_transit",
    });
  }
}

/** Void a held (uncaptured) authorization — used on cancellation/refund. */
export async function voidJob(service: SupabaseClient, stripe: Stripe, jobId: string) {
  const payment = await authPayment(service, jobId);
  if (!payment?.stripe_payment_intent_id || payment.status !== "requires_capture") return;
  await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
  await service.from("payments").update({ status: "canceled" }).eq("id", payment.id);
}

/**
 * Return funds to the customer: void the hold if still uncaptured, or refund +
 * reverse the transfer/fee if already captured. Idempotent per job.
 */
export async function refundJob(
  service: SupabaseClient,
  stripe: Stripe,
  jobId: string,
): Promise<"voided" | "refunded" | "none"> {
  const payment = await authPayment(service, jobId);
  if (!payment?.stripe_payment_intent_id) return "none";

  if (payment.status === "requires_capture") {
    await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
    await service.from("payments").update({ status: "canceled" }).eq("id", payment.id);
    return "voided";
  }
  if (payment.status === "captured") {
    await stripe.refunds.create(
      { payment_intent: payment.stripe_payment_intent_id, refund_application_fee: true, reverse_transfer: true },
      { idempotencyKey: `refund_${jobId}` },
    );
    await service.from("payments").update({ status: "refunded" }).eq("id", payment.id);
    await service.from("payouts").update({ status: "reversed" }).eq("job_id", jobId);
    return "refunded";
  }
  return "none";
}

/**
 * Immediate off-session charge against the customer's saved card (visit fee or
 * parts deposit), split with the pro's connected account. Used after the
 * customer has booked (so a payment method is on file).
 */
export async function offSessionCharge(
  service: SupabaseClient,
  stripe: Stripe,
  job: JobLike,
  kind: "visit_fee" | "deposit",
  amount: number,
  fee: number,
) {
  if (!job.pro_id) throw new HttpError(409, "Job has no assigned pro");
  const customer = await ensureCustomer(service, stripe, job.customer_id);
  const destination = await proConnectedAccount(service, job.pro_id);

  // Default payment method from the customer's saved cards.
  const methods = await stripe.paymentMethods.list({ customer, type: "card", limit: 1 });
  if (methods.data.length === 0) throw new HttpError(409, "No saved card to charge");

  const pi = await stripe.paymentIntents.create({
    amount: toCents(amount),
    currency: "usd",
    customer,
    payment_method: methods.data[0].id,
    off_session: true,
    confirm: true,
    application_fee_amount: Math.min(toCents(fee), toCents(amount)),
    transfer_data: { destination },
    metadata: { job_id: job.id, kind },
  }, { idempotencyKey: `${kind}_${job.id}` });

  await service.from("payments").insert({
    job_id: job.id, kind, amount,
    stripe_payment_intent_id: pi.id,
    status: pi.status === "succeeded" ? "captured" : "requires_capture",
  });
  return pi;
}
