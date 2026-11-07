// Validasi input sebelum dikirim ke database. Database tetap punya CHECK constraint sendiri
// sebagai lapisan kedua; validasi ini untuk pesan yang mudah dipahami.

import { todayISO } from './formatters.js';

/**
 * Parse angka desimal dari input teks. Menerima koma ATAU titik sebagai pemisah desimal.
 *  ""        -> null  (kosong = tidak diukur, BUKAN nol)
 *  "12,5"    -> 12.5
 *  "abc"     -> NaN   (tidak valid)
 */
export function parseDecimal(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().replace(',', '.');
  if (s === '') return null;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

const isValidDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const NUMBER_HINT = 'Tulis angka saja, contoh 12,5 (tanpa satuan atau pemisah ribuan).';

/** Validasi data pengujian. `input` berisi string mentah dari form. */
export function validateRecord(input, { today = todayISO() } = {}) {
  const errors = {};
  const values = {};

  const date = String(input.test_date ?? '').trim();
  if (!date) errors.test_date = 'Isi tanggal pengujian.';
  else if (!isValidDate(date)) errors.test_date = 'Tanggal tidak valid. Pilih tanggal dari kalender.';
  else if (date > today) errors.test_date = 'Tanggal pengujian tidak boleh di masa depan.';
  else values.test_date = date;

  if (!input.experiment_id) errors.experiment_id = 'Pilih eksperimen terkait.';
  else values.experiment_id = input.experiment_id;

  if (!input.module_id) errors.module_id = 'Pilih kode modul.';
  else values.module_id = input.module_id;

  const cycleRaw = String(input.cycle_number ?? '').trim();
  if (!cycleRaw) errors.cycle_number = 'Isi nomor siklus pengujian.';
  else if (!/^\d+$/.test(cycleRaw) || Number(cycleRaw) < 1) {
    errors.cycle_number = 'Nomor siklus harus bilangan bulat lebih besar dari 0 (1, 2, 3, …).';
  } else if (Number(cycleRaw) > 1000) errors.cycle_number = 'Nomor siklus terlalu besar. Periksa kembali.';
  else values.cycle_number = Number(cycleRaw);

  const dry = parseDecimal(input.dry_mass_g);
  if (dry === null) errors.dry_mass_g = 'Isi massa kering modul dalam gram.';
  else if (Number.isNaN(dry)) errors.dry_mass_g = NUMBER_HINT;
  else if (dry <= 0) errors.dry_mass_g = 'Massa kering harus lebih besar dari 0 gram.';
  else if (dry > 100000) errors.dry_mass_g = 'Nilai terlalu besar. Pastikan satuannya gram.';
  else values.dry_mass_g = dry;

  for (const [field, label] of [
    ['oil_retained_g', 'Massa minyak'],
    ['water_retained_g', 'Massa air'],
  ]) {
    const v = parseDecimal(input[field]);
    if (v === null) values[field] = null; // kosong tetap kosong (tidak diukur)
    else if (Number.isNaN(v)) errors[field] = NUMBER_HINT;
    else if (v < 0) errors[field] = `${label} tidak boleh negatif.`;
    else if (v > 100000) errors[field] = 'Nilai terlalu besar. Pastikan satuannya gram.';
    else values[field] = v;
  }

  const wet = parseDecimal(input.wet_mass_g);
  if (wet === null) values.wet_mass_g = null;
  else if (Number.isNaN(wet)) errors.wet_mass_g = NUMBER_HINT;
  else if (wet <= 0) errors.wet_mass_g = 'Massa basah harus lebih besar dari 0 gram.';
  else if (wet > 100000) errors.wet_mass_g = 'Nilai terlalu besar. Pastikan satuannya gram.';
  else values.wet_mass_g = wet;

  const method = String(input.measurement_method ?? '').trim();
  if (!method) errors.measurement_method = 'Isi metode pengukuran agar data dapat ditelusuri.';
  else if (method.length > 200) errors.measurement_method = 'Metode pengukuran maksimal 200 karakter.';
  else values.measurement_method = method;

  const note = String(input.note ?? '').trim();
  if (note.length > 2000) errors.note = 'Catatan maksimal 2000 karakter.';
  else values.note = note;

  values.is_published = Boolean(input.is_published);

  return { ok: Object.keys(errors).length === 0, errors, values };
}

export function validateExperiment(input) {
  const errors = {};
  const values = {};
  const title = String(input.title ?? '').trim();
  if (!title) errors.title = 'Isi judul eksperimen.';
  else if (title.length < 3) errors.title = 'Judul minimal 3 karakter.';
  else if (title.length > 150) errors.title = 'Judul maksimal 150 karakter.';
  else values.title = title;

  const description = String(input.description ?? '').trim();
  if (description.length > 2000) errors.description = 'Deskripsi maksimal 2000 karakter.';
  else values.description = description || null;

  values.is_published = Boolean(input.is_published);
  return { ok: Object.keys(errors).length === 0, errors, values };
}

export function validateModule(input) {
  const errors = {};
  const values = {};
  const code = String(input.module_code ?? '').trim();
  if (!code) errors.module_code = 'Isi kode modul.';
  else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,29}$/.test(code)) {
    errors.module_code = 'Kode modul hanya boleh huruf, angka, titik, garis bawah, atau tanda hubung (maks. 30 karakter), contoh M-01.';
  } else values.module_code = code;

  const design = String(input.design_type ?? '').trim();
  if (design.length > 100) errors.design_type = 'Jenis desain maksimal 100 karakter.';
  else values.design_type = design || null;

  if (!['magnet', 'standard'].includes(input.connector_type)) {
    errors.connector_type = 'Pilih jenis konektor.';
  } else values.connector_type = input.connector_type;

  const madeOn = String(input.made_on ?? '').trim();
  if (madeOn && !isValidDate(madeOn)) errors.made_on = 'Tanggal pembuatan tidak valid.';
  else values.made_on = madeOn || null;

  const notes = String(input.notes ?? '').trim();
  if (notes.length > 1000) errors.notes = 'Catatan maksimal 1000 karakter.';
  else values.notes = notes || null;

  return { ok: Object.keys(errors).length === 0, errors, values };
}
