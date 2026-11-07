// DATA CONTOH — dikarang hanya untuk memperlihatkan tampilan dashboard. BUKAN hasil penelitian.
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); };

const modules = [
  ['DEMO-M01', 'magnet'], ['DEMO-M02', 'magnet'], ['DEMO-S01', 'standard'], ['DEMO-S02', 'standard']
].map(([module_code, connector_type], i) => ({
  id: `demo-m${i + 1}`, module_code, design_type: 'Kantong mesh 10x10 cm (contoh)', connector_type, created_at: iso(14)
}));
const experiments = [{
  id: 'demo-e1', title: '[CONTOH] Uji serap oli bekas', is_published: true, created_at: iso(10),
  description: 'DATA CONTOH untuk mencoba tampilan website. Angka dikarang, bukan hasil penelitian.'
}];
const rows = [
  ['demo-m1', 1, 7, 10.0, 21.4, 2.1], ['demo-m1', 2, 5, 10.0, 19.8, 1.8], ['demo-m1', 3, 3, 10.0, 18.1, 2.4],
  ['demo-m2', 1, 7, 10.4, 22.9, 2.6], ['demo-m2', 2, 5, 10.4, 20.3, 2.0], ['demo-m2', 3, 3, 10.4, 18.9, 2.2],
  ['demo-m3', 1, 6, 10.2, 20.7, 2.3], ['demo-m3', 2, 4, 10.2, 19.5, 2.5], ['demo-m3', 3, 2, 10.2, 17.6, 1.9],
  ['demo-m4', 1, 6, 9.8, 21.8, 2.0], ['demo-m4', 2, 4, 9.8, 19.2, 2.2],
  // tanpa pemisahan minyak/air: null (bukan 0), tidak dihitung sebagai Q
  ['demo-m4', 3, 2, 9.8, null, null], ['demo-m1', 4, 1, 10.0, null, null]
];
const records = rows.map(([module_id, cycle_number, days, dry_mass_g, oil_retained_g, water_retained_g], i) => ({
  id: `demo-r${i + 1}`, experiment_id: 'demo-e1', module_id, test_date: day(days), cycle_number, dry_mass_g,
  oil_retained_g, water_retained_g, measurement_method: 'DATA CONTOH (bukan hasil penelitian)', is_published: true, created_at: iso(days)
}));

export const DEMO_DATA = { modules, experiments, records };
