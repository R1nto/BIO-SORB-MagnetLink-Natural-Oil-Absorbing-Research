import { db } from '../config/supabase.js';
import { toAppError, noRowsError } from '../utils/errors.js';

/** Daftar eksperimen (RLS: publik hanya melihat yang dipublikasikan) beserta jumlah data pengujiannya. */
export async function listExperiments() {
  const { data, error } = await db()
    .from('experiments')
    .select('*, test_records(count)')
    .order('created_at', { ascending: false });
  if (error) throw toAppError(error, 'Gagal memuat daftar eksperimen.');
  return data.map((e) => ({ ...e, record_count: e.test_records?.[0]?.count ?? 0 }));
}

export async function getExperiment(id) {
  const { data, error } = await db().from('experiments').select('*').eq('id', id).maybeSingle();
  if (error) throw toAppError(error, 'Gagal memuat eksperimen.');
  return data; // null bila tidak ada / belum dipublikasikan
}

export async function createExperiment(values) {
  const { data, error } = await db().from('experiments').insert(values).select().single();
  if (error) throw toAppError(error, 'Eksperimen gagal disimpan.');
  return data;
}

export async function updateExperiment(id, values) {
  const { data, error } = await db().from('experiments').update(values).eq('id', id).select();
  if (error) throw toAppError(error, 'Perubahan eksperimen gagal disimpan.');
  if (!data?.length) throw noRowsError();
  return data[0];
}

export async function deleteExperiment(id) {
  const { data, error } = await db().from('experiments').delete().eq('id', id).select('id');
  if (error) throw toAppError(error, 'Eksperimen gagal dihapus.');
  if (!data?.length) throw noRowsError();
}
