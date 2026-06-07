# Aquilla Edge Functions — job lifecycle API

Deno functions that turn **client intent** into server-authoritative state. The
client never sets prices, fees, payouts, or status — it calls these endpoints,
which validate, apply the engine, and write with the service role. Shared logic
lives in `_shared/` (`engine.ts`, `http.ts`, `supabase.ts`, `validate.ts`,
`jobs.ts`).

All endpoints are `POST`, require a Supabase JWT (`Authorization: Bearer …`),
take/return JSON, and reuse the same CORS + error envelope (`{ "error": "…" }`).

## Endpoints

| Function | Caller | Purpose |
|---|---|---|
| `pro-onboard` | pro | Create/update pro profile. Licensed trades require license + insurance; background-check consent required. Leaves `verification_status = pending`. |
| `jobs-create` | customer | Open a `requested` job. Standard: pass chosen `pro_id`. Open ("Other"): `is_open:true` + `budget`. |
| `jobs-quote` | assigned pro | Set `labor_amount` (+ optional `parts_amount`); server computes fee/payout/total. |
| `jobs-accept` | pro | Accept a requested non-open job → `accepted` (guardrail + trade checked). |
| `jobs-update-status` | assigned pro | Advance dispatch: `en_route` → `arrived`. |
| `jobs-needs-part` | assigned pro | `arrived` → `awaiting_part` with parts deposit + labor + return date. |
| `jobs-visit-fee` | assigned pro | Couldn't complete → `visit_fee` ($20, 15% fee). Blocked if under review. |
| `jobs-confirm` | customer or pro | Submit completion confirmation (`completed: bool`). Both-yes → `completed`; disagreement → `disputed`. |
| `jobs-cancel` | customer | Cancel before arrival → `cancelled`. |
| `open-jobs-claim` | pro | Claim an open job (rule 8). |
| `open-jobs-select` | customer | Pick a claimant; prices the job at the budget, assigns the pro. |
| `jobs-nearby` | pro | List matching requests (trade + area + verified/active/online — rule 9). |
| `stripe-connect-link` | pro | Create/continue Stripe Express payout onboarding; returns a link. |
| `payments-authorize` | customer | Hold the agreed price (manual-capture destination charge); returns `client_secret`. |
| `payments-refund` | customer | Void a held authorization or refund a captured one. |
| `stripe-webhook` | Stripe | Signature-verified, idempotent event sink (public). |
| `cron-auto-confirm` | scheduler | Auto-confirm due jobs + capture them (CRON_SECRET header). |
| `pro-verify` | admin | Approve (→ verified/active) or reject a pro. The gate every job action depends on. |
| `disputes-resolve` | admin | Settle a held dispute: `release` (pay pro), `refund` (pay customer), or `split` (`pro_amount`). |

## Typical flows

**Standard trade:** `jobs-create` (with `pro_id`) → pro `jobs-quote` → pro
`jobs-accept` → `jobs-update-status` (en_route, arrived) → on completion both
sides `jobs-confirm`. If it can't be finished: `jobs-visit-fee` or
`jobs-needs-part` (+ a later `jobs-confirm` on the return).

**Open ("Other") job:** `jobs-create` (`is_open`, `budget`) → pros
`open-jobs-claim` → customer `open-jobs-select` → same dispatch + confirm path.

## Payments (Stripe Connect)

Escrow-style **destination charges** with a manual capture: the customer is
charged, Aquilla keeps `application_fee_amount`, and the remainder is destined
for the pro's connected account.

- **Authorize on booking** (`payments-authorize`): manual-capture PaymentIntent
  for the agreed price, `setup_future_usage=off_session` so later charges can
  reuse the card. Client confirms → funds held.
- **Capture on completion**: when both sides confirm (`jobs-confirm`) — or the
  24h `cron-auto-confirm` fires — the hold is captured and a payout row is
  recorded. Idempotent.
- **Cancel** (`jobs-cancel`): voids the uncaptured hold.
- **Visit fee** (`jobs-visit-fee`): voids the labor hold and takes a $20
  off-session charge (15% fee).
- **Parts deposit** (`jobs-needs-part`): off-session charge for parts now (5%
  fee); the labor balance stays on the booking hold, captured on completion.
- **Refund/dispute**: `payments-refund` refunds + reverses the transfer;
  `charge.dispute.created` flips the job to `disputed`.

> **Known follow-up (multi-day labor):** the booking hold equals the labor at
> quote time. If a pro raises the labor total on a return visit beyond the
> original hold, an incremental authorization (or re-auth) would be needed —
> not yet implemented. Parts (deposit) and the unchanged-labor case are handled.

## Notes

- **Money/fees** come only from `_shared/engine.ts` (`splitJob`,
  `splitVisitFee`, `paymentAmounts`). Functions never trust client-supplied
  amounts.
- **Verification:** onboarding leaves a pro `pending`; `jobs-accept`,
  `jobs-visit-fee`, `open-jobs-claim`, and `nearby_jobs` all require
  `verification_status = verified` and a non-paused status. Flipping a pro to
  `verified` is an admin/verification action (Step 6).
- **Dual-confirm + auto-confirm** are enforced in the DB
  (`submit_confirmation`, `auto_confirm_due`); `jobs-confirm` is the thin entry
  that calls the RPC with the caller's JWT so the DB knows which side answered.
- **Guardrail (rule 7)** is enforced by the `apply_job_outcome` trigger: it
  recomputes `completion_rate` on every terminal outcome and pauses a pro at
  ≥ 5 jobs with < 50% completion (restoring them when completions recover). The
  API layer additionally refuses paused pros at `jobs-accept` / `jobs-visit-fee`
  / `open-jobs-claim` / `nearby_jobs`.
- **Disputes** are opened automatically when the two sides disagree
  (`submit_confirmation`) or on a Stripe chargeback, and settled by an admin via
  `disputes-resolve`. Resolving as a completion runs the guardrail trigger, so a
  fair outcome counts toward the pro's stats.
- **Admin** is `profiles.is_admin` (no client write path); set it out of band.
