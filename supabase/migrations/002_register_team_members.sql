-- =====================================================================
-- BIO-SORB MagnetLink — 002_register_team_members.sql
-- Jalankan SETELAH 001, dan SETELAH dua akun dibuat di
-- Supabase Dashboard > Authentication > Users > Add user (centang "Auto Confirm User").
--
-- Ganti dua email di bawah dengan email anggota tim yang sebenarnya.
-- Trigger di tabel team_members menolak anggota ke-3.
-- =====================================================================
insert into public.team_members (user_id)
select id
from auth.users
where lower(email) in (
  lower('anggota1@contoh.com'),
  lower('anggota2@contoh.com')
)
on conflict (user_id) do nothing;

-- Cek hasilnya (harus tampil 2 baris):
select tm.user_id, u.email
from public.team_members tm
join auth.users u on u.id = tm.user_id;
