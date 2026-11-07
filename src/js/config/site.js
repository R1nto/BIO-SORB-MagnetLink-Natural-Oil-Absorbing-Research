// Informasi situs yang bisa diubah tanpa menyentuh logika aplikasi.
export const SITE = {
  name: 'BIO-SORB MagnetLink',
  event: 'HydroFest 2026',
  // Identitas tim dapat diisi kemudian. Selama kosong, halaman "Tentang" menampilkan catatan netral.
  team: {
    name: '',
    school: '',
    members: [], // contoh: ['Nama Anggota 1', 'Nama Anggota 2']
  },

  // Tahapan penelitian untuk landing page. status: 'done' | 'ongoing' | 'next'.
  // Ubah status sesuai kondisi sebenarnya. Jangan menulis hasil di sini; hasil hanya tampil dari database.
  journey: [
    { title: 'Perumusan masalah', status: 'ongoing', text: 'Menentukan pertanyaan penelitian dan variabel yang akan diukur.' },
    { title: 'Pembuatan modul', status: 'ongoing', text: 'Menyiapkan modul serat sabut kelapa dalam kantong mesh dengan konektor magnet.' },
    { title: 'Eksperimen terkontrol', status: 'next', text: 'Menguji modul dengan prosedur dan kondisi yang dicatat agar dapat dibandingkan.' },
    { title: 'Pencatatan dan analisis data', status: 'next', text: 'Memasukkan pengukuran ke dashboard, lalu menghitung dan membandingkan hasilnya.' },
    { title: 'Evaluasi dan perbaikan', status: 'next', text: 'Menilai kekurangan desain dan menentukan perbaikan berdasarkan data.' },
  ],
};
