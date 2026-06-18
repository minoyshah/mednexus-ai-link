-- Stripe Connect: store the customer id for off-session charges (visit fee,
-- parts deposit). The pro side (stripe_account_id, payouts_enabled) and the
-- payments/payouts ledgers already exist from the initial migration.
alter table public.profiles add column if not exists stripe_customer_id text;
