-- =====================================================================
-- BIO-SORB MagnetLink — 001_initial_schema.sql
-- Jalankan SELURUH file ini sekali di Supabase Dashboard > SQL Editor.
-- Berisi: tabel, constraint, index, fungsi bantu, RLS, dan privilege.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Anggota tim (tanpa batas jumlah)
--    Akun dibuat manual di Authentication > Users. Setelah itu daftarkan
--    di tabel ini lewat 002_register_team_members.sql.
--    Hanya user yang ada di tabel ini yang boleh menulis / membaca data internal.
-- ---------------------------------------------------------------------
create table public.team_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Tabel utama
-- ---------------------------------------------------------------------
create table public.experiments (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(btrim(title)) between 3 and 150),
  description  text check (description is null or char_length(description) <= 2000),
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.modules (
  id             uuid primary key default gen_random_uuid(),
  module_code    text not null
                   check (module_code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,29}$'),
  design_type    text check (design_type is null or char_length(design_type) <= 100),
  connector_type text not null default 'standard'
                   check (connector_type in ('magnet', 'standard')),
  made_on        date,                                   -- tanggal pembuatan modul fisik
  notes          text check (notes is null or char_length(notes) <= 1000),
  created_at     timestamptz not null default now(),
  constraint modules_module_code_key unique (module_code)
);
-- Kode modul tidak boleh kembar walau huruf besar/kecilnya berbeda (M-01 vs m-01)
create unique index modules_module_code_lower_key on public.modules (lower(module_code));

create table public.test_records (
  id                 uuid primary key default gen_random_uuid(),
  experiment_id      uuid not null references public.experiments (id) on delete cascade,
  module_id          uuid not null references public.modules (id) on delete restrict,
  test_date          date not null,
  cycle_number       integer not null check (cycle_number > 0),
  dry_mass_g         numeric(10, 3) not null check (dry_mass_g > 0),
  -- NULL = tidak diukur. Sengaja tidak default 0 supaya "tidak diukur" tidak dianggap "nol".
  oil_retained_g     numeric(10, 3) check (oil_retained_g is null or oil_retained_g >= 0),
  water_retained_g   numeric(10, 3) check (water_retained_g is null or water_retained_g >= 0),
  -- Tambahan opsional: massa basah total, untuk kasus minyak & air belum bisa dipisahkan.
  wet_mass_g         numeric(10, 3) check (wet_mass_g is null or wet_mass_g > 0),
  measurement_method text not null check (char_length(btrim(measurement_method)) between 1 and 200),
  is_published       boolean not null default false,
  created_at         timestamptz not null default now()
);

create table public.internal_notes (
  id             uuid primary key default gen_random_uuid(),
  test_record_id uuid not null unique references public.test_records (id) on delete cascade,
  note           text not null check (char_length(btrim(note)) between 1 and 2000),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Index
-- ---------------------------------------------------------------------
create index experiments_published_idx    on public.experiments (is_published, created_at desc);
create index test_records_experiment_idx  on public.test_records (experiment_id);
create index test_records_module_idx      on public.test_records (module_id);
create index test_records_date_idx        on public.test_records (test_date desc);
create index test_records_cycle_idx       on public.test_records (cycle_number);
create index test_records_published_idx   on public.test_records (is_published);
create index modules_connector_idx        on public.modules (connector_type);

-- ---------------------------------------------------------------------
-- 4. Fungsi bantu untuk RLS
--    SECURITY DEFINER agar pengecekan tidak ikut terkena RLS tabel lain.
-- ---------------------------------------------------------------------
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members where user_id = (select auth.uid())
  );
$$;

create or replace function public.experiment_is_published(exp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_published from public.experiments where id = exp_id),
    false
  );
$$;

revoke all on function public.is_team_member() from public;
revoke all on function public.experiment_is_published(uuid) from public;
grant execute on function public.is_team_member() to anon, authenticated;
grant execute on function public.experiment_is_published(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Privilege (GRANT) — selaras dengan RLS
--    Supabase memberi hak penuh ke anon/authenticated secara default; kita cabut
--    dulu lalu beri seperlunya. RLS tetap menjadi lapisan penyaring baris.
-- ---------------------------------------------------------------------
revoke all on public.team_members   from anon, authenticated;
revoke all on public.experiments    from anon, authenticated;
revoke all on public.modules        from anon, authenticated;
revoke all on public.test_records   from anon, authenticated;
revoke all on public.internal_notes from anon, authenticated;

-- Pengunjung publik: hanya SELECT, dan tidak ada akses sama sekali ke internal_notes
grant select on public.experiments, public.modules, public.test_records to anon;

-- Pengguna login: akses penuh tingkat tabel; RLS yang memutuskan siapa yang lolos
grant select, insert, update, delete
  on public.experiments, public.modules, public.test_records, public.internal_notes
  to authenticated;
grant select on public.team_members to authenticated;

-- ---------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------
alter table public.team_members   enable row level security;
alter table public.experiments    enable row level security;
alter table public.modules        enable row level security;
alter table public.test_records   enable row level security;
alter table public.internal_notes enable row level security;

-- team_members: user hanya bisa melihat barisnya sendiri. Tidak ada policy tulis,
-- jadi hanya SQL Editor / service role (di luar frontend) yang bisa mengubahnya.
create policy team_members_read_self on public.team_members
  for select to authenticated
  using (user_id = (select auth.uid()));

-- experiments
create policy experiments_public_read on public.experiments
  for select to anon, authenticated
  using (is_published);

create policy experiments_team_all on public.experiments
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- modules: publik hanya melihat modul yang dipakai oleh data yang sudah dipublikasikan
create policy modules_public_read on public.modules
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.test_records r
      where r.module_id = modules.id
        and r.is_published
        and public.experiment_is_published(r.experiment_id)
    )
  );

create policy modules_team_all on public.modules
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- test_records: publik hanya melihat record terpublikasi dari eksperimen terpublikasi
create policy test_records_public_read on public.test_records
  for select to anon, authenticated
  using (is_published and public.experiment_is_published(experiment_id));

create policy test_records_team_all on public.test_records
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- internal_notes: HANYA tim. Tidak ada policy untuk anon, dan anon tidak punya GRANT.
create policy internal_notes_team_all on public.internal_notes
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
