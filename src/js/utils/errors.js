// Mengubah error Supabase/PostgREST menjadi pesan yang mudah dipahami dan memberi jalan keluar.

const BY_CODE = {
  '23505': 'Data dengan nilai yang sama sudah ada. Gunakan kode lain atau ubah data yang sudah ada.',
  '23503': 'Data ini masih dipakai oleh data lain. Hapus atau ubah data yang memakainya terlebih dahulu.',
  '23514': 'Ada nilai yang tidak memenuhi aturan database. Periksa kembali isian angka dan teks.',
  '23502': 'Ada isian wajib yang masih kosong. Lengkapi lalu coba lagi.',
  '42501': 'Akun ini tidak punya izin untuk tindakan tersebut. Masuk dengan akun anggota tim.',
  PGRST301: 'Sesi login berakhir. Masuk kembali untuk melanjutkan.',
  PGRST116: 'Data tidak ditemukan. Mungkin sudah dihapus atau belum dipublikasikan.',
};

export class AppError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AppError';
    this.cause = cause;
  }
}

export function toAppError(error, fallback = 'Terjadi kesalahan. Coba lagi sebentar lagi.') {
  if (!error) return new AppError(fallback);
  if (error instanceof AppError) return error;
  const raw = String(error.message ?? '');
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return new AppError('Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.', error);
  }
  if (error.code === '23505' && /module_code/i.test(`${error.message} ${error.details}`)) {
    return new AppError('Kode modul ini sudah dipakai. Gunakan kode lain (huruf besar/kecil dianggap sama).', error);
  }
  if (error.code === '23503' && /test_records_module_id/i.test(`${error.message} ${error.details}`)) {
    return new AppError('Modul ini sudah punya data pengujian, jadi tidak bisa dihapus. Hapus data pengujiannya dulu.', error);
  }
  if (/team limit|Batas anggota tim/i.test(raw)) return new AppError(raw, error);
  return new AppError(BY_CODE[error.code] ?? fallback, error);
}

/** Dipakai ketika update/delete sukses tanpa baris terdampak (biasanya diblokir RLS). */
export function noRowsError() {
  return new AppError('Perubahan tidak tersimpan. Akun ini mungkin tidak punya izin, atau data sudah dihapus.');
}
