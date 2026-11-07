-- =====================================================================
-- DATA DEMO — BUKAN HASIL PENELITIAN
-- Angka di bawah dikarang hanya untuk mencoba tampilan website (grafik, tabel, laporan).
-- Jangan dipakai sebagai data lomba. Hapus dengan demo_cleanup.sql sebelum memasukkan data asli.
--
-- Jalankan di Supabase SQL Editor SETELAH 001_initial_schema.sql.
-- Aman dijalankan ulang (tidak menggandakan data).
-- Ubah v_publish menjadi true bila ingin demo terlihat oleh pengunjung publik.
-- =====================================================================
do $$
declare
  v_publish boolean := false;
  v_exp uuid;
begin
  if exists (select 1 from public.experiments where title like '[DEMO]%') then
    raise notice 'Data demo sudah ada. Jalankan demo_cleanup.sql dulu bila ingin membuat ulang.';
    return;
  end if;

  insert into public.modules (module_code, design_type, connector_type, made_on, notes) values
    ('DEMO-M01', 'Kantong mesh 10x10 cm (demo)', 'magnet',   current_date - 14, 'DATA DEMO'),
    ('DEMO-M02', 'Kantong mesh 10x10 cm (demo)', 'magnet',   current_date - 14, 'DATA DEMO'),
    ('DEMO-S01', 'Kantong mesh 10x10 cm (demo)', 'standard', current_date - 14, 'DATA DEMO'),
    ('DEMO-S02', 'Kantong mesh 10x10 cm (demo)', 'standard', current_date - 14, 'DATA DEMO')
  on conflict do nothing;

  insert into public.experiments (title, description, is_published)
  values ('[DEMO] Uji serap oli bekas (data contoh)',
          'DATA DEMO untuk mencoba tampilan website. Angka dikarang, bukan hasil penelitian.',
          v_publish)
  returning id into v_exp;

  -- (kode modul, siklus, hari lalu, massa kering, minyak, air, massa basah)
  insert into public.test_records
    (experiment_id, module_id, test_date, cycle_number, dry_mass_g, oil_retained_g, water_retained_g, wet_mass_g, measurement_method, is_published)
  select v_exp, m.id, current_date - d.days, d.cycle, d.dry, d.oil, d.water, d.wet,
         'DATA DEMO (bukan hasil penelitian)', v_publish
  from (values
    ('DEMO-M01', 1, 7, 10.0::numeric, 21.4::numeric, 2.1::numeric,  null::numeric),
    ('DEMO-M01', 2, 5, 10.0,          19.8,           1.8,           null),
    ('DEMO-M01', 3, 3, 10.0,          18.1,           2.4,           null),
    ('DEMO-M02', 1, 7, 10.4,          22.9,           2.6,           null),
    ('DEMO-M02', 2, 5, 10.4,          20.3,           2.0,           null),
    ('DEMO-M02', 3, 3, 10.4,          18.9,           2.2,           null),
    ('DEMO-S01', 1, 6, 10.2,          20.7,           2.3,           null),
    ('DEMO-S01', 2, 4, 10.2,          19.5,           2.5,           null),
    ('DEMO-S01', 3, 2, 10.2,          17.6,           1.9,           null),
    ('DEMO-S02', 1, 6, 9.8,           21.8,           2.0,           null),
    ('DEMO-S02', 2, 4, 9.8,           19.2,           2.2,           null),
    -- dua data tanpa pemisahan minyak/air: hanya massa basah (tampil sebagai perubahan massa, bukan Q)
    ('DEMO-S02', 3, 2, 9.8,           null,           null,          31.5),
    ('DEMO-M01', 4, 1, 10.0,          null,           null,          27.9)
  ) as d(code, cycle, days, dry, oil, water, wet)
  join public.modules m on m.module_code = d.code;

  insert into public.internal_notes (test_record_id, note)
  select r.id, 'Catatan internal contoh (DATA DEMO).'
  from public.test_records r
  where r.experiment_id = v_exp and r.cycle_number = 1
  on conflict do nothing;
end $$;
