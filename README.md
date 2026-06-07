# Aquilla

On-demand marketplace connecting customers with home-service and roadside pros
— Uber-style dispatch for the trades.

This repo holds the **backend & business-logic engine**:

- **Postgres schema** (`supabase/migrations`) — users, pro profiles, jobs, chat,
  reviews, payments, payouts, disputes, with row-level security and server-side
  business rules.
- **Edge Functions** (`supabase/functions`) — the job-lifecycle API, Stripe
  Connect payments/escrow, and webhooks. All money and status logic lives on the
  server; the client only sends intent.
- **Engine** (`supabase/functions/_shared/engine.ts`) — pure, unit-tested money
  and status logic (fee splits, dual/auto-confirm, success-rate guardrail).

## Stack

- Supabase: Postgres + Auth (phone OTP + Apple/Google) + Realtime + Storage
- Stripe Connect for escrow-style holds, splits, and pro payouts
- Vite + React + TypeScript frontend (shadcn-ui)

## Business rules (enforced server-side)

1. Aquilla fee: **15% of labor + 5% of parts**.
2. Visit fee **$20** if a job can't be completed (Aquilla still takes 15%);
   credited toward the repair if the customer proceeds.
3. Multi-day jobs: pro sets `awaiting_part` with parts/labor totals + return
   date; a **parts deposit** is charged on approval, labor captured on completion.
4. Payments: authorize on booking, capture on completion, payout = total − fee.
5. **Dual confirmation**: both customer and pro must confirm completion before
   funds release; disagreement → `disputed`, funds held.
6. **Auto-confirm**: if one side doesn't respond within 24h, the job
   auto-confirms as complete so the pro still gets paid.
7. **Success-rate guardrail**: once a pro has ≥ 5 jobs and completion rate < 50%,
   block the visit fee and pause new assignments until completions recover.
8. **Open jobs** ("Other" trade): customer posts a custom task + budget,
   broadcast to matching pros; pros claim; customer picks one.
9. **Matching**: a pro only sees requests matching their trades AND service area.

## Develop

```sh
npm i
npm run dev      # Vite dev server
npm test         # Vitest — engine unit tests
```

Secrets live in environment variables (Supabase function env + `.env`), never in
code.
