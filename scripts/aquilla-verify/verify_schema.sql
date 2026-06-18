-- =============================================================================
-- Aquilla schema verifier — idempotent, read-only.
--
-- Asserts that every enum, table, column, constraint, RLS policy, trigger,
-- function and realtime publication the migrations declare actually exists in
-- the live database, and that the DB fee mirror (aquilla_split_job) agrees with
-- the canonical engine in supabase/functions/_shared/engine.ts.
--
-- It only READS the catalogs and CALLS pure immutable functions; it never
-- inserts/updates/deletes application data, so re-running is a no-op. The only
-- object it creates is a TEMP table (session-local, dropped at disconnect) used
-- to collect results.
--
-- Run:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f verify_schema.sql
-- Exit code is non-zero if any check FAILs (the final report still prints).
-- =============================================================================
\set ON_ERROR_STOP on
\pset pager off
\timing off

drop table if exists __aquilla_check;
create temp table __aquilla_check (category text, object text, status text, detail text);

-- helper: oid of the public schema
-- (inlined as subselects below to keep this a single self-contained script)

-- ----------------------------------------------------------------------------
-- 1. Enums + every expected label
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'enum-label', v.enm || '.' || v.lbl,
       case when en.enumlabel is not null then 'PASS' else 'FAIL' end,
       case when en.enumlabel is not null then '' else 'missing enum/label' end
from (values
  ('aquilla_trade','roadside'),('aquilla_trade','plumb'),('aquilla_trade','elec'),
  ('aquilla_trade','hvac'),('aquilla_trade','lock'),('aquilla_trade','roof'),
  ('aquilla_trade','pest'),('aquilla_trade','appliance'),('aquilla_trade','garage'),
  ('aquilla_trade','handy'),('aquilla_trade','paint'),('aquilla_trade','land'),
  ('aquilla_trade','move'),('aquilla_trade','clean'),('aquilla_trade','other'),
  ('job_status','requested'),('job_status','accepted'),('job_status','en_route'),
  ('job_status','arrived'),('job_status','awaiting_part'),('job_status','completed'),
  ('job_status','visit_fee'),('job_status','disputed'),('job_status','cancelled'),
  ('verification_status','pending'),('verification_status','verified'),('verification_status','rejected'),
  ('pro_status','onboarding'),('pro_status','active'),('pro_status','under_review'),('pro_status','paused'),
  ('payment_kind','authorization'),('payment_kind','deposit'),('payment_kind','balance'),
  ('payment_kind','visit_fee'),('payment_kind','refund'),
  ('payment_status','requires_capture'),('payment_status','captured'),('payment_status','refunded'),
  ('payment_status','canceled'),('payment_status','failed'),
  ('payout_status','pending'),('payout_status','in_transit'),('payout_status','paid'),
  ('payout_status','failed'),('payout_status','reversed'),
  ('dispute_status','open'),('dispute_status','resolved_release'),
  ('dispute_status','resolved_refund'),('dispute_status','resolved_split'),
  ('claim_status','claimed'),('claim_status','selected'),('claim_status','rejected'),
  ('confirm_party','customer'),('confirm_party','pro')
) v(enm, lbl)
left join pg_type t
  on t.typname = v.enm and t.typtype = 'e'
 and t.typnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_enum en on en.enumtypid = t.oid and en.enumlabel = v.lbl;

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'table', v.t,
       case when c.relname is not null then 'PASS' else 'FAIL' end,
       case when c.relname is not null then '' else 'missing table' end
from (values
  ('profiles'),('pro_profiles'),('jobs'),('job_messages'),('job_claims'),
  ('reviews'),('payments'),('payouts'),('disputes'),('webhook_events')
) v(t)
left join pg_class c
  on c.relname = v.t and c.relkind = 'r'
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public');

-- ----------------------------------------------------------------------------
-- 3. Columns (every column the migrations declare)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'column', v.t || '.' || v.col,
       case when a.attname is not null then 'PASS' else 'FAIL' end,
       case when a.attname is not null then '' else 'missing column' end
from (values
  -- profiles (+ stripe_customer_id, is_admin from later migrations)
  ('profiles','id'),('profiles','full_name'),('profiles','phone'),('profiles','email'),
  ('profiles','avatar_url'),('profiles','rating'),('profiles','is_pro'),
  ('profiles','created_at'),('profiles','updated_at'),
  ('profiles','stripe_customer_id'),('profiles','is_admin'),
  -- pro_profiles
  ('pro_profiles','id'),('pro_profiles','trades'),('pro_profiles','area'),
  ('pro_profiles','lat'),('pro_profiles','lng'),('pro_profiles','radius_miles'),
  ('pro_profiles','experience'),('pro_profiles','license_number'),('pro_profiles','license_state'),
  ('pro_profiles','insured'),('pro_profiles','background_check_consent'),('pro_profiles','is_online'),
  ('pro_profiles','verification_status'),('pro_profiles','status'),
  ('pro_profiles','completed_count'),('pro_profiles','incomplete_count'),('pro_profiles','completion_rate'),
  ('pro_profiles','stripe_account_id'),('pro_profiles','payouts_enabled'),
  ('pro_profiles','created_at'),('pro_profiles','updated_at'),
  -- jobs
  ('jobs','id'),('jobs','customer_id'),('jobs','pro_id'),('jobs','trade'),('jobs','problem'),
  ('jobs','is_open'),('jobs','budget'),('jobs','labor_amount'),('jobs','parts_amount'),
  ('jobs','agreed_price'),('jobs','visit_fee_amount'),('jobs','deposit_amount'),
  ('jobs','fee_amount'),('jobs','payout_amount'),('jobs','status'),('jobs','address'),
  ('jobs','lat'),('jobs','lng'),('jobs','return_date'),('jobs','part_note'),
  ('jobs','customer_confirmed'),('jobs','pro_confirmed'),('jobs','customer_confirmed_at'),
  ('jobs','pro_confirmed_at'),('jobs','confirm_deadline'),('jobs','accepted_at'),
  ('jobs','completed_at'),('jobs','cancelled_at'),('jobs','created_at'),('jobs','updated_at'),
  -- job_messages
  ('job_messages','id'),('job_messages','job_id'),('job_messages','sender_id'),
  ('job_messages','body'),('job_messages','created_at'),
  -- job_claims
  ('job_claims','id'),('job_claims','job_id'),('job_claims','pro_id'),
  ('job_claims','status'),('job_claims','created_at'),
  -- reviews
  ('reviews','id'),('reviews','job_id'),('reviews','customer_id'),('reviews','pro_id'),
  ('reviews','rating'),('reviews','comment'),('reviews','tags'),('reviews','created_at'),
  -- payments
  ('payments','id'),('payments','job_id'),('payments','kind'),('payments','amount'),
  ('payments','stripe_payment_intent_id'),('payments','status'),
  ('payments','created_at'),('payments','updated_at'),
  -- payouts
  ('payouts','id'),('payouts','job_id'),('payouts','pro_id'),('payouts','amount'),
  ('payouts','fee'),('payouts','status'),('payouts','stripe_transfer_id'),
  ('payouts','created_at'),('payouts','updated_at'),
  -- disputes
  ('disputes','id'),('disputes','job_id'),('disputes','opened_by'),('disputes','reason'),
  ('disputes','status'),('disputes','resolution_note'),('disputes','resolved_by'),
  ('disputes','created_at'),('disputes','resolved_at'),
  -- webhook_events
  ('webhook_events','id'),('webhook_events','stripe_event_id'),('webhook_events','type'),
  ('webhook_events','payload'),('webhook_events','processed'),('webhook_events','created_at')
) v(t, col)
left join pg_class c
  on c.relname = v.t
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_attribute a
  on a.attrelid = c.oid and a.attname = v.col and a.attnum > 0 and not a.attisdropped;

-- pro_profiles.completion_rate must be a STORED generated column
insert into __aquilla_check
select 'generated', 'pro_profiles.completion_rate',
       case when a.attgenerated = 's' then 'PASS' else 'FAIL' end,
       coalesce('attgenerated=' || nullif(a.attgenerated::text, ''), 'not generated/missing')
from (values (1)) x(i)
left join pg_class c
  on c.relname = 'pro_profiles'
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_attribute a on a.attrelid = c.oid and a.attname = 'completion_rate';

-- ----------------------------------------------------------------------------
-- 4. Primary keys
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'primary-key', v.t,
       case when con.conname is not null then 'PASS' else 'FAIL' end,
       coalesce(con.conname, 'no primary key')
from (values
  ('profiles'),('pro_profiles'),('jobs'),('job_messages'),('job_claims'),
  ('reviews'),('payments'),('payouts'),('disputes'),('webhook_events')
) v(t)
left join pg_class c
  on c.relname = v.t
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_constraint con on con.conrelid = c.oid and con.contype = 'p';

-- ----------------------------------------------------------------------------
-- 5. Unique constraints
-- ----------------------------------------------------------------------------
-- single-column uniques
insert into __aquilla_check
select 'unique', v.t || '.' || v.col,
       case when con.conname is not null then 'PASS' else 'FAIL' end,
       coalesce(con.conname, 'no unique constraint')
from (values ('reviews','job_id'), ('webhook_events','stripe_event_id')) v(t, col)
left join pg_class c
  on c.relname = v.t
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_attribute a on a.attrelid = c.oid and a.attname = v.col
left join pg_constraint con
  on con.conrelid = c.oid and con.contype = 'u'
 and con.conkey::int[] = array[a.attnum::int];

-- composite unique job_claims(job_id, pro_id)
insert into __aquilla_check
select 'unique', 'job_claims(job_id,pro_id)',
       case when exists (
         select 1 from pg_constraint con
         join pg_class c on c.oid = con.conrelid
          and c.relname = 'job_claims'
          and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
         where con.contype = 'u'
           and (select array_agg(att.attname::text order by att.attname::text)
                from unnest(con.conkey) k
                join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k)
               = array['job_id','pro_id']
       ) then 'PASS' else 'FAIL' end,
       '';

-- ----------------------------------------------------------------------------
-- 6. CHECK constraints (reviews.rating 1..5, job_messages.body length)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'check-constraint', v.t,
       case when exists (
         select 1 from pg_constraint con
         join pg_class c on c.oid = con.conrelid
          and c.relname = v.t
          and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
         where con.contype = 'c'
       ) then 'PASS' else 'FAIL' end,
       ''
from (values ('reviews'), ('job_messages')) v(t);

-- ----------------------------------------------------------------------------
-- 7. Foreign keys (column -> referenced table)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'foreign-key', v.t || '.' || v.col,
       case when con.conname is not null then 'PASS' else 'FAIL' end,
       coalesce(con.conname, 'no foreign key on column')
from (values
  ('profiles','id'),('pro_profiles','id'),
  ('jobs','customer_id'),('jobs','pro_id'),
  ('job_messages','job_id'),('job_messages','sender_id'),
  ('job_claims','job_id'),('job_claims','pro_id'),
  ('reviews','job_id'),('reviews','customer_id'),('reviews','pro_id'),
  ('payments','job_id'),
  ('payouts','job_id'),('payouts','pro_id'),
  ('disputes','job_id'),('disputes','opened_by'),('disputes','resolved_by')
) v(t, col)
left join pg_class c
  on c.relname = v.t
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
left join pg_attribute a on a.attrelid = c.oid and a.attname = v.col
left join pg_constraint con
  on con.conrelid = c.oid and con.contype = 'f'
 and con.conkey::int[] = array[a.attnum::int];

-- ----------------------------------------------------------------------------
-- 8. Functions (name / arg count, and SECURITY DEFINER where required)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'function', v.fn || '(' || v.nargs || ' args)',
       case
         when p.proname is null then 'FAIL'
         when v.secdef is not null and p.prosecdef <> v.secdef then 'FAIL'
         else 'PASS'
       end,
       case
         when p.proname is null then 'missing function'
         when v.secdef is not null and p.prosecdef <> v.secdef
           then 'security definer mismatch (got ' || p.prosecdef || ')'
         else ''
       end
from (values
  ('aquilla_split_job', 2, null::boolean),
  ('haversine_miles',   4, null::boolean),
  ('touch_updated_at',  0, null::boolean),
  ('handle_new_user',   0, true),
  ('set_pro_online',    1, true),
  ('apply_job_outcome', 0, true),
  ('submit_confirmation', 2, true),
  ('auto_confirm_due',  0, true),
  ('nearby_jobs',       0, true),
  ('is_admin',          0, true)
) v(fn, nargs, secdef)
left join pg_proc p
  on p.proname = v.fn and p.pronargs = v.nargs
 and p.pronamespace = (select oid from pg_namespace where nspname = 'public');

-- ----------------------------------------------------------------------------
-- 9. Triggers
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'trigger', v.tg || ' on ' || v.sch || '.' || v.tbl,
       case when t.tgname is not null then 'PASS' else 'FAIL' end,
       case when t.tgname is not null then '' else 'missing trigger' end
from (values
  ('trg_profiles_touch','public','profiles'),
  ('trg_pro_profiles_touch','public','pro_profiles'),
  ('trg_jobs_touch','public','jobs'),
  ('trg_apply_job_outcome','public','jobs'),
  ('on_auth_user_created','auth','users')
) v(tg, sch, tbl)
left join pg_trigger t
  on t.tgname = v.tg and not t.tgisinternal
 and t.tgrelid = (
   select c.oid from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where c.relname = v.tbl and n.nspname = v.sch
 );

-- ----------------------------------------------------------------------------
-- 10. Row-level security enabled on every table
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'rls-enabled', v.t,
       case when c.relrowsecurity then 'PASS' else 'FAIL' end,
       case when c.relrowsecurity then '' else 'RLS not enabled' end
from (values
  ('profiles'),('pro_profiles'),('jobs'),('job_messages'),('job_claims'),
  ('reviews'),('payments'),('payouts'),('disputes'),('webhook_events')
) v(t)
left join pg_class c
  on c.relname = v.t
 and c.relnamespace = (select oid from pg_namespace where nspname = 'public');

-- ----------------------------------------------------------------------------
-- 11. RLS policies (presence by name)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'policy', v.t || '.' || v.p,
       case when pol.policyname is not null then 'PASS' else 'FAIL' end,
       case when pol.policyname is not null then '' else 'missing policy' end
from (values
  ('profiles','profiles_select'),('profiles','profiles_update'),
  ('pro_profiles','pro_profiles_select'),
  ('jobs','jobs_select'),('jobs','jobs_insert'),
  ('job_messages','job_messages_select'),('job_messages','job_messages_insert'),
  ('job_claims','job_claims_select'),
  ('reviews','reviews_select'),('reviews','reviews_insert'),
  ('payments','payments_select'),
  ('payouts','payouts_select'),
  ('disputes','disputes_select')
) v(t, p)
left join pg_policies pol
  on pol.schemaname = 'public' and pol.tablename = v.t and pol.policyname = v.p;

-- webhook_events must have NO policies (service-role only)
insert into __aquilla_check
select 'policy-count', 'webhook_events (expect 0)',
       case when count(*) = 0 then 'PASS' else 'FAIL' end,
       'found ' || count(*) || ' policies'
from pg_policies where schemaname = 'public' and tablename = 'webhook_events';

-- ----------------------------------------------------------------------------
-- 12. Realtime publication membership
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'realtime', 'supabase_realtime.' || v.t,
       case when pt.tablename is not null then 'PASS' else 'FAIL' end,
       case when pt.tablename is not null then '' else 'not in publication' end
from (values ('jobs'), ('job_messages')) v(t)
left join pg_publication_tables pt
  on pt.pubname = 'supabase_realtime' and pt.schemaname = 'public' and pt.tablename = v.t;

-- ----------------------------------------------------------------------------
-- 13. Fee-math parity: DB aquilla_split_job() must equal engine.ts.
--     Expected values are the canonical ones asserted in engine.test.ts.
--     (parts, labor, expected fee, total, payout)
-- ----------------------------------------------------------------------------
insert into __aquilla_check
select 'fee-math', format('split(parts=%s, labor=%s)', v.parts, v.labor),
       case when r.fee = v.ef and r.total = v.et and r.payout = v.ep then 'PASS' else 'FAIL' end,
       format('got fee=%s total=%s payout=%s | want fee=%s total=%s payout=%s',
              r.fee, r.total, r.payout, v.ef, v.et, v.ep)
from (values
  (100.00, 100.00, 20.00,  200.00, 180.00),   -- 15% labor + 5% parts
  (  0.00, 130.00, 19.50,  130.00, 110.50),   -- labor-only
  (200.00,   0.00, 10.00,  200.00, 190.00),   -- parts-only (5%)
  ( 10.01,  99.99, 15.50,  110.00,  94.50),   -- rounding case
  (  0.00,  20.00,  3.00,   20.00,  17.00)    -- $20 visit fee → $3 / $17
) v(parts, labor, ef, et, ep)
cross join lateral public.aquilla_split_job(v.parts::numeric, v.labor::numeric) r;

-- haversine sanity: same point = 0 mi; 1° latitude ≈ 69.09 mi
insert into __aquilla_check
select 'haversine', 'same point = 0 mi',
       case when public.haversine_miles(40.0,-75.0,40.0,-75.0) = 0 then 'PASS' else 'FAIL' end, '';
insert into __aquilla_check
select 'haversine', '1 degree latitude ~= 69.09 mi',
       case when abs(public.haversine_miles(0,0,1,0) - 69.09) < 0.5 then 'PASS' else 'FAIL' end,
       format('got %s mi', round(public.haversine_miles(0,0,1,0)::numeric, 3));

-- =============================================================================
-- Report
-- =============================================================================
\echo ''
\echo '================  Aquilla schema verification  ================'
select category, object, status, detail
from __aquilla_check
order by (status = 'FAIL') desc, category, object;

\echo ''
\echo '----------------  summary  ----------------'
select status, count(*) as checks
from __aquilla_check
group by status
order by status;

-- Non-zero exit if anything failed (report above already printed).
do $$
declare n int;
begin
  select count(*) into n from __aquilla_check where status = 'FAIL';
  if n > 0 then
    raise exception 'Aquilla schema verification: % check(s) FAILED', n;
  else
    raise notice 'Aquilla schema verification: ALL CHECKS PASSED';
  end if;
end $$;
