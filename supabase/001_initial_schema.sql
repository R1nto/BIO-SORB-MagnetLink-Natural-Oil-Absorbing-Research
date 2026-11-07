-- BIO-SORB MagnetLink — Supabase schema and access policies
-- Run this in the Supabase SQL Editor. Create two Auth users in the dashboard,
-- then insert their user UUIDs into public.team_members (see README).

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_biosorb_team_member(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members tm where tm.user_id = check_user
  );
$$;

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  module_code text not null unique,
  design_type text not null,
  connector_type text not null default 'magnet'
    check (connector_type in ('magnet', 'standard')),
  created_at timestamptz not null default now()
);

create table if not exists public.test_records (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete restrict,
  test_date date not null default current_date,
  cycle_number integer not null default 1 check (cycle_number > 0),
  dry_mass_g numeric(10,3) not null check (dry_mass_g > 0),
  oil_retained_g numeric(10,3) check (oil_retained_g is null or oil_retained_g >= 0),
  water_retained_g numeric(10,3) check (water_retained_g is null or water_retained_g >= 0),
  measurement_method text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_test_records_module on public.test_records(module_id);
create index if not exists idx_test_records_experiment on public.test_records(experiment_id);
create index if not exists idx_test_records_date on public.test_records(test_date desc);

alter table public.team_members enable row level security;
alter table public.experiments enable row level security;
alter table public.modules enable row level security;
alter table public.test_records enable row level security;

revoke all on public.team_members from anon, authenticated;
revoke all on public.experiments from anon, authenticated;
revoke all on public.modules from anon, authenticated;
revoke all on public.test_records from anon, authenticated;

grant select on public.team_members to authenticated;
grant select on public.experiments, public.modules, public.test_records to anon, authenticated;
grant insert, update, delete on public.experiments, public.modules, public.test_records to authenticated;

create policy "Team member can verify own membership"
on public.team_members for select to authenticated
using (user_id = auth.uid());

create policy "Public reads published experiments"
on public.experiments for select to anon, authenticated
using (is_published = true or public.is_biosorb_team_member());

create policy "Team manages experiments"
on public.experiments for all to authenticated
using (public.is_biosorb_team_member())
with check (public.is_biosorb_team_member());

create policy "Public reads modules used in public records"
on public.modules for select to anon, authenticated
using (
  public.is_biosorb_team_member()
  or exists (
    select 1 from public.test_records tr
    join public.experiments e on e.id = tr.experiment_id
    where tr.module_id = modules.id and tr.is_published = true and e.is_published = true
  )
);

create policy "Team manages modules"
on public.modules for all to authenticated
using (public.is_biosorb_team_member())
with check (public.is_biosorb_team_member());

create policy "Public reads published test records"
on public.test_records for select to anon, authenticated
using (
  public.is_biosorb_team_member()
  or (is_published = true and exists (
    select 1 from public.experiments e
    where e.id = test_records.experiment_id and e.is_published = true
  ))
);

create policy "Team manages test records"
on public.test_records for all to authenticated
using (public.is_biosorb_team_member())
with check (public.is_biosorb_team_member());
