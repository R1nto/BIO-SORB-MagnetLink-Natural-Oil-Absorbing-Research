-- =====================================================================
-- BIO-SORB MagnetLink — 004_team_email_allowlist.sql
-- Pengganti kode undangan: pendaftaran lewat EMAIL yang sudah Anda daftarkan.
-- Jalankan SETELAH 001 (003 tidak perlu lagi).
--
-- Cara kerja:
--   1. Anda memasukkan email anggota tim ke tabel team_allowed_emails (langkah di bawah).
--   2. Anggota membuka /register, mengisi email + kata sandi (tanpa kode apa pun).
--   3. Akun menjadi anggota tim HANYA bila email-nya ada di daftar DAN sudah terkonfirmasi
--      (Supabase mengirim email konfirmasi; ini membuktikan email itu miliknya).
--   4. Tidak ada batas jumlah anggota (batas 2 dari 001 dihapus di bawah). Email di luar daftar tidak mendapat akses data.
-- =====================================================================
-- Hapus batas 2 anggota (aman dijalankan ulang).
drop trigger if exists team_members_limit on public.team_members;
drop function if exists public.enforce_team_limit();

create table if not exists public.team_allowed_emails (
  email text primary key check (email = lower(email))
);
alter table public.team_allowed_emails enable row level security;   -- tanpa policy = tertutup
revoke all on public.team_allowed_emails from anon, authenticated;

drop function if exists public.register_team_member(text);
create or replace function public.register_team_member()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  u_email text;
  u_confirmed timestamptz;
begin
  if uid is null then raise exception 'Harus login terlebih dahulu.'; end if;
  if exists (select 1 from public.team_members where user_id = uid) then return 'ok'; end if;

  select lower(email), email_confirmed_at into u_email, u_confirmed from auth.users where id = uid;
  if u_confirmed is null then return 'unconfirmed'; end if;
  if not exists (select 1 from public.team_allowed_emails where email = u_email) then return 'not_allowed'; end if;

  insert into public.team_members (user_id) values (uid);
  return 'ok';
end;
$$;
revoke all on function public.register_team_member() from public, anon;
grant execute on function public.register_team_member() to authenticated;

-- ---------------------------------------------------------------------
-- LANGKAH WAJIB: daftarkan email anggota (ganti dengan email asli, huruf kecil; tambah sebanyak yang dibutuhkan).
--
--   insert into public.team_allowed_emails (email) values
--     ('anggota1@contoh.com'), ('anggota2@contoh.com')
--   on conflict do nothing;
-- ---------------------------------------------------------------------
