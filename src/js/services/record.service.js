import { db } from '../config/supabase.js';
import { toAppError, noRowsError } from '../utils/errors.js';

const SELECT =
  '*, modules(module_code, design_type, connector_type), experiments(title, is_published)';

/** Data pengujian. RLS memastikan publik hanya menerima record yang sudah dipublikasikan. */
export async function listRecords({ experimentId, moduleId, from, to } = {}) {
  let query = db()
    .from('test_records')
    .select(SELECT)
    .order('test_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (experimentId) query = query.eq('experiment_id', experimentId);
  if (moduleId) query = query.eq('module_id', moduleId);
  if (from) query = query.gte('test_date', from);
  if (to) query = query.lte('test_date', to);
  const { data, error } = await query;
  if (error) throw toAppError(error, 'Gagal memuat data pengujian.');
  return data;
}

const COLUMNS = [
  'experiment_id',
  'module_id',
  'test_date',
  'cycle_number',
  'dry_mass_g',
  'oil_retained_g',
  'water_retained_g',
  'wet_mass_g',
  'measurement_method',
  'is_published',
];
const pickColumns = (values) => Object.fromEntries(COLUMNS.map((c) => [c, values[c]]));

export async function createRecord(values) {
  const { data, error } = await db().from('test_records').insert(pickColumns(values)).select().single();
  if (error) throw toAppError(error, 'Data pengujian gagal disimpan.');
  await saveNote(data.id, values.note);
  return data;
}

export async function updateRecord(id, values) {
  const { data, error } = await db().from('test_records').update(pickColumns(values)).eq('id', id).select();
  if (error) throw toAppError(error, 'Perubahan data pengujian gagal disimpan.');
  if (!data?.length) throw noRowsError();
  await saveNote(id, values.note);
  return data[0];
}

export async function deleteRecord(id) {
  const { data, error } = await db().from('test_records').delete().eq('id', id).select('id');
  if (error) throw toAppError(error, 'Data pengujian gagal dihapus.');
  if (!data?.length) throw noRowsError();
}

/** Publikasikan / tarik semua data pengujian dalam satu eksperimen. */
export async function setRecordsPublished(experimentId, isPublished) {
  const { data, error } = await db()
    .from('test_records')
    .update({ is_published: isPublished })
    .eq('experiment_id', experimentId)
    .select('id');
  if (error) throw toAppError(error, 'Status publikasi data gagal diubah.');
  return data.length;
}

/** Catatan internal (hanya tim). Mengembalikan Map recordId -> teks catatan. */
export async function getNotes(recordIds) {
  if (!recordIds.length) return new Map();
  const { data, error } = await db().from('internal_notes').select('test_record_id, note').in('test_record_id', recordIds);
  if (error) throw toAppError(error, 'Gagal memuat catatan internal.');
  return new Map(data.map((n) => [n.test_record_id, n.note]));
}

/** Satu catatan per record: isi = simpan/ubah, kosong = hapus. */
export async function saveNote(recordId, text) {
  const note = String(text ?? '').trim();
  if (!note) {
    const { error } = await db().from('internal_notes').delete().eq('test_record_id', recordId);
    if (error) throw toAppError(error, 'Catatan gagal dihapus.');
    return;
  }
  const { error } = await db()
    .from('internal_notes')
    .upsert({ test_record_id: recordId, note }, { onConflict: 'test_record_id' });
  if (error) throw toAppError(error, 'Data tersimpan, tetapi catatan gagal disimpan.');
}
