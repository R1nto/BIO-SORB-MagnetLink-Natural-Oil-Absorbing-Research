// Perhitungan penelitian. Fungsi murni tanpa DOM / jaringan agar mudah diuji.
//
// ATURAN ILMIAH (dari brief proyek):
//  - Kapasitas penyerapan minyak  Q = massa minyak tertahan (g) / massa kering (g).
//  - Q HANYA dihitung dari massa minyak yang diukur terpisah (oil_retained_g tidak kosong).
//  - Selisih massa basah - kering BUKAN kapasitas minyak, karena air bisa ikut tertahan.
//    Nilai itu ditampilkan terpisah sebagai "perubahan massa total".
//  - Nilai kosong (null) = tidak diukur. Tidak pernah diubah menjadi 0.

/** Ubah nilai dari database/form menjadi angka, atau null bila kosong/tidak valid. */
export function toNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Q (g/g). null bila massa minyak tidak diukur atau data tidak valid. */
export function oilCapacity(record) {
  const dry = toNum(record?.dry_mass_g);
  const oil = toNum(record?.oil_retained_g);
  if (dry === null || dry <= 0) return null;
  if (oil === null || oil < 0) return null;
  return oil / dry;
}

/** Perubahan massa total (g) = massa basah - massa kering. BUKAN kapasitas minyak. */
export function massChange(record) {
  const dry = toNum(record?.dry_mass_g);
  const wet = toNum(record?.wet_mass_g);
  if (dry === null || wet === null) return null;
  return wet - dry;
}

export const hasValidOil = (record) => oilCapacity(record) !== null;

/** Statistik deskriptif. SD memakai simpangan baku sampel (n-1). */
export function describe(values) {
  const xs = values.filter((v) => Number.isFinite(v));
  const n = xs.length;
  if (n === 0) return { n: 0, mean: null, sd: null, min: null, max: null, median: null };
  const sum = xs.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : null;
  return { n, mean, sd, min: sorted[0], max: sorted[n - 1], median };
}

/** Ringkasan Q dari kumpulan record (hanya record dengan minyak terukur). */
export function summarizeOil(records) {
  return describe(records.map(oilCapacity).filter((q) => q !== null));
}

/** Ringkasan untuk record yang hanya punya massa basah (tanpa pemisahan minyak). */
export function summarizeMassChange(records) {
  const rows = records.filter((r) => !hasValidOil(r));
  return describe(rows.map(massChange).filter((v) => v !== null));
}

const moduleLabel = (r) => r.modules?.module_code ?? 'Modul tidak diketahui';

/** Q rata-rata per modul -> [{key, label, ...stats}] terurut menurut kode modul. */
export function statsByModule(records) {
  const groups = new Map();
  for (const r of records) {
    const q = oilCapacity(r);
    if (q === null) continue;
    const key = r.module_id;
    if (!groups.has(key)) groups.set(key, { key, label: moduleLabel(r), values: [] });
    groups.get(key).values.push(q);
  }
  return [...groups.values()]
    .map(({ values, ...g }) => ({ ...g, ...describe(values) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id', { numeric: true }));
}

/** Q rata-rata per jenis konektor (magnet vs standard). */
export function statsByConnector(records) {
  const groups = new Map();
  for (const r of records) {
    const q = oilCapacity(r);
    if (q === null) continue;
    const key = r.modules?.connector_type ?? 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  const names = { magnet: 'Magnet', standard: 'Standard (tanpa magnet)', unknown: 'Tidak diketahui' };
  return [...groups.entries()]
    .map(([key, values]) => ({ key, label: names[key] ?? key, ...describe(values) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id'));
}

/**
 * Q per siklus untuk grafik garis.
 * Mengembalikan { cycles: [1,2,3], series: [{label, data:[Q|null,...]}] }.
 * Bila satu modul punya beberapa pengukuran pada siklus yang sama, dipakai rata-ratanya.
 */
export function seriesByCycle(records) {
  const cycles = new Set();
  const perModule = new Map();
  for (const r of records) {
    const q = oilCapacity(r);
    if (q === null) continue;
    cycles.add(r.cycle_number);
    if (!perModule.has(r.module_id)) perModule.set(r.module_id, { label: moduleLabel(r), byCycle: new Map() });
    const bucket = perModule.get(r.module_id).byCycle;
    if (!bucket.has(r.cycle_number)) bucket.set(r.cycle_number, []);
    bucket.get(r.cycle_number).push(q);
  }
  const sortedCycles = [...cycles].sort((a, b) => a - b);
  const series = [...perModule.values()]
    .sort((a, b) => a.label.localeCompare(b.label, 'id', { numeric: true }))
    .map(({ label, byCycle }) => ({
      label,
      data: sortedCycles.map((c) => (byCycle.has(c) ? describe(byCycle.get(c)).mean : null)),
    }));
  return { cycles: sortedCycles, series };
}

/** Terapkan filter tanggal / eksperimen / modul. Tanggal berformat YYYY-MM-DD (urut leksikografis). */
export function filterRecords(records, { from, to, experimentId, moduleId } = {}) {
  return records.filter((r) => {
    if (from && r.test_date < from) return false;
    if (to && r.test_date > to) return false;
    if (experimentId && r.experiment_id !== experimentId) return false;
    if (moduleId && r.module_id !== moduleId) return false;
    return true;
  });
}
