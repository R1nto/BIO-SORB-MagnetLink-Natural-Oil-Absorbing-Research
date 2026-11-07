import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  oilCapacity,
  massChange,
  describe,
  summarizeOil,
  summarizeMassChange,
  statsByModule,
  statsByConnector,
  seriesByCycle,
  filterRecords,
} from '../src/js/utils/calculations.js';

const rec = (o) => ({
  module_id: 'm1',
  modules: { module_code: 'M-01', connector_type: 'magnet' },
  experiment_id: 'e1',
  test_date: '2026-11-01',
  cycle_number: 1,
  dry_mass_g: 10,
  oil_retained_g: null,
  water_retained_g: null,
  wet_mass_g: null,
  ...o,
});

test('Q = minyak / massa kering', () => {
  assert.equal(oilCapacity(rec({ oil_retained_g: 25 })), 2.5);
  assert.equal(oilCapacity(rec({ oil_retained_g: 0 })), 0); // nol yang DIUKUR tetap nol
});

test('Q null bila minyak tidak diukur — tidak pernah dianggap 0', () => {
  assert.equal(oilCapacity(rec({ oil_retained_g: null })), null);
  assert.equal(oilCapacity(rec({ oil_retained_g: undefined })), null);
  assert.equal(oilCapacity(rec({ oil_retained_g: '' })), null);
});

test('Q TIDAK dihitung dari selisih massa basah - kering', () => {
  const r = rec({ wet_mass_g: 40, water_retained_g: 5 }); // minyak tak diukur
  assert.equal(oilCapacity(r), null);
  assert.equal(massChange(r), 30);
});

test('Q null untuk massa kering tidak valid atau minyak negatif', () => {
  assert.equal(oilCapacity(rec({ dry_mass_g: 0, oil_retained_g: 5 })), null);
  assert.equal(oilCapacity(rec({ dry_mass_g: -1, oil_retained_g: 5 })), null);
  assert.equal(oilCapacity(rec({ oil_retained_g: -2 })), null);
});

test('describe: rata-rata, SD sampel, median', () => {
  const d = describe([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(d.n, 8);
  assert.equal(d.mean, 5);
  assert.equal(d.median, 4.5);
  assert.ok(Math.abs(d.sd - 2.138089935) < 1e-6);
  assert.equal(describe([3]).sd, null);
  assert.deepEqual(describe([]), { n: 0, mean: null, sd: null, min: null, max: null, median: null });
});

test('summarizeOil hanya memakai record valid; summarizeMassChange hanya yang tanpa minyak', () => {
  const rows = [
    rec({ oil_retained_g: 20 }),
    rec({ oil_retained_g: 30 }),
    rec({ wet_mass_g: 14 }),
    rec({}),
  ];
  const oil = summarizeOil(rows);
  assert.equal(oil.n, 2);
  assert.equal(oil.mean, 2.5);
  const mass = summarizeMassChange(rows);
  assert.equal(mass.n, 1);
  assert.equal(mass.mean, 4);
});

test('statsByModule dan statsByConnector mengelompokkan dengan benar', () => {
  const rows = [
    rec({ oil_retained_g: 20 }),
    rec({ oil_retained_g: 30, cycle_number: 2 }),
    rec({ module_id: 'm2', modules: { module_code: 'S-01', connector_type: 'standard' }, oil_retained_g: 10 }),
  ];
  const mods = statsByModule(rows);
  assert.deepEqual(mods.map((m) => [m.label, m.n, m.mean]), [['M-01', 2, 2.5], ['S-01', 1, 1]]);
  const conns = statsByConnector(rows);
  assert.deepEqual(conns.map((c) => [c.key, c.n]).sort(), [['magnet', 2], ['standard', 1]]);
});

test('seriesByCycle: siklus terurut, celah = null', () => {
  const rows = [
    rec({ oil_retained_g: 20, cycle_number: 1 }),
    rec({ oil_retained_g: 10, cycle_number: 3 }),
    rec({ module_id: 'm2', modules: { module_code: 'S-01', connector_type: 'standard' }, oil_retained_g: 40, cycle_number: 2 }),
  ];
  const s = seriesByCycle(rows);
  assert.deepEqual(s.cycles, [1, 2, 3]);
  assert.deepEqual(s.series.find((x) => x.label === 'M-01').data, [2, null, 1]);
  assert.deepEqual(s.series.find((x) => x.label === 'S-01').data, [null, 4, null]);
});

test('filterRecords: tanggal, eksperimen, modul', () => {
  const rows = [
    rec({ test_date: '2026-10-01' }),
    rec({ test_date: '2026-11-05', experiment_id: 'e2' }),
    rec({ test_date: '2026-11-10', module_id: 'm9' }),
  ];
  assert.equal(filterRecords(rows, { from: '2026-11-01' }).length, 2);
  assert.equal(filterRecords(rows, { to: '2026-10-31' }).length, 1);
  assert.equal(filterRecords(rows, { experimentId: 'e2' }).length, 1);
  assert.equal(filterRecords(rows, { moduleId: 'm9' }).length, 1);
  assert.equal(filterRecords(rows, {}).length, 3);
});
