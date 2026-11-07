-- =====================================================================
-- Uji cepat RLS sebagai PENGUNJUNG PUBLIK (anon).
-- Jalankan di SQL Editor SETELAH ada data. Semua hasil di bawah harus sesuai komentar.
-- Setiap blok dibungkus transaksi dan di-rollback, jadi tidak mengubah data.
-- =====================================================================

begin;
set local role anon;

-- 1) Hanya eksperimen terpublikasi yang terlihat (jumlah harus = jumlah eksperimen is_published = true)
select count(*) as eksperimen_terlihat from public.experiments;

-- 2) Tidak ada record dari eksperimen yang belum dipublikasikan
select count(*) as record_dari_eksperimen_draft
from public.test_records r
where not public.experiment_is_published(r.experiment_id);   -- harus 0

-- 3) Catatan internal harus DITOLAK (error: permission denied for table internal_notes)
-- select * from public.internal_notes;   -- hapus tanda komentar untuk mengujinya; error = benar

-- 4) Tulis harus DITOLAK (error: permission denied)
-- insert into public.experiments (title) values ('uji anon');

rollback;
