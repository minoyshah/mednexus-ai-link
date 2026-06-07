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

## Typical flows

**Standard trade:** `jobs-create` (with `pro_id`) → pro `jobs-quote` → pro
`jobs-accept` → `jobs-update-status` (en_route, arrived) → on completion both
sides `jobs-confirm`. If it can't be finished: `jobs-visit-fee` or
`jobs-needs-part` (+ a later `jobs-confirm` on the return).

**Open ("Other") job:** `jobs-create` (`is_open`, `budget`) → pros
`open-jobs-claim` → customer `open-jobs-select` → same dispatch + confirm path.

## Notes

- **Money/fees** come only from `_shared/engine.ts` (`splitJob`,
  `splitVisitFee`). Payment capture/payout is wired in the Stripe step; these
  functions set the amounts and statuses the payment layer acts on.
- **Verification:** onboarding leaves a pro `pending`; `jobs-accept`,
  `jobs-visit-fee`, `open-jobs-claim`, and `nearby_jobs` all require
  `verification_status = verified` and a non-paused status. Flipping a pro to
  `verified` is an admin/verification action (Step 6).
- **Dual-confirm + auto-confirm** are enforced in the DB
  (`submit_confirmation`, `auto_confirm_due`); `jobs-confirm` is the thin entry
  that calls the RPC with the caller's JWT so the DB knows which side answered.
