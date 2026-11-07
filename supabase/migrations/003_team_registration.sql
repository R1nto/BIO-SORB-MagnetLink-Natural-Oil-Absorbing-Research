-- =====================================================================
-- BIO-SORB MagnetLink — 003_team_registration.sql  (OPSIONAL)
-- Jalankan SETELAH 001. Mengaktifkan pendaftaran lewat website dengan KODE UNDANGAN.
--
-- Cara kerja:
--   1. Siapa pun bisa membuat akun (Supabase Auth), tetapi akun baru TIDAK punya akses data.
--   2. Akun hanya menjadi anggota tim bila memasukkan kode undangan yang benar.
--   3. Batas tetap 2 anggota (trigger di 001). Anggota ke-3 ditolak walau kodenya benar.
--   4. Kode salah 10 kali -> pendaftaran terkunci sampai Anda membuka kunci lewat SQL Editor.
-- Keamanan data tetap dijaga RLS; kode undangan tidak pernah dikirim ke browser.
-- =====================================================================

create table if not exists public.team_invite (
  id              boolean primary key default true check (id),   -- hanya boleh 1 baris
  code_hash       text not null,
  failed_attempts integer not null default 0
);

alter table public.team_invite enable row level security;      -- tanpa policy = tertutup
revoke all on public.team_invite from anon, authenticated;

-- Mengatur / mengganti kode undangan. Hanya bisa dipanggil dari SQL Editor (bukan dari website).
create or replace function public.set_team_invite_code(new_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(coalesce(new_code, '')) < 12 then
    raise exception 'Kode undangan minimal 12 karakter.';
  end if;
  insert into public.team_invite (id, code_hash, failed_attempts)
  values (true, encode(sha256(convert_to(new_code, 'utf8')), 'hex'), 0)
  on conflict (id) do update
    set code_hash = excluded.code_hash, failed_attempts = 0;
end;
$$;
revoke all on function public.set_team_invite_code(text) from public, anon, authenticated;

-- Dipanggil website setelah login. Mengembalikan: ok | invalid | full | locked | not_configured
create or replace function public.register_team_member(invite_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  inv public.team_invite%rowtype;
begin
  if uid is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if exists (select 1 from public.team_members where user_id = uid) then
    return 'ok';
  end if;

  select * into inv from public.team_invite where id;
  if not found then return 'not_configured'; end if;
  if inv.failed_attempts >= 10 then return 'locked'; end if;

  if encode(sha256(convert_to(coalesce(invite_code, ''), 'utf8')), 'hex') <> inv.code_hash then
    update public.team_invite set failed_attempts = failed_attempts + 1 where id;
    return 'invalid';
  end if;

  if (select count(*) from public.team_members) >= 2 then
    return 'full';
  end if;

  insert into public.team_members (user_id) values (uid);
  update public.team_invite set failed_attempts = 0 where id;
  return 'ok';
end;
$$;
revoke all on function public.register_team_member(text) from public, anon;
grant execute on function public.register_team_member(text) to authenticated;

-- ---------------------------------------------------------------------
-- LANGKAH WAJIB SETELAH MENJALANKAN FILE INI: tetapkan kode undangan (ganti isinya!).
-- Pakai kode panjang dan acak, bagikan hanya ke anggota tim.
--
--   select public.set_team_invite_code('GANTI-DENGAN-KODE-ACAK-PANJANG');
--
-- Membuka kunci setelah terkunci:
--   update public.team_invite set failed_attempts = 0;
-- Menutup pendaftaran lagi: hapus kodenya
--   delete from public.team_invite;
-- ---------------------------------------------------------------------
