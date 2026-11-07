import { db } from '../config/supabase.js';
import { toAppError, noRowsError } from '../utils/errors.js';

/** Daftar modul beserta jumlah data pengujiannya. Pencarian dilakukan di sisi klien (data kecil, aman dari karakter khusus). */
export async function listModules() {
  const { data, error } = await db()
    .from('modules')
    .select('*, test_records(count)')
    .order('module_code', { ascending: true });
  if (error) throw toAppError(error, 'Gagal memuat daftar modul.');
  return data
    .map((m) => ({ ...m, record_count: m.test_records?.[0]?.count ?? 0 }))
    .sort((a, b) => a.module_code.localeCompare(b.module_code, 'id', { numeric: true }));
}

export function searchModules(modules, term) {
  const q = String(term ?? '').trim().toLowerCase();
  if (!q) return modules;
  return modules.filter((m) =>
    [m.module_code, m.design_type, m.connector_type === 'magnet' ? 'magnet' : 'standard', m.notes]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q)),
  );
}

export async function createModule(values) {
  const { data, error } = await db().from('modules').insert(values).select().single();
  if (error) throw toAppError(error, 'Modul gagal disimpan.');
  return data;
}

export async function updateModule(id, values) {
  const { data, error } = await db().from('modules').update(values).eq('id', id).select();
  if (error) throw toAppError(error, 'Perubahan modul gagal disimpan.');
  if (!data?.length) throw noRowsError();
  return data[0];
}

export async function deleteModule(id) {
  const { data, error } = await db().from('modules').delete().eq('id', id).select('id');
  if (error) throw toAppError(error, 'Modul gagal dihapus.');
  if (!data?.length) throw noRowsError();
}
