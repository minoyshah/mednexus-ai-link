# Aquilla — production launch runbook

The repo now contains everything that can be prepared *in code*: the backend
(schema, Edge Functions, Stripe escrow), the design system + app UI, a typed
API client, native iOS/Android shells (Capacitor), and a verification harness.
This runbook is the ordered path to a real App Store launch, split into what is
**already done** and what **requires your accounts/machines** (Apple, Supabase,
Stripe — none of which can be exercised from a sandboxed environment).

---

## 0. Current state (honest)

| Layer | State |
|---|---|
| Database schema + RLS + triggers | ✅ written (`supabase/migrations/`), verified against local Postgres by `scripts/aquilla-verify` — **not yet pushed to the cloud project** |
| Edge Functions (jobs, payments, disputes, webhook) | ✅ written — **not yet deployed** |
| Stripe escrow money path | ✅ implemented + turnkey test harness — **not yet run against Stripe** |
| Frontend UI | ✅ production design system, all major screens |
| Auth (phone OTP + Apple/Google) | ✅ `AuthContext` wired to Supabase Auth |
| Frontend ↔ backend data | ⚠️ **screens still run on in-memory mock data.** The typed seam is ready (`src/lib/aquilla/api.ts` + realtime hooks) but screens must be switched over — this is the main remaining engineering before real users |
| Native shells (iOS/Android) | ✅ Capacitor configured, `ios/` + `android/` generated, `cap sync` green |
| App Store build/signing | ❌ requires macOS + Xcode + your Apple Developer account |

> **Do not ship to real users until the mock→live wiring (§4) is done.** The
> app currently *looks* complete but books simulated jobs.

---

## 1. Deploy the backend (Supabase)

```bash
npm i -g supabase            # or: npm i -D supabase && npx supabase …
supabase login               # browser auth
supabase link --project-ref esdrhofpukpxgjslnmfn
supabase db push             # applies the 3 migrations
npm run verify:schema        # expect: 258 PASS, exit 0  (needs SUPABASE_DB_URL in .env.local)

# functions (stripe-webhook must be public; config.toml already sets verify_jwt)
supabase functions deploy jobs-create jobs-accept jobs-quote jobs-update-status \
  jobs-confirm jobs-cancel jobs-nearby jobs-needs-part jobs-visit-fee \
  open-jobs-claim open-jobs-select payments-authorize payments-refund \
  pro-onboard pro-verify stripe-connect-link disputes-resolve cron-auto-confirm \
  stripe-webhook

# server secrets used by the functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_… STRIPE_WEBHOOK_SECRET=whsec_… \
  STRIPE_CONNECT_REFRESH_URL=https://<your-domain>/pro/onboarding \
  STRIPE_CONNECT_RETURN_URL=https://<your-domain>/pro CRON_SECRET=<random>
```

Auth providers (Dashboard → Authentication): enable **Phone (Twilio)** and
**Apple/Google** OAuth with your credentials. Schedule `cron-auto-confirm`
(or rely on pg_cron if the migration scheduled it).

## 2. Stripe

1. Test mode first: `npm run verify:stripe` — drives onboarding → authorize →
   capture → refund → visit fee → dispute and asserts every cent against the
   fee engine. **All asserts must pass before live mode.**
2. Dashboard: add a webhook endpoint →
   `https://esdrhofpukpxgjslnmfn.supabase.co/functions/v1/stripe-webhook`
   with events: `account.updated`, `payment_intent.succeeded`,
   `payment_intent.canceled`, `payment_intent.payment_failed`,
   `charge.refunded`, `charge.dispute.created`. Put its signing secret in
   `STRIPE_WEBHOOK_SECRET`.
3. Live mode: complete Stripe platform onboarding (Connect → platform
   profile, branding, payout descriptor), swap `sk_live_…` into the function
   secrets. **Connect Express requires Stripe's platform review** — start it
   early; it can take days.

## 3. Frontend config

- `.env` already carries the public `VITE_SUPABASE_URL` / anon key.
- `VITE_MAP_STYLE`: set a production vector style (OpenFreeMap `liberty` is
  keyless; MapTiler/Mapbox need a key). Without it the app uses the keyless
  demo style + the built-in stylized fallback.
- Payments UI: card entry/confirmation needs `@stripe/stripe-js` +
  `VITE_STRIPE_PUBLISHABLE_KEY` wired to `payments.authorize()`'s
  `client_secret` (part of §4).

## 4. Mock → live wiring (the remaining engineering)

The seam is `src/lib/aquilla/api.ts` (typed calls to every Edge Function) +
`useJobStatus` / `useJobChat` (realtime) + `AuthContext`. Switch screens in
this order, testing each against the deployed backend:

1. **Auth screens** → real `sendPhoneOtp` / `verifyPhoneOtp` / OAuth.
2. **Job booking**: `api.jobs.create` → `api.jobs.quote` (pro) →
   `api.payments.authorize` + Stripe.js confirm → `useJobStatus` drives the
   dispatch screen (statuses via `api.jobs.updateStatus`).
3. **Completion**: `api.jobs.confirm` both sides; visit fee via
   `api.jobs.visitFee`; part flow via `api.jobs.needsPart`.
4. **Pro app**: `api.pro.onboard`, `api.pro.connectLink` (open returned URL),
   `api.jobs.nearby` feed, accept/claim/select.
5. **Chat** → `useJobChat`. **Admin** → `api.pro.verify`, `api.disputes.resolve`.

## 5. iOS App Store (requires macOS + Apple Developer Program, $99/yr)

```bash
git clone … && npm install
npm run cap:sync          # build web + copy into ios/ and android/
npm run cap:ios           # opens ios/App in Xcode
```

In Xcode: set your Team, bundle id `com.aquilla.app` (must match an App ID in
your developer account), app icons (`Assets.xcassets` — 1024px master), then
Product → Archive → Distribute → App Store Connect → TestFlight → submit.

App Store Connect checklist:
- App privacy "nutrition labels" (collects: phone, email, precise location,
  payment info via Stripe) + a hosted **privacy policy URL** and support URL.
- Sign in with Apple is **required** because Google sign-in is offered — it's
  already implemented; make sure the Apple provider is enabled in Supabase.
- Location permission strings (`NSLocationWhenInUseUsageDescription`) in
  `ios/App/App/Info.plist` — explain dispatch/ETA use.
- Screenshots (6.7" + 5.5"), description, keywords, age rating.
- Expect review scrutiny on marketplace payments: physical services must use
  Stripe (not IAP) — Aquilla is compliant, but be ready to cite guideline 3.1.5(a).

Android (later): `npm run cap:android`, sign an AAB, Play Console.

## 6. Pre-launch gates (all must be green)

- [ ] `npm run verify:schema` → 258 PASS against the production project
- [ ] `npm run verify:stripe` → all money asserts pass (test mode)
- [ ] One full E2E on the deployed stack: book → quote → pay (test card) →
      en_route → arrived → both confirm → payout recorded; dispute path held
- [ ] `npx tsc --noEmit`, `npm test`, `npm run build` clean
- [ ] TestFlight build on a physical iPhone: map tiles, OTP SMS, Apple/Google
      sign-in, live tracking, safe-area rendering
- [ ] Privacy policy + support pages live; Stripe Connect platform approved
- [ ] Rollback plan: Supabase PITR enabled; Stripe test/live keys separated
