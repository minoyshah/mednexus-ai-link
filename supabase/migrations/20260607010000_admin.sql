-- Admin role for verification + dispute resolution.
-- Admins are flagged on their profile (set server-side / out of band); there is
-- no client write path to is_admin (profiles_update only lets you edit your own
-- row, and is_admin is not in the client Insert/Update surface we expose).
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admins can read every job and dispute (review console); the original
-- participant-scoped policies are widened with an is_admin() escape hatch.
drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs
  for select to authenticated
  using (customer_id = auth.uid() or pro_id = auth.uid() or public.is_admin());

drop policy if exists disputes_select on public.disputes;
create policy disputes_select on public.disputes
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.jobs j where j.id = job_id
               and (j.customer_id = auth.uid() or j.pro_id = auth.uid())));
