-- Menghapus SEMUA data demo (eksperimen "[DEMO]…", datanya, dan modul DEMO-*).
-- Data asli tidak tersentuh. Jalankan di Supabase SQL Editor.
delete from public.experiments where title like '[DEMO]%';   -- ikut menghapus test_records & catatannya
delete from public.modules where module_code like 'DEMO-%';
