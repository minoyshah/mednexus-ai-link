# Aquilla backend verifier (turnkey)

Two checkers you run **where egress to Supabase + Stripe is open** (the cloud
session this was built in cannot reach those hosts — `host_not_allowed`). Both
read their secrets from the repo-root `.env.local`.

| Checker | What it proves | Mutates data? |
|---|---|---|
| `verify_schema.sql` | Every enum/table/column/constraint/RLS policy/trigger/function the migrations declare exists in the live DB, **and** the DB fee mirror `aquilla_split_job()` equals `engine.ts`. | No (read-only; uses a TEMP table only). Safe to re-run. |
| `stripe_money_path.ts` | The full money path (onboarding → authorize → capture → fee split → transfer/payout → refund → void → visit fee → dispute) with **every cent asserted against the real `engine.ts`**. | No DB writes. Creates Stripe **test-mode** objects only. |

## 0. Prerequisites

- Node ≥ 18 (for the Stripe script) and `psql` (for the SQL verifier).
- `.env.local` filled in at the repo root (see its inline comments). The keys
  these checkers use:
  - `SUPABASE_DB_URL` — Postgres connection string (direct or session pooler).
  - `STRIPE_SECRET_KEY` — a **test** key (`sk_test_...`). The script refuses a
    live key.

> Run the migrations first (`supabase link` + `supabase db push`, or
> `supabase db reset` locally) so there is a schema to verify.

## 1. SQL schema verifier

```bash
# from repo root, with SUPABASE_DB_URL set in .env.local:
set -a; . ./.env.local; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f scripts/aquilla-verify/verify_schema.sql
```

- Prints a `category | object | status | detail` table (failures first), a
  summary count, then `ALL CHECKS PASSED` — or raises and **exits non-zero**
  listing how many checks FAILed.
- Idempotent: only reads system catalogs and calls the pure `aquilla_split_job`
  / `haversine_miles` functions; it never touches application rows.

## 2. Stripe money-path verifier

```bash
cd scripts/aquilla-verify
npm install
npm run stripe          # reads STRIPE_SECRET_KEY from ../../.env.local
```

What it does, asserting against `supabase/functions/_shared/engine.ts`:

1. **Onboarding** — creates a payout-ready Stripe **test** connected account
   (transfers capability `active`).
2. **Authorize → capture** for two quotes (labor-only $150; parts $60 + labor
   $130). Asserts the PaymentIntent `amount`, `application_fee_amount`, and the
   destination **transfer** (= pro payout) equal the engine's cents.
3. **Visit fee** — off-session $20 charge; asserts $20 / $3 fee / $17 payout.
4. **Void** — cancels an uncaptured hold; asserts no money moved.
5. **Refund** — full refund with `reverse_transfer` + `refund_application_fee`;
   asserts the transfer is fully reversed and the fee refunded.
6. **Dispute** — chargeback; asserts the dispute amount equals the charge.

Exit code is non-zero if **any** assertion fails; each failure is printed with
got-vs-expected.

### Connected-account note
Production onboarding uses **Express + hosted AccountLink**
(`stripe-connect-link`), which can't be completed unattended. To make a test
account programmatically transfer-ready, the harness creates a **Custom** test
account with Stripe's verification test triggers. The fee/transfer math the
platform depends on is identical for both account types.

## Optional: deeper DB-integrated e2e
The Stripe script verifies the Stripe-side math the Edge Functions rely on. To
exercise the functions *and* their ledger writes together, run
`supabase functions serve --env-file ../../.env.local`, point `stripe listen`
at the local `stripe-webhook`, and call the functions with a signed-in test
user. That path additionally needs `SUPABASE_SERVICE_ROLE_KEY` and
`STRIPE_WEBHOOK_SECRET`.
