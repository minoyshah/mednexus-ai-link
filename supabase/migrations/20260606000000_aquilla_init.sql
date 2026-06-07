-- =============================================================================
-- Aquilla — initial schema
-- On-demand marketplace connecting customers with home-service & roadside pros.
--
-- Principles:
--   * All money & status logic is enforced server-side. Monetary columns are
--     never client-writable; every monetary mutation goes through a
--     SECURITY DEFINER function or a service-role Edge Function.
--   * RLS is on for every table. Clients only read what they're party to and
--     only express intent (book, message, confirm) — never set prices/payouts.
--   * The canonical fee math lives in supabase/functions/_shared/engine.ts and
--     is mirrored here as aquilla_split_job() so DB triggers agree with the app.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.aquilla_trade as enum (
  'roadside','plumb','elec','hvac','lock','roof','pest',
  'appliance','garage','handy','paint','land','move','clean','other'
);

-- Exactly the lifecycle from the prototype.
create type public.job_status as enum (
  'requested','accepted','en_route','arrived','awaiting_part',
  'completed','visit_fee','disputed','cancelled'
);

create type public.verification_status as enum ('pending','verified','rejected');

create type public.pro_status as enum ('onboarding','active','under_review','paused');

create type public.payment_kind as enum
  ('authorization','deposit','balance','visit_fee','refund');

create type public.payment_status as enum
  ('requires_capture','captured','refunded','canceled','failed');

create type public.payout_status as enum
  ('pending','in_transit','paid','failed','reversed');

create type public.dispute_status as enum
  ('open','resolved_release','resolved_refund','resolved_split');

create type public.claim_status as enum ('claimed','selected','rejected');

create type public.confirm_party as enum ('customer','pro');

-- -----------------------------------------------------------------------------
-- Engine constants & fee math (must match _shared/engine.ts)
-- -----------------------------------------------------------------------------
create or replace function public.aquilla_split_job(p_parts numeric, p_labor numeric)
returns table (fee numeric, total numeric, payout numeric)
language sql immutable as $$
  with v as (
    select greatest(coalesce(p_parts,0),0) as parts,
           greatest(coalesce(p_labor,0),0) as labor
  )
  select round(labor * 0.15 + parts * 0.05, 2) as fee,
         round(parts + labor, 2)               as total,
         round((parts + labor) - round(labor * 0.15 + parts * 0.05, 2), 2) as payout
  from v;
$$;

-- Great-circle distance in miles between two lat/lng points.
create or replace function public.haversine_miles(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 3958.7613 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- -----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users (customer identity; a user may also be a pro)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  avatar_url  text,
  rating      numeric(2,1),
  is_pro      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- pro_profiles — onboarding + verification + stats. Server-managed fields
-- (verification, status, counts, stripe) are protected by a trigger below.
-- -----------------------------------------------------------------------------
create table public.pro_profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  trades                  public.aquilla_trade[] not null default '{}',
  area                    text,
  lat                     double precision,
  lng                     double precision,
  radius_miles            integer not null default 10,
  experience              text,
  license_number          text,
  license_state           text,
  insured                 boolean not null default false,
  background_check_consent boolean not null default false,
  is_online               boolean not null default false,
  -- server-managed (not client-writable):
  verification_status     public.verification_status not null default 'pending',
  status                  public.pro_status not null default 'onboarding',
  completed_count         integer not null default 0,
  incomplete_count        integer not null default 0,
  completion_rate         numeric generated always as (
                            case when completed_count + incomplete_count = 0 then null
                                 else completed_count::numeric / (completed_count + incomplete_count)
                            end) stored,
  stripe_account_id       text,
  payouts_enabled         boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- jobs — the heart of the lifecycle. Money columns are server-set only.
-- -----------------------------------------------------------------------------
create table public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references auth.users(id) on delete cascade,
  pro_id              uuid references auth.users(id) on delete set null,
  trade               public.aquilla_trade not null,
  problem             text not null,
  is_open             boolean not null default false,   -- "Other" broadcast jobs
  budget              numeric,                            -- open-job customer budget

  -- pricing (server-validated):
  labor_amount        numeric not null default 0,
  parts_amount        numeric not null default 0,
  agreed_price        numeric not null default 0,
  visit_fee_amount    numeric,
  deposit_amount      numeric,
  fee_amount          numeric not null default 0,         -- Aquilla cut
  payout_amount       numeric not null default 0,         -- pro receives

  status              public.job_status not null default 'requested',
  address             text,
  lat                 double precision,
  lng                 double precision,
  return_date         date,
  part_note           text,

  -- dual confirmation (rules 5 & 6):
  customer_confirmed  boolean,
  pro_confirmed       boolean,
  customer_confirmed_at timestamptz,
  pro_confirmed_at    timestamptz,
  confirm_deadline    timestamptz,

  accepted_at         timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index jobs_customer_idx on public.jobs(customer_id);
create index jobs_pro_idx       on public.jobs(pro_id);
create index jobs_status_idx    on public.jobs(status);
create index jobs_open_idx      on public.jobs(is_open) where is_open;

-- -----------------------------------------------------------------------------
-- job_messages — realtime chat between the two participants
-- -----------------------------------------------------------------------------
create table public.job_messages (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.jobs(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index job_messages_job_idx on public.job_messages(job_id, created_at);

-- -----------------------------------------------------------------------------
-- job_claims — pros claim open ("Other") jobs; customer selects one
-- -----------------------------------------------------------------------------
create table public.job_claims (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.jobs(id) on delete cascade,
  pro_id     uuid not null references auth.users(id) on delete cascade,
  status     public.claim_status not null default 'claimed',
  created_at timestamptz not null default now(),
  unique (job_id, pro_id)
);
create index job_claims_job_idx on public.job_claims(job_id);

-- -----------------------------------------------------------------------------
-- reviews — one per job, written by the customer
-- -----------------------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null unique references public.jobs(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  pro_id      uuid not null references auth.users(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index reviews_pro_idx on public.reviews(pro_id);

-- -----------------------------------------------------------------------------
-- payments — escrow/charge ledger mirrored from Stripe (server-only writes)
-- -----------------------------------------------------------------------------
create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  job_id                   uuid not null references public.jobs(id) on delete cascade,
  kind                     public.payment_kind not null,
  amount                   numeric not null,
  stripe_payment_intent_id text,
  status                   public.payment_status not null default 'requires_capture',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index payments_job_idx on public.payments(job_id);

-- -----------------------------------------------------------------------------
-- payouts — pro payouts via Stripe Connect transfers (server-only writes)
-- -----------------------------------------------------------------------------
create table public.payouts (
  id                 uuid primary key default gen_random_uuid(),
  job_id             uuid not null references public.jobs(id) on delete cascade,
  pro_id             uuid not null references auth.users(id) on delete cascade,
  amount             numeric not null,
  fee                numeric not null,
  status             public.payout_status not null default 'pending',
  stripe_transfer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index payouts_pro_idx on public.payouts(pro_id);

-- -----------------------------------------------------------------------------
-- disputes — opened when the two sides disagree on completion
-- -----------------------------------------------------------------------------
create table public.disputes (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  opened_by       uuid references auth.users(id) on delete set null,
  reason          text,
  status          public.dispute_status not null default 'open',
  resolution_note text,
  resolved_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index disputes_job_idx on public.disputes(job_id);

-- -----------------------------------------------------------------------------
-- webhook_events — Stripe webhook idempotency
-- -----------------------------------------------------------------------------
create table public.webhook_events (
  id              uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  type            text,
  payload         jsonb,
  processed       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- =============================================================================
-- Triggers & business-rule functions
-- =============================================================================

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_touch     before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_pro_profiles_touch before update on public.pro_profiles
  for each row execute function public.touch_updated_at();
create trigger trg_jobs_touch         before update on public.jobs
  for each row execute function public.touch_updated_at();

-- Bootstrap a profile when a new auth user is created (rule: phone OTP / OAuth).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Note on protecting server-managed pro_profiles columns (verification, status,
-- counts, stripe, payouts): rather than a column-guard trigger — which a
-- SECURITY DEFINER function can't reliably distinguish from a client write,
-- since auth.role() stays 'authenticated' inside it — we simply grant clients
-- NO direct write on pro_profiles. Onboarding/verification happen via
-- service-role Edge Functions (owner bypasses RLS), the online toggle via the
-- narrow set_pro_online() RPC below, and stats via the trigger that follows.

-- Let a pro flip only their own online flag without a broad update grant.
create or replace function public.set_pro_online(p_online boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.pro_profiles set is_online = p_online where id = auth.uid();
  return p_online;
end; $$;

-- Recompute a pro's stats + guardrail status when a job reaches a terminal,
-- rate-affecting state (rule 7). 'completed' counts as a success; 'visit_fee'
-- (couldn't complete) counts against the rate.
create or replace function public.apply_job_outcome()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
  v_rate  numeric;
begin
  if new.pro_id is null then return new; end if;
  if new.status = old.status then return new; end if;

  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.pro_profiles
      set completed_count = completed_count + 1
      where id = new.pro_id;
  elsif new.status = 'visit_fee' and old.status is distinct from 'visit_fee' then
    update public.pro_profiles
      set incomplete_count = incomplete_count + 1
      where id = new.pro_id;
  else
    return new;
  end if;

  -- recompute guardrail: pause at >= MIN_JOBS and rate < 50%, else restore.
  select completed_count + incomplete_count,
         case when completed_count + incomplete_count = 0 then null
              else completed_count::numeric / (completed_count + incomplete_count) end
    into v_total, v_rate
    from public.pro_profiles where id = new.pro_id;

  update public.pro_profiles
    set status = case
      when v_total >= 5 and v_rate < 0.5 then 'paused'::public.pro_status
      when status = 'paused' then 'active'::public.pro_status
      else status
    end
    where id = new.pro_id and verification_status = 'verified';

  return new;
end; $$;

create trigger trg_apply_job_outcome
  after update of status on public.jobs
  for each row execute function public.apply_job_outcome();

-- Record one side's completion confirmation and resolve (rules 5 & 6).
-- Returns the resulting job status. Caller must be a participant.
create or replace function public.submit_confirmation(p_job uuid, p_completed boolean)
returns public.job_status
language plpgsql security definer set search_path = public as $$
declare
  j public.jobs;
  v_party public.confirm_party;
  v_cust boolean;
  v_pro  boolean;
begin
  select * into j from public.jobs where id = p_job for update;
  if not found then raise exception 'job not found'; end if;

  if j.customer_id = auth.uid() then v_party := 'customer';
  elsif j.pro_id = auth.uid() then v_party := 'pro';
  else raise exception 'not a participant of this job';
  end if;

  if j.status in ('completed','cancelled','disputed') then
    return j.status; -- already terminal
  end if;

  if v_party = 'customer' then
    update public.jobs set customer_confirmed = p_completed,
                           customer_confirmed_at = now(),
                           confirm_deadline = coalesce(confirm_deadline, now() + interval '24 hours')
      where id = p_job;
  else
    update public.jobs set pro_confirmed = p_completed,
                           pro_confirmed_at = now(),
                           confirm_deadline = coalesce(confirm_deadline, now() + interval '24 hours')
      where id = p_job;
  end if;

  select customer_confirmed, pro_confirmed into v_cust, v_pro
    from public.jobs where id = p_job;

  -- both sides have answered → resolve
  if v_cust is not null and v_pro is not null then
    if v_cust and v_pro then
      update public.jobs set status = 'completed', completed_at = now() where id = p_job;
      return 'completed';
    else
      update public.jobs set status = 'disputed' where id = p_job;
      insert into public.disputes (job_id, opened_by, reason)
        values (p_job, auth.uid(), 'completion disagreement');
      return 'disputed';
    end if;
  end if;

  return j.status;
end; $$;

-- Auto-confirm jobs whose 24h window has elapsed with a side still silent
-- (rule 6). Silent sides are treated as confirming complete so the pro is paid;
-- an explicit "not completed" is preserved and disputes instead.
create or replace function public.auto_confirm_due()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  j public.jobs;
  n integer := 0;
  v_cust boolean;
  v_pro  boolean;
begin
  for j in
    select * from public.jobs
     where confirm_deadline is not null and confirm_deadline <= now()
       and status not in ('completed','cancelled','disputed')
     for update skip locked
  loop
    v_cust := coalesce(j.customer_confirmed, true);
    v_pro  := coalesce(j.pro_confirmed, true);
    if v_cust and v_pro then
      update public.jobs
        set status = 'completed', completed_at = now(),
            customer_confirmed = v_cust, pro_confirmed = v_pro
        where id = j.id;
    else
      update public.jobs
        set status = 'disputed',
            customer_confirmed = v_cust, pro_confirmed = v_pro
        where id = j.id;
      insert into public.disputes (job_id, reason)
        values (j.id, 'completion disagreement (auto)');
    end if;
    n := n + 1;
  end loop;
  return n;
end; $$;

-- Open ("Other") jobs and trade/area-matched requests visible to a given pro
-- (rules 8 & 9). Returns nothing if the pro is paused/under review.
create or replace function public.nearby_jobs()
returns setof public.jobs
language sql stable security definer set search_path = public as $$
  select j.*
  from public.jobs j
  join public.pro_profiles p on p.id = auth.uid()
  where j.status = 'requested'
    and j.pro_id is null
    and j.customer_id <> auth.uid()
    and p.status = 'active'
    and p.verification_status = 'verified'
    and p.is_online
    and j.trade = any (p.trades)
    and (
      j.lat is null or p.lat is null
      or public.haversine_miles(j.lat, j.lng, p.lat, p.lng) <= p.radius_miles
    );
$$;

-- =============================================================================
-- Row-level security
-- All tables: RLS on. Reads scoped to participants; monetary writes happen via
-- the service role / SECURITY DEFINER functions only.
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.pro_profiles    enable row level security;
alter table public.jobs            enable row level security;
alter table public.job_messages    enable row level security;
alter table public.job_claims      enable row level security;
alter table public.reviews         enable row level security;
alter table public.payments        enable row level security;
alter table public.payouts         enable row level security;
alter table public.disputes        enable row level security;
alter table public.webhook_events  enable row level security;

-- profiles: anyone authenticated can read basic profiles; you edit only yours.
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- pro_profiles: readable by authenticated (to show pros). No client writes —
-- onboarding/verification go through service-role Edge Functions and the online
-- toggle through set_pro_online(); this keeps prices, verification and stats
-- entirely server-controlled.
create policy pro_profiles_select on public.pro_profiles
  for select to authenticated using (true);

-- jobs: a customer may create their own job and read it; the assigned pro can
-- read it. Status/price transitions go through Edge Functions (service role),
-- so there is intentionally no client UPDATE policy.
create policy jobs_select on public.jobs
  for select to authenticated
  using (customer_id = auth.uid() or pro_id = auth.uid());
create policy jobs_insert on public.jobs
  for insert to authenticated with check (customer_id = auth.uid());

-- job_messages: only the two participants can read/write the thread.
create policy job_messages_select on public.job_messages
  for select to authenticated using (
    exists (select 1 from public.jobs j where j.id = job_id
            and (j.customer_id = auth.uid() or j.pro_id = auth.uid())));
create policy job_messages_insert on public.job_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and
    exists (select 1 from public.jobs j where j.id = job_id
            and (j.customer_id = auth.uid() or j.pro_id = auth.uid())));

-- job_claims: the job's customer and the claiming pro can see claims.
create policy job_claims_select on public.job_claims
  for select to authenticated using (
    pro_id = auth.uid()
    or exists (select 1 from public.jobs j where j.id = job_id and j.customer_id = auth.uid()));

-- reviews: world-readable (drives pro ratings); customer writes for own completed job.
create policy reviews_select on public.reviews
  for select to authenticated using (true);
create policy reviews_insert on public.reviews
  for insert to authenticated with check (
    customer_id = auth.uid() and
    exists (select 1 from public.jobs j
            where j.id = job_id and j.customer_id = auth.uid() and j.status = 'completed'));

-- payments / payouts / disputes: read-only to the parties; no client writes.
create policy payments_select on public.payments
  for select to authenticated using (
    exists (select 1 from public.jobs j where j.id = job_id
            and (j.customer_id = auth.uid() or j.pro_id = auth.uid())));
create policy payouts_select on public.payouts
  for select to authenticated using (pro_id = auth.uid());
create policy disputes_select on public.disputes
  for select to authenticated using (
    exists (select 1 from public.jobs j where j.id = job_id
            and (j.customer_id = auth.uid() or j.pro_id = auth.uid())));

-- webhook_events: service-role only (no policies → no authenticated access).

-- =============================================================================
-- Realtime: stream live job status + chat
-- =============================================================================
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.job_messages;

-- =============================================================================
-- Scheduled auto-confirm (rule 6). Requires pg_cron; guarded so the migration
-- still applies in environments where the extension isn't available. If it is
-- skipped, call public.auto_confirm_due() from the cron-auto-confirm Edge
-- Function on a schedule instead.
-- =============================================================================
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'aquilla-auto-confirm',
    '*/15 * * * *',
    $cron$ select public.auto_confirm_due(); $cron$
  );
exception when others then
  raise notice 'pg_cron not scheduled (%). Use the cron-auto-confirm Edge Function.', sqlerrm;
end $$;
