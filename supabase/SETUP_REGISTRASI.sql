-- =====================================================================
-- BIO-SORB MagnetLink — SETUP REGISTRASI TERBUKA (tempel SEMUA, lalu Run)
-- Aman dijalankan ulang. Syarat: 001_initial_schema.sql sudah pernah dijalankan.
--
-- Hasil: SIAPA PUN yang mendaftar / masuk otomatis menjadi anggota tim
-- (boleh menambah & mengubah data). Tanpa kode, tanpa daftar email, tanpa batas.
-- Pengunjung yang tidak masuk tetap hanya bisa melihat data yang dipublikasikan.
-- =====================================================================

-- 1) Hapus batas jumlah anggota
drop trigger if exists team_members_limit on public.team_members;
drop function if exists public.enforce_team_limit();

-- 2) Fungsi: pengguna yang sedang masuk otomatis dijadikan anggota
drop function if exists public.register_team_member(text);
drop function if exists public.register_team_member();
create or replace function public.register_team_member()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Harus login terlebih dahulu.'; end if;
  insert into public.team_members (user_id) values (uid) on conflict (user_id) do nothing;
  return 'ok';
end;
$$;
revoke all on function public.register_team_member() from public, anon;
grant execute on function public.register_team_member() to authenticated;

-- 3) Jadikan SEMUA akun yang sudah ada (termasuk yang tadi gagal masuk) anggota tim
insert into public.team_members (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- 4) Cek: jumlah anggota
select count(*) as jumlah_anggota from public.team_members;
