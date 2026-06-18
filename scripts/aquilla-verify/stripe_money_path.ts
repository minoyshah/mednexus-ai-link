/**
 * Aquilla Stripe money-path verifier (TEST MODE).
 *
 * Drives the full marketplace money path against the real Stripe test API and
 * asserts every integer-cent amount against the canonical fee engine in
 * supabase/functions/_shared/engine.ts — the SAME module the Edge Functions
 * use — so there is zero drift between what we assert and what ships.
 *
 * It mirrors the exact Stripe calls in supabase/functions/_shared/stripe.ts:
 *   onboarding   → create a payout-ready connected account (transfers active)
 *   authorize    → manual-capture destination charge, application_fee_amount,
 *                  transfer_data.destination, setup_future_usage off_session
 *   capture      → capture the hold; the destination transfer = the pro payout
 *   refund       → refund_application_fee + reverse_transfer (full unwind)
 *   void         → cancel an uncaptured hold (no money moves)
 *   visit fee    → off-session $20 charge, 15% fee split
 *   dispute      → chargeback; assert the dispute amount == the charge
 *
 * Connected-account note: production uses Express + hosted AccountLink onboarding
 * (stripe-connect-link), which cannot be completed unattended. To make a test
 * account programmatically transfer-ready, this harness creates a *Custom* test
 * account with Stripe's test verification triggers. The fee/transfer MATH that
 * the platform relies on is identical for both account types.
 *
 * Safety: refuses to run against a live key (must be sk_test_...). Creates only
 * Stripe test objects; makes no database writes (that is verify_schema.sql's job).
 *
 * Run:  npm i && npm run stripe     (from scripts/aquilla-verify/)
 * Exit code is non-zero if ANY assertion fails.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Stripe from "stripe";
import {
  splitJob,
  splitLabor,
  splitVisitFee,
  paymentAmounts,
  toCents,
  VISIT_FEE,
} from "../../supabase/functions/_shared/engine.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config / secrets
// ---------------------------------------------------------------------------
function loadEnvLocal(): void {
  // Minimal .env.local loader (repo root), so STRIPE_SECRET_KEY can live there.
  try {
    const path = resolve(__dirname, "../../.env.local");
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      if (process.env[k]) continue; // real env wins
      const v = vRaw.replace(/^["']|["']$/g, "");
      if (v) process.env[k] = v;
    }
  } catch {
    /* no .env.local — rely on process.env */
  }
}
loadEnvLocal();

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
if (!KEY) {
  console.error("✗ STRIPE_SECRET_KEY is not set (put it in .env.local or the environment).");
  process.exit(2);
}
if (!KEY.startsWith("sk_test_")) {
  console.error("✗ Refusing to run: STRIPE_SECRET_KEY is not a test key (must start with sk_test_).");
  process.exit(2);
}

// Pin the same API version the Edge Functions use (_shared/stripe.ts).
const stripe = new Stripe(KEY, { apiVersion: "2024-12-18.acacia" });

// ---------------------------------------------------------------------------
// Assertion harness
// ---------------------------------------------------------------------------
type Result = { label: string; pass: boolean; got: unknown; want: unknown };
const results: Result[] = [];

function check(label: string, got: unknown, want: unknown): boolean {
  const pass = got === want;
  results.push({ label, pass, got, want });
  const tag = pass ? "  ✓" : "  ✗";
  console.log(`${tag} ${label}: got ${fmt(got)}${pass ? "" : `  EXPECTED ${fmt(want)}`}`);
  return pass;
}
function note(msg: string) { console.log(`    · ${msg}`); }
function section(title: string) { console.log(`\n=== ${title} ===`); }
function fmt(v: unknown) { return typeof v === "number" ? `${v}¢` : JSON.stringify(v); }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Stripe helpers (mirror _shared/stripe.ts behaviour)
// ---------------------------------------------------------------------------

/** Create a Custom test connected account and wait until transfers are active. */
async function createPayoutReadyPro(): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: { mcc: "1520", url: "https://example.com", product_description: "Home services" },
    individual: {
      first_name: "Test", last_name: "Pro",
      email: `pro_${Date.now()}@example.com`,
      phone: "+15555550123",
      dob: { day: 1, month: 1, year: 1990 },
      ssn_last_4: "0000",
      id_number: "000000000",
      address: { line1: "address_full_match", city: "San Francisco", state: "CA", postal_code: "94103", country: "US" },
    },
    tos_acceptance: { date: Math.floor(Date.now() / 1000), ip: "127.0.0.1" },
    external_account: "btok_us_verified", // Stripe test bank token (pre-verified)
  });

  // Poll until the transfers capability is active (destination charges need it).
  let acct = account;
  for (let i = 0; i < 20; i++) {
    if (acct.capabilities?.transfers === "active") break;
    await sleep(1500);
    acct = await stripe.accounts.retrieve(account.id);
  }
  return acct;
}

/** Create a platform customer with a saved card (mirrors ensureCustomer + booking). */
async function createCustomerWithCard(): Promise<{ customer: string; pm: string }> {
  const customer = await stripe.customers.create({
    email: `cust_${Date.now()}@example.com`,
    name: "Test Customer",
  });
  const pm = await stripe.paymentMethods.create({ type: "card", card: { token: "tok_visa" } });
  await stripe.paymentMethods.attach(pm.id, { customer: customer.id });
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } });
  return { customer: customer.id, pm: pm.id };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

/**
 * authorize → capture → transfer(payout), asserting every cent against the
 * engine. Mirrors authorizeJob() + captureJob().
 */
async function scenarioAuthorizeCapture(
  name: string,
  parts: number,
  labor: number,
  ctx: { customer: string; pm: string; destination: string },
) {
  section(`Authorize + capture — ${name}`);
  const { fee, total, payout } = splitJob(parts, labor);
  const { amountCents, applicationFeeCents } = paymentAmounts(total, fee);
  const netCents = amountCents - applicationFeeCents; // what should reach the pro
  note(`engine: total $${total} fee $${fee} payout $${payout}  →  charge ${amountCents}¢ / fee ${applicationFeeCents}¢ / transfer ${netCents}¢`);
  check("engine payout matches charge − fee", toCents(payout), netCents);

  const jobId = `job_${name}_${Date.now()}`;
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    capture_method: "manual",
    customer: ctx.customer,
    payment_method: ctx.pm,
    confirm: true,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: ctx.destination },
    setup_future_usage: "off_session",
    metadata: { job_id: jobId, kind: "authorization" },
  }, { idempotencyKey: `auth_${jobId}` });

  check("PI amount", pi.amount, amountCents);
  check("PI application_fee_amount", pi.application_fee_amount, applicationFeeCents);
  check("PI status after authorize", pi.status, "requires_capture");
  check("transfer destination set", pi.transfer_data?.destination, ctx.destination);

  const captured = await stripe.paymentIntents.capture(pi.id, { idempotencyKey: `cap_${jobId}` });
  check("PI status after capture", captured.status, "succeeded");

  const charge = await stripe.charges.retrieve(captured.latest_charge as string, {
    expand: ["transfer", "application_fee"],
  });
  check("charge amount", charge.amount, amountCents);
  check("charge application_fee_amount", charge.application_fee_amount, applicationFeeCents);
  const transfer = charge.transfer as Stripe.Transfer | null;
  check("destination transfer (pro payout) amount", transfer?.amount, netCents);

  return { piId: pi.id, jobId, amountCents, applicationFeeCents, netCents };
}

/** authorize → capture → full refund (reverse transfer + refund fee). */
async function scenarioRefund(ctx: { customer: string; pm: string; destination: string }) {
  section("Refund path — authorize, capture, full refund");
  const labor = 150;
  const { fee, total } = splitLabor(labor);
  const { amountCents, applicationFeeCents } = paymentAmounts(total, fee);
  const netCents = amountCents - applicationFeeCents;

  const jobId = `job_refund_${Date.now()}`;
  const pi = await stripe.paymentIntents.create({
    amount: amountCents, currency: "usd", capture_method: "manual",
    customer: ctx.customer, payment_method: ctx.pm, confirm: true,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: ctx.destination },
    metadata: { job_id: jobId, kind: "authorization" },
  }, { idempotencyKey: `auth_${jobId}` });
  await stripe.paymentIntents.capture(pi.id, { idempotencyKey: `cap_${jobId}` });

  const refund = await stripe.refunds.create({
    payment_intent: pi.id,
    refund_application_fee: true,
    reverse_transfer: true,
  }, { idempotencyKey: `refund_${jobId}` });
  check("refund amount == full charge", refund.amount, amountCents);

  const charge = await stripe.charges.retrieve(
    (await stripe.paymentIntents.retrieve(pi.id)).latest_charge as string,
    { expand: ["transfer", "application_fee"] },
  );
  const transfer = charge.transfer as Stripe.Transfer | null;
  check("transfer fully reversed", transfer?.amount_reversed, netCents);
  const appFee = charge.application_fee as Stripe.ApplicationFee | null;
  check("application fee refunded", appFee?.amount_refunded, applicationFeeCents);
}

/** authorize-only → void (cancel) an uncaptured hold; no money should move. */
async function scenarioVoid(ctx: { customer: string; pm: string; destination: string }) {
  section("Void path — authorize then cancel uncaptured hold");
  const { fee, total } = splitLabor(80);
  const { amountCents, applicationFeeCents } = paymentAmounts(total, fee);
  const jobId = `job_void_${Date.now()}`;
  const pi = await stripe.paymentIntents.create({
    amount: amountCents, currency: "usd", capture_method: "manual",
    customer: ctx.customer, payment_method: ctx.pm, confirm: true,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: ctx.destination },
    metadata: { job_id: jobId, kind: "authorization" },
  }, { idempotencyKey: `auth_${jobId}` });
  check("PI held before void", pi.status, "requires_capture");
  const canceled = await stripe.paymentIntents.cancel(pi.id);
  check("PI status after void", canceled.status, "canceled");
  check("no charge captured on void", canceled.latest_charge, null);
}

/** off-session $20 visit fee, split 15% (mirrors offSessionCharge). */
async function scenarioVisitFee(ctx: { customer: string; pm: string; destination: string }) {
  section("Visit-fee path — off-session $20 charge, 15% split");
  const { fee, payout } = splitVisitFee();
  const amountCents = toCents(VISIT_FEE);
  const applicationFeeCents = Math.min(toCents(fee), amountCents);
  const netCents = amountCents - applicationFeeCents;
  note(`engine: visit fee $${VISIT_FEE} → fee $${fee} / payout $${payout}`);
  check("engine visit-fee split is $3 / $17", `${fee}/${payout}`, "3/17");

  const jobId = `job_visit_${Date.now()}`;
  const pi = await stripe.paymentIntents.create({
    amount: amountCents, currency: "usd",
    customer: ctx.customer, payment_method: ctx.pm,
    off_session: true, confirm: true,
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: ctx.destination },
    metadata: { job_id: jobId, kind: "visit_fee" },
  }, { idempotencyKey: `visit_fee_${jobId}` });

  check("visit-fee charge amount", pi.amount, 2000);
  check("visit-fee application_fee_amount", pi.application_fee_amount, 300);
  check("visit-fee PI succeeded off-session", pi.status, "succeeded");
  const charge = await stripe.charges.retrieve(pi.latest_charge as string, { expand: ["transfer"] });
  check("visit-fee pro transfer (= $17)", (charge.transfer as Stripe.Transfer | null)?.amount, netCents);
}

/** chargeback path — assert the dispute amount equals the charge (webhook keys on this). */
async function scenarioDispute() {
  section("Dispute path — chargeback amount == charge amount");
  const { total } = splitLabor(150);
  const amountCents = toCents(total); // 15000
  const jobId = `job_dispute_${Date.now()}`;

  // Direct charge with Stripe's "creates a dispute" test PM, then poll for it.
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    payment_method: "pm_card_createDispute",
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { job_id: jobId, kind: "authorization" },
  });
  check("disputed charge amount", pi.amount, amountCents);

  let dispute: Stripe.Dispute | undefined;
  for (let i = 0; i < 16; i++) {
    const list = await stripe.disputes.list({ payment_intent: pi.id, limit: 1 });
    if (list.data.length) { dispute = list.data[0]; break; }
    await sleep(2000);
  }
  if (!dispute) {
    note("dispute not yet created by Stripe (async) — amount parity unverified this run, not a mismatch");
    return;
  }
  check("dispute amount == charge amount", dispute.amount, amountCents);
  note(`dispute status: ${dispute.status} (webhook charge.dispute.created flips job → disputed)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("Aquilla Stripe money-path verifier (TEST MODE)\n");

  section("Connected-account onboarding");
  const pro = await createPayoutReadyPro();
  check("connected account created", typeof pro.id === "string" && pro.id.startsWith("acct_"), true);
  check("transfers capability active", pro.capabilities?.transfers, "active");
  if (pro.capabilities?.transfers !== "active") {
    note("transfers capability not active yet — destination charges below will fail.");
    note("Re-run in a few seconds; test verification can take a moment to settle.");
  }
  check("payouts_enabled", pro.payouts_enabled, true);

  const card = await createCustomerWithCard();
  note(`customer ${card.customer} with saved card ready`);
  const ctx = { customer: card.customer, pm: card.pm, destination: pro.id };

  // Money-path scenarios, every amount asserted against the engine.
  await scenarioAuthorizeCapture("labor-only $150", 0, 150, ctx);
  await scenarioAuthorizeCapture("parts $60 + labor $130", 60, 130, ctx);
  await scenarioVisitFee(ctx);
  await scenarioVoid(ctx);
  await scenarioRefund(ctx);
  await scenarioDispute();

  // Summary
  const failed = results.filter((r) => !r.pass);
  console.log(`\n================  summary  ================`);
  console.log(`  ${results.length - failed.length} passed, ${failed.length} failed, ${results.length} total`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  ✗ ${f.label}: got ${fmt(f.got)} expected ${fmt(f.want)}`);
    process.exit(1);
  }
  console.log("  ALL MONEY-PATH ASSERTIONS PASSED");
}

main().catch((e) => {
  console.error("\n✗ Harness error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
