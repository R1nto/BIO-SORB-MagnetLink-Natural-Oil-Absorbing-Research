// Dua bahasa: English (default) dan Indonesia.
// Teks sumber di main.js ditulis dalam bahasa Indonesia; saat bahasa = 'en' seluruh teks
// (node teks + placeholder/alt/aria-label/title) diterjemahkan lewat kamus di bawah setelah
// setiap render, sebelum browser menggambar halaman, sehingga tidak ada kedipan.

const KEY = 'biosorb.lang';
let lang = 'en';
try {
  const saved = localStorage.getItem(KEY);
  if (saved === 'id' || saved === 'en') lang = saved;
} catch { /* penyimpanan tidak tersedia: pakai default */ }

export const getLang = () => lang;
export const locale = () => (lang === 'id' ? 'id-ID' : 'en-US');
export const dateLocale = () => (lang === 'id' ? 'id-ID' : 'en-GB');

export function setLang(next) {
  lang = next === 'id' ? 'id' : 'en';
  try { localStorage.setItem(KEY, lang); } catch { /* abaikan */ }
  applyDocumentLang();
}

const META = {
  en: {
    title: 'BIO-SORB MagnetLink — Natural Oil-Absorbing Research',
    desc: 'BIO-SORB MagnetLink — a coconut-coir oil-absorbing module design with magnetic connectors and digital experiment records.'
  },
  id: {
    title: 'BIO-SORB MagnetLink — Riset Penyerap Minyak Alami',
    desc: 'BIO-SORB MagnetLink — rancangan modul penyerap minyak berbahan serat sabut kelapa dengan sambungan magnetik dan pencatatan eksperimen digital.'
  }
};
export function applyDocumentLang() {
  document.documentElement.lang = lang;
  document.title = META[lang].title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', META[lang].desc);
}

/* Terjemahan Indonesia -> English (kunci = teks sumber tepat, tanpa spasi tepi). */
const DICT = new Map(Object.entries({
  'Data contoh': 'Sample data',
  'Angka di bawah dikarang hanya untuk memperlihatkan tampilan. Bukan hasil penelitian.': 'The numbers below are made up only to show the layout. They are not research results.',
  'Sembunyikan data contoh': 'Hide sample data',
  'Tampilkan data contoh': 'Show sample data',
  'Belum ada data': 'No data yet',
  'Tampilkan data contoh untuk melihat bentuk grafik dan tabel.': 'Show sample data to see what the charts and tables look like.',
  'Pendaftaran anggota tim': 'Team registration',
  'Buat akun tim.': 'Create a team account.',
  'Siapa pun boleh mendaftar. Akun baru langsung bisa menambah dan mengubah data penelitian.': 'Anyone can register. A new account can add and edit research data right away.',
  'Akun belum bisa diaktifkan sebagai anggota tim.': 'The account could not be activated as a team member yet.',
  'Email ini belum didaftarkan sebagai anggota tim oleh pengelola proyek.': 'This email has not been registered as a team member by the project lead.',
  'Ulangi kata sandi': 'Repeat password',
  'Ketik ulang kata sandi': 'Type the password again',
  'Minimal 8 karakter': 'At least 8 characters',
  'Kode undangan': 'Invite code',
  'Kode dari pengelola proyek': 'Code from the project lead',
  'Daftar sebagai anggota tim': 'Register as a team member',
  'Sudah punya akun?': 'Already have an account?',
  'Belum punya akun?': "Don't have an account yet?",
  'Masuk': 'Sign in',
  'Daftar': 'Register',
  'Supabase belum dikonfigurasi. Isi file .env terlebih dahulu sebelum mendaftar.': 'Supabase is not configured. Fill in the .env file before registering.',
  'Kata sandi minimal 8 karakter.': 'Password must be at least 8 characters.',
  'Kata sandi dan pengulangannya tidak sama.': 'The passwords do not match.',
  'Pendaftaran berhasil. Selamat datang di tim BIO-SORB.': 'Registration successful. Welcome to the BIO-SORB team.',
  'Email belum dikonfirmasi. Buka email Anda, klik tautan konfirmasi, lalu kirim formulir ini lagi.': 'Email not confirmed yet. Open your inbox, click the confirmation link, then submit this form again.',
  'Email atau kata sandi tidak cocok.': 'Email or password does not match.',
  'Kode undangan tidak cocok.': 'The invite code does not match.',
  'Anggota tim sudah penuh (maksimal 2).': 'The team is full (maximum 2 members).',
  'Pendaftaran terkunci karena terlalu banyak kode salah. Hubungi pengelola proyek.': 'Registration is locked after too many wrong codes. Contact the project lead.',
  'Pendaftaran belum diaktifkan oleh pengelola proyek (kode undangan belum dibuat).': 'Registration has not been enabled by the project lead (no invite code set yet).',
  'Pendaftaran gagal.': 'Registration failed.',
  'Sembunyikan data contoh dan daftarkan modul serta eksperimen asli terlebih dahulu.': 'Hide the sample data and register real modules and experiments first.',

  // ---- Landing ----
  'Navigasi utama': 'Main navigation',
  'Buka navigasi': 'Open navigation',
  'Pilih bahasa': 'Choose language',
  'Inovasi untuk masa depan yang lebih bersih · HydroFest 2026': 'Innovation for a Cleaner Tomorrow · HydroFest 2026',
  'Modul penyerap minyak berbahan serat sabut kelapa, dengan konektor magnet di kedua ujung agar modul dapat disusun dan dilepas satu per satu.':
    'Oil-absorbing modules made of coconut-coir fiber, with magnet connectors on both ends so modules can be linked and detached one by one.',
  'Maskot Koko berdiri di samping tiga bantalan serat sabut kelapa yang tersambung dengan konektor magnet di tepi air':
    "Koko the mascot standing next to coconut-coir pads joined by magnet connectors at the water's edge",
  'Modul saling terhubung': 'Modules connect together',
  'Konektor magnet di dua sisi': 'Magnet connectors on both sides',
  'Tumpahan minyak di permukaan air mengganggu ekosistem perairan dan kehidupan sekitarnya. Penanganannya perlu bahan yang mudah didapat, dapat dipasang cepat, dan dapat diangkat kembali.':
    'Oil spills on the water surface disturb aquatic ecosystems and the life around them. Handling them calls for materials that are easy to source, quick to deploy, and possible to retrieve afterwards.',
  'Pelajari lebih lanjut': 'Learn More',
  'Lapisan minyak terlihat di permukaan air': 'Oil sheen visible on the water surface',
  'Serat sabut kelapa dipadukan dengan konektor magnet. Material seratlah yang diuji untuk menyerap minyak; magnet hanya berfungsi sebagai penghubung antarmodul, bukan sebagai penyerap.':
    'Coconut-coir fiber is combined with magnet connectors. The fiber is the material being tested for oil absorption; the magnet only links modules together and does not absorb anything.',
  'Lihat cara kerja': 'See How It Works',
  'Serat sabut kelapa dan rumah konektor magnet pada ujung modul': 'Coconut-coir fiber and a magnet connector housing at the end of a module',
  'Serat sabut kelapa dalam kantong mesh': 'Coconut-coir fiber in a mesh pouch',
  'Modul disambungkan dengan konektor magnet': 'Modules are joined with magnet connectors',
  'Uji dalam eksperimen terkontrol': 'Tested in a controlled experiment',
  'Serat sabut kelapa di dalam kantong mesh': 'Coconut-coir fiber inside a mesh pouch',
  'Dua modul tersambung dengan konektor magnet': 'Two modules joined by a magnet connector',
  'Modul diuji di dalam wadah berisi air': 'A module being tested in a container of water',
  'Efektivitas produk belum disimpulkan dan akan dinilai dari data pengujian.': 'Product effectiveness has not been concluded and will be judged from test data.',
  'Dari ide hingga inovasi nyata. Pengujian masih berlangsung.': 'From idea to real innovation. Testing is still ongoing.',
  'Eksplorasi material': 'Material exploration',
  'Memilih dan menyiapkan serat sabut kelapa': 'Selecting and preparing coconut-coir fiber',
  'Pengembangan modul': 'Module development',
  'Kantong mesh dan konektor magnet': 'Mesh pouch and magnet connectors',
  'Pengujian & analisis': 'Testing & analysis',
  'Sedang berjalan, hasil dicatat apa adanya': 'In progress; results are recorded as they are',
  'Publikasi hasil': 'Publishing results',
  'Setelah data cukup dan ditinjau tim': 'Once there is enough data and the team has reviewed it',
  'Lihat prosesnya, bukan hanya tampilan produknya.': "See the process, not just the product's look.",
  'Dashboard menyimpan data eksperimen dan menampilkan hasil yang sudah dipublikasikan. Angka baru tampil setelah tim memasukkan pengukuran yang sebenarnya.':
    'The dashboard stores experiment data and shows results that have been published. Numbers only appear once the team enters real measurements.',
  'Catatan pengujian': 'Test records',
  'Sampel, tanggal, siklus, dan metode pengukuran.': 'Samples, dates, cycles, and measurement methods.',
  'Rancangan MagnetLink': 'MagnetLink design',
  'Kode modul, variasi desain, jenis sambungan.': 'Module codes, design variations, connector types.',
  'Analisis hasil': 'Results analysis',
  'Perbandingan dari pengukuran yang valid.': 'Comparisons from valid measurements.',
  'Lihat data, grafik, dan hasil penelitian secara langsung melalui platform kami.': 'See the data, charts, and research results directly through our platform.',
  'Pratinjau antarmuka dashboard BIO-SORB dalam keadaan awal tanpa data eksperimen': 'Preview of the BIO-SORB dashboard interface in its initial state, with no experiment data',
  'Pratinjau antarmuka · belum menampilkan data penelitian': 'Interface preview · no research data shown yet',
  'Prototipe penelitian penyerap minyak berbahan serat sabut kelapa. Seluruh klaim performa mengikuti hasil pengujian yang tersedia.':
    'A research prototype of an oil absorber made from coconut-coir fiber. All performance claims follow the test results available.',

  // ---- Landing: section layar penuh ----
  'Gulir': 'Scroll',
  'Status: pengujian masih berlangsung. Belum ada klaim efektivitas.': 'Status: testing is still ongoing. No effectiveness claims yet.',
  'HydroFest 2026 · Prototipe penelitian': 'HydroFest 2026 · Research prototype',
  'Masalah & inovasi': 'Problem & Innovation',
  'Kenali modul': 'Meet the Modules',
  'Perjalanan riset': 'Research Journey',
  'Navigasi bagian': 'Section navigation',
  'Latar belakang': 'Background',
  'Minyak di atas air, masalah bagi semua.': 'Oil on water, a problem for everyone.',
  'Mudah didapat': 'Easy to source',
  'Cepat dipasang': 'Quick to deploy',
  'Dapat diangkat kembali': 'Retrievable',
  'Serat yang diuji, magnet yang menghubungkan.': 'Fiber under test, magnets that connect.',
  'Serat sabut kelapa': 'Coconut-coir fiber',
  'Konektor magnet': 'Magnet connector',
  'Modular': 'Modular',
  'Empat bagian yang membentuk BIO-SORB MagnetLink.': 'The four parts that make up BIO-SORB MagnetLink.',
  'Maskot': 'Mascot',
  'Koko adalah maskot proyek: wajah ramah untuk pesan sederhana tentang air yang lebih bersih.': 'Koko is the project mascot: a friendly face for a simple message about cleaner water.',
  'Material utama yang diuji sebagai penyerap minyak. Kinerjanya dinilai dari data pengujian.': 'The main material being tested as an oil absorber. Its performance is judged from test data.',
  'Wadah': 'Container',
  'Kantong mesh': 'Mesh pouch',
  'Menjaga serat tetap terkumpul sehingga modul mudah dipasang dan diangkat kembali.': 'Keeps the fiber together so the module is easy to deploy and retrieve.',
  'Penghubung': 'Connector',
  'Terpasang di dua sisi untuk menyambung modul. Magnet tidak menyerap minyak; ia hanya menghubungkan.': 'Fitted on two sides to join modules. The magnet does not absorb oil; it only connects.',
  'Cara kerja': 'How It Works',
  'Serat sabut kelapa dimasukkan ke dalam kantong mesh agar bentuk modul terjaga.': 'Coconut-coir fiber is placed in a mesh pouch so the module keeps its shape.',
  'Dua modul disambungkan lewat konektor magnet di sisi yang berhadapan.': 'Two modules are joined through the magnet connectors on facing sides.',
  'Modul diuji dalam eksperimen terkontrol, lalu hasilnya dicatat apa adanya di dashboard.': 'Modules are tested in a controlled experiment and the results are recorded as-is in the dashboard.',
  'Langkah sebelumnya': 'Previous step',
  'Langkah berikutnya': 'Next step',
  'Sedang berjalan': 'Ongoing',
  'Direncanakan': 'Planned',

  // ---- Aplikasi: kerangka ----
  'Ruang penelitian': 'Research workspace',
  'Riset untuk lingkungan': 'Research for the environment',
  'Catat hasil secara jujur, bandingkan setiap rancangan, dan kembangkan berdasarkan bukti.': 'Record results honestly, compare every design, and develop based on evidence.',
  'Buka menu': 'Open menu',
  'Mode tim': 'Team mode',
  'Mode publik': 'Public mode',
  'Keluar': 'Log out',
  'Masuk tim': 'Team login',
  'Memuat data…': 'Loading data…',

  // ---- Dashboard ----
  'Ruang penelitian BIO-SORB': 'BIO-SORB research workspace',
  'Halo, Peneliti!': 'Hello, Researcher!',
  'Selamat datang di BIO-SORB MagnetLink. Pantau modul, catat eksperimen, dan tinjau hasil pengujian dari satu tempat.':
    'Welcome to BIO-SORB MagnetLink. Monitor modules, record experiments, and review test results in one place.',
  'Input eksperimen': 'Input experiment',
  'Mode publik · baca saja': 'Public mode · read only',
  'Data ditampilkan sesuai status publikasi.': 'Data is shown according to publication status.',
  'Detail serat sabut kelapa dan konektor magnet pada modul': 'Detail of coconut-coir fiber and a magnet connector on a module',
  'Total modul': 'Total modules',
  'Modul yang terdaftar': 'Registered modules',
  'Total eksperimen': 'Total experiments',
  'Kegiatan penelitian': 'Research activities',
  'Rata-rata kapasitas': 'Average capacity',
  'Belum ada pengukuran valid': 'No valid measurements yet',
  'Siklus tercatat': 'Recorded cycles',
  'Riwayat penggunaan modul': 'Module usage history',
  'Supabase belum dikonfigurasi. Website berjalan dalam mode pratinjau kosong. Isi file': 'Supabase is not configured. The site is running as an empty preview. Fill in the',
  'untuk menghubungkan database penelitian.': 'file to connect the research database.',
  'Perbandingan kapasitas penyerapan': 'Absorption capacity comparison',
  'Rata-rata minyak tertahan per gram material, berdasarkan data valid.': 'Average oil retained per gram of material, based on valid data.',
  'Kapasitas penyerapan minyak': 'Oil absorption capacity',
  'Belum ada data untuk dibandingkan': 'No data to compare yet',
  'Grafik akan muncul setelah modul memiliki hasil pengujian dengan massa minyak yang terukur secara terpisah.':
    'The chart will appear once modules have test results with separately measured oil mass.',
  'Aktivitas pengujian terbaru': 'Latest test activity',
  'Lima catatan paling baru.': 'The five most recent records.',
  'Lihat semua ↗': 'View all ↗',
  'Tanggal': 'Date',
  'Modul': 'Module',
  'Siklus': 'Cycle',
  'Kapasitas': 'Capacity',
  'Belum ada catatan pengujian': 'No test records yet',
  'Eksperimen yang sudah dipublikasikan akan muncul di bagian ini.': 'Published experiments will appear in this section.',
  'Modul terdaftar': 'Registered modules',
  'Identitas dan jenis sambungan.': 'Identity and connector type.',
  'Semua modul ↗': 'All modules ↗',
  'Kode': 'Code',
  'Desain': 'Design',
  'Konektor': 'Connector',
  'Belum ada modul': 'No modules yet',
  'Modul BIO-SORB akan tercatat di sini setelah didaftarkan oleh tim.': 'BIO-SORB modules will be listed here once the team registers them.',
  'Catatan metode': 'Method notes',
  'Interpretasi data yang hati-hati.': 'Careful interpretation of data.',
  'Nilai kapasitas minyak hanya dihitung ketika massa minyak dapat diukur terpisah. Kenaikan massa bantalan tidak otomatis sama dengan massa minyak karena air mungkin ikut tertahan.':
    'Oil capacity is only calculated when the oil mass can be measured separately. A rise in pad mass does not automatically equal oil mass, because water may be retained too.',
  'Pahami metode': 'Understand the method',

  // ---- Eksperimen ----
  'Tambah catatan pengujian': 'Add test record',
  'Masukkan data hasil pengukuran yang benar-benar dilakukan.': 'Enter data from measurements that were actually taken.',
  'Tim': 'Team',
  'Eksperimen': 'Experiment',
  'Tanggal uji': 'Test date',
  'Siklus penggunaan': 'Usage cycle',
  'Massa kering material (g)': 'Dry mass of material (g)',
  'Contoh: 5.000': 'Example: 5.000',
  'Massa minyak tertahan (g)': 'Oil mass retained (g)',
  'Kosongkan jika belum terukur terpisah': 'Leave empty if not measured separately',
  'Jangan isi dengan selisih massa total jika air masih ikut tertahan.': 'Do not fill in the total mass difference if water is still retained.',
  'Massa air ikut tertahan (g)': 'Water mass also retained (g)',
  'Opsional': 'Optional',
  'Metode pengukuran': 'Measurement method',
  'Contoh: pemisahan dan penimbangan': 'Example: separation and weighing',
  'Simpan catatan': 'Save record',
  'Buat minimal satu eksperimen dan satu modul sebelum menambahkan catatan pengujian.': 'Create at least one experiment and one module before adding test records.',
  'Mode publik hanya dapat melihat catatan yang telah dipublikasikan.': 'Public mode can only see records that have been published.',
  'Masuk sebagai tim': 'Log in as team',
  'untuk mengelola eksperimen.': 'to manage experiments.',
  'Buat kegiatan eksperimen': 'Create an experiment',
  'Definisikan kegiatan sebelum memasukkan catatan pengujian.': 'Define the activity before entering test records.',
  'Judul eksperimen': 'Experiment title',
  'Contoh: Uji susunan serat kelapa': 'Example: Coir fiber arrangement test',
  'Deskripsi / tujuan': 'Description / purpose',
  'Variasi desain dan tujuan pengujian': 'Design variations and test purpose',
  'Status publikasi': 'Publication status',
  'Draft — hanya tim': 'Draft — team only',
  'Publikasikan untuk pengunjung': 'Publish for visitors',
  'Simpan eksperimen': 'Save experiment',
  'Daftar kegiatan': 'Activity list',
  'Status': 'Status',
  'Dibuat': 'Created',
  'Publik': 'Public',
  'Belum ada eksperimen': 'No experiments yet',
  'Buat kegiatan eksperimen sebelum menambahkan catatan pengujian.': 'Create an experiment before adding test records.',
  'Data primer': 'Primary data',
  'Eksperimen & pengujian': 'Experiments & testing',
  'Kelola kegiatan dan catatan pengujian setiap modul BIO-SORB.': 'Manage activities and test records for each BIO-SORB module.',
  'Daftar hasil pengujian': 'Test results list',
  'Massa kering': 'Dry mass',
  'Minyak tertahan': 'Oil retained',
  'Belum ada data pengujian': 'No test data yet',
  'Catatan yang dipublikasikan akan tampil di sini. Tim dapat memasukkan data setelah login.': 'Published records will appear here. The team can enter data after logging in.',

  // ---- Modul ----
  'Daftarkan modul': 'Register a module',
  'Gunakan kode unik untuk setiap bantalan.': 'Use a unique code for each pad.',
  'Kode modul': 'Module code',
  'Contoh: BS-M01': 'Example: BS-M01',
  'Jenis desain': 'Design type',
  'Contoh: serat longgar': 'Example: loose fiber',
  'Jenis konektor': 'Connector type',
  'Standar / tanpa magnet': 'Standard / no magnet',
  'Simpan modul': 'Save module',
  'Daftar modul publik. Login tim diperlukan untuk menambahkan modul.': 'Public module list. Team login is required to add modules.',
  'Inventaris produk': 'Product inventory',
  'Modul BIO-SORB': 'BIO-SORB modules',
  'Identitas modul, variasi desain, dan jenis konektor.': 'Module identity, design variations, and connector type.',
  'Daftar modul': 'Module list',
  'Belum ada modul terdaftar': 'No modules registered yet',
  'Modul yang didaftarkan tim akan muncul di sini.': 'Modules registered by the team will appear here.',

  // ---- Analisis ----
  'Analisis data': 'Data analysis',
  'Perbandingan kapasitas': 'Capacity comparison',
  'Hanya hasil yang memiliki massa minyak terukur terpisah yang dihitung.': 'Only results with separately measured oil mass are counted.',
  'Kapasitas penyerapan minyak per modul': 'Oil absorption capacity per module',
  'Q = massa minyak tertahan / massa kering material (g/g).': 'Q = oil mass retained / dry mass of material (g/g).',
  'Analisis belum tersedia': 'Analysis not available yet',
  'Masukkan massa minyak yang benar-benar terukur, bukan sekadar perubahan massa total bantalan.': 'Enter oil mass that was truly measured, not merely the change in total pad mass.',
  'Prinsip membaca hasil': 'Principles for reading results',
  'Perbandingan yang dapat dipertanggungjawabkan.': 'Comparisons that can be defended.',
  'Jika air ikut tertahan dan belum dipisahkan dari minyak, kapasitas penyerapan minyak tidak boleh dihitung dari kenaikan massa bantalan saja. Catat kondisi tersebut sebagai keterbatasan metode.':
    'If water is retained and has not been separated from the oil, oil absorption capacity must not be calculated from the rise in pad mass alone. Record this condition as a limitation of the method.',

  // ---- Laporan ----
  'Dokumentasi': 'Documentation',
  'Laporan penelitian': 'Research report',
  'Unduh data eksperimen yang sedang dapat diakses dalam format CSV.': 'Download the experiment data currently accessible in CSV format.',
  'Ekspor CSV': 'Export CSV',
  'Data untuk laporan': 'Data for the report',
  'File CSV berisi data yang diizinkan oleh kebijakan akses Supabase. Pastikan metode pengukuran dan satuan dicantumkan dalam laporan akhir.':
    'The CSV file contains data permitted by the Supabase access policy. Make sure the measurement method and units are stated in the final report.',

  // ---- Tentang ----
  'Tentang proyek': 'About the project',
  'Rancangan penyerap minyak berbasis serat sabut kelapa dengan sambungan magnetik.': 'An oil-absorber design based on coconut-coir fiber with magnetic connections.',
  'Maskot Koko': 'Koko mascot',
  'Ringkasan konsep': 'Concept summary',
  'Produk fisik dan sistem pencatatan yang saling melengkapi.': 'A physical product and a record-keeping system that complement each other.',
  'BIO-SORB dirancang sebagai bantalan modular berisi serat sabut kelapa di dalam kantong mesh. Konektor magnet pada kedua sisi berlawanan digunakan untuk menyambungkan beberapa modul.':
    'BIO-SORB is designed as a modular pad filled with coconut-coir fiber inside a mesh pouch. Magnet connectors on two opposite sides are used to join several modules.',
  'Serat sabut kelapa yang diuji sebagai bahan penyerap.': 'Coconut-coir fiber tested as the absorbent material.',
  'Magnet terlindungi sebagai penghubung antarmodul.': 'A protected magnet that links modules together.',
  'Pencatatan, pengelolaan, dan analisis hasil pengujian.': 'Recording, managing, and analysing test results.',

  // ---- Login ----
  'Akses anggota tim': 'Team member access',
  'Selamat datang kembali.': 'Welcome back.',
  'Masuk untuk mengelola modul dan catatan eksperimen BIO-SORB. Pengunjung tidak perlu masuk untuk melihat hasil yang telah dipublikasikan.':
    'Log in to manage BIO-SORB modules and experiment records. Visitors do not need to log in to see published results.',
  'Supabase belum dikonfigurasi. Isi file .env terlebih dahulu sebelum login.': 'Supabase is not configured. Fill in the .env file before logging in.',
  'Email tim': 'Team email',
  'Kata sandi': 'Password',
  'Masukkan kata sandi': 'Enter your password',
  'Masuk ke ruang riset': 'Enter the research workspace',
  '← Kembali ke halaman utama': '← Back to home page',
  'Maskot Koko BIO-SORB': 'BIO-SORB Koko mascot',

  // ---- Pesan (toast / galat) ----
  'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada file .env.':
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the .env file.',
  'Konfigurasi Supabase belum tersedia.': 'Supabase configuration is not available.',
  'Email atau kata sandi tidak cocok.': 'Email or password does not match.',
  'Akun berhasil masuk, tetapi belum terdaftar sebagai anggota tim BIO-SORB.': 'Signed in, but this account is not registered as a BIO-SORB team member.',
  'Berhasil masuk sebagai anggota tim.': 'Signed in as a team member.',
  'Eksperimen berhasil disimpan.': 'Experiment saved.',
  'Modul berhasil disimpan.': 'Module saved.',
  'Catatan pengujian berhasil disimpan sebagai draft.': 'Test record saved as a draft.',
  'Daftarkan satu eksperimen dan satu modul terlebih dahulu.': 'Register one experiment and one module first.',
  'Massa kering dan nomor siklus harus lebih besar dari nol.': 'Dry mass and cycle number must be greater than zero.',
  'Massa tidak boleh bernilai negatif.': 'Mass must not be negative.',
  'Terjadi kesalahan.': 'Something went wrong.'
}));

// Menu samping & judul halaman: "Modul" di sini jamak, di tabel tunggal.
const NAV = new Map(Object.entries({
  Eksperimen: 'Experiments', Modul: 'Modules', Analisis: 'Analysis', Laporan: 'Reports', 'Tentang BIO-SORB': 'About BIO-SORB'
}));

const plural = (n, one, many) => `${n} ${Number(n) === 1 ? one : many}`;
const PATTERNS = [
  [/^Langkah (\d+)$/, (_, n) => `Step ${n}`],
  [/^(\d+) modul terukur$/, (_, n) => `${plural(n, 'module', 'modules')} measured`],
  [/^(\d+) modul terdaftar\.$/, (_, n) => `${plural(n, 'module', 'modules')} registered.`],
  [/^(\d+) modul$/, (_, n) => plural(n, 'module', 'modules')],
  [/^(\d+) eksperimen terdaftar\.$/, (_, n) => `${plural(n, 'experiment', 'experiments')} registered.`],
  [/^(\d+) catatan yang dapat diakses\.$/, (_, n) => `${plural(n, 'record', 'records')} accessible.`],
  [/^(\d+) catatan pengujian tersedia\.$/, (_, n) => `${plural(n, 'test record', 'test records')} available.`],
  [/^(\d+) pengukuran minyak valid$/, (_, n) => `${plural(n, 'valid oil measurement', 'valid oil measurements')}`]
];

export function tr(text) {
  if (lang !== 'en' || typeof text !== 'string') return text;
  const key = text.trim().replace(/\s+/g, ' ');
  if (DICT.has(key)) return DICT.get(key);
  for (const [re, fn] of PATTERNS) if (re.test(key)) return key.replace(re, fn);
  return text;
}

const ATTRS = ['placeholder', 'alt', 'aria-label', 'title'];
export function localize(rootEl) {
  if (lang !== 'en' || !rootEl) return;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const parent = node.parentElement;
    if (parent?.closest('.side-link, .breadcrumb') && NAV.has(trimmed)) { node.nodeValue = raw.replace(trimmed, NAV.get(trimmed)); continue; }
    const out = tr(trimmed);
    if (out !== trimmed) node.nodeValue = raw.replace(trimmed, out);
  }
  rootEl.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach((el) => {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) { const out = tr(v); if (out !== v) el.setAttribute(a, out); }
    }
  });
}

export function langSwitch() {
  const b = (code, label) => `<button type="button" class="lang-switch__btn${lang === code ? ' is-active' : ''}" data-lang="${code}" aria-pressed="${lang === code}" lang="${code}">${label}</button>`;
  return `<div class="lang-switch" role="group" aria-label="Pilih bahasa">${b('en', 'EN')}${b('id', 'ID')}</div>`;
}
