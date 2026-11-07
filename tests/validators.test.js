import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimal, validateRecord, validateModule, validateExperiment } from '../src/js/utils/validators.js';
import { toCSV, csvCell } from '../src/js/utils/csv.js';

const TODAY = '2026-11-03';
const good = {
  test_date: '2026-11-02',
  experiment_id: 'e1',
  module_id: 'm1',
  cycle_number: '1',
  dry_mass_g: '10,5',
  oil_retained_g: '',
  water_retained_g: '',
  wet_mass_g: '',
  measurement_method: 'Gravimetri',
  note: '',
};

test('parseDecimal: koma/titik, kosong = null, sampah = NaN', () => {
  assert.equal(parseDecimal('12,5'), 12.5);
  assert.equal(parseDecimal(' 3.25 '), 3.25);
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('   '), null);
  assert.equal(parseDecimal(null), null);
  assert.ok(Number.isNaN(parseDecimal('abc')));
  assert.ok(Number.isNaN(parseDecimal('1.234,5')));
  assert.ok(Number.isNaN(parseDecimal('12 g')));
});

test('validateRecord: data minimal valid, kolom kosong tetap null (bukan 0)', () => {
  const r = validateRecord(good, { today: TODAY });
  assert.equal(r.ok, true);
  assert.equal(r.values.dry_mass_g, 10.5);
  assert.equal(r.values.oil_retained_g, null);
  assert.equal(r.values.water_retained_g, null);
  assert.equal(r.values.wet_mass_g, null);
});

test('validateRecord: massa kering harus > 0', () => {
  assert.ok(validateRecord({ ...good, dry_mass_g: '0' }, { today: TODAY }).errors.dry_mass_g);
  assert.ok(validateRecord({ ...good, dry_mass_g: '-3' }, { today: TODAY }).errors.dry_mass_g);
  assert.ok(validateRecord({ ...good, dry_mass_g: '' }, { today: TODAY }).errors.dry_mass_g);
});

test('validateRecord: siklus harus bilangan bulat > 0', () => {
  for (const bad of ['0', '-1', '1,5', 'a', '']) {
    assert.ok(validateRecord({ ...good, cycle_number: bad }, { today: TODAY }).errors.cycle_number, `siklus "${bad}"`);
  }
  assert.equal(validateRecord({ ...good, cycle_number: '7' }, { today: TODAY }).values.cycle_number, 7);
});

test('validateRecord: minyak/air tidak boleh negatif, nol yang diukur diterima', () => {
  assert.ok(validateRecord({ ...good, oil_retained_g: '-1' }, { today: TODAY }).errors.oil_retained_g);
  assert.ok(validateRecord({ ...good, water_retained_g: '-0,1' }, { today: TODAY }).errors.water_retained_g);
  const zero = validateRecord({ ...good, oil_retained_g: '0' }, { today: TODAY });
  assert.equal(zero.ok, true);
  assert.equal(zero.values.oil_retained_g, 0);
});

test('validateRecord: tanggal wajib, valid, dan bukan masa depan', () => {
  assert.ok(validateRecord({ ...good, test_date: '' }, { today: TODAY }).errors.test_date);
  assert.ok(validateRecord({ ...good, test_date: '2026-02-30' }, { today: TODAY }).errors.test_date);
  assert.ok(validateRecord({ ...good, test_date: '2026-12-01' }, { today: TODAY }).errors.test_date);
  assert.equal(validateRecord({ ...good, test_date: TODAY }, { today: TODAY }).ok, true);
});

test('validateRecord: eksperimen, modul, metode wajib', () => {
  const r = validateRecord({ ...good, experiment_id: '', module_id: '', measurement_method: ' ' }, { today: TODAY });
  assert.ok(r.errors.experiment_id && r.errors.module_id && r.errors.measurement_method);
});

test('validateModule: kode, konektor', () => {
  assert.equal(validateModule({ module_code: 'M-01', connector_type: 'magnet' }).ok, true);
  assert.ok(validateModule({ module_code: '', connector_type: 'magnet' }).errors.module_code);
  assert.ok(validateModule({ module_code: 'M 01!', connector_type: 'magnet' }).errors.module_code);
  assert.ok(validateModule({ module_code: 'M-01', connector_type: 'lain' }).errors.connector_type);
});

test('validateExperiment: judul wajib 3-150 karakter', () => {
  assert.ok(validateExperiment({ title: '' }).errors.title);
  assert.ok(validateExperiment({ title: 'ab' }).errors.title);
  assert.equal(validateExperiment({ title: 'Uji awal', description: '' }).values.description, null);
});

test('CSV: escape dan perlindungan rumus', () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('x"y'), '"x""y"');
  assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(csvCell(-2.5), '-2.5'); // angka negatif asli tidak diberi apostrof
  assert.equal(csvCell(null), '');
  const out = toCSV([{ label: 'A', value: (r) => r.a }], [{ a: 1 }, { a: null }]);
  assert.equal(out, 'A\r\n1\r\n');
});
