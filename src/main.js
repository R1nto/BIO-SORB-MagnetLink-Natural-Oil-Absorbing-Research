import './style.css';
import './design.css';
import { DEMO_DATA } from './demo.js';
import { locale, dateLocale, setLang, applyDocumentLang, localize, tr, langSwitch } from './i18n.js';

const env = import.meta.env || {};
const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
const configured = Boolean(SUPABASE_URL && SUPABASE_KEY);
const root = document.querySelector('#app');
const SESSION_KEY = 'biosorb.auth.session';
let session = readSession();
let cache = { modules: [], experiments: [], records: [] };
let demoActive = false;
const DEMO_KEY = 'biosorb.demo';
const demoOff = () => { try { return localStorage.getItem(DEMO_KEY) === 'off'; } catch { return false; } };
const setDemoOff = (v) => { try { v ? localStorage.setItem(DEMO_KEY, 'off') : localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ } };
let toastTimer;

function readSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(value) {
  session = value;
  if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else localStorage.removeItem(SESSION_KEY);
}
function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function icon(name, size = 18) {
  const common = `class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.4 9.1A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.9L14 9V3"/><path d="M8 15h8"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    leaf: '<path d="M20 4c-7 0-13 2.5-14.5 8.2C4.4 16.5 8 20 12 20c6 0 8-7 8-16Z"/><path d="M4 21c3-5 7-8 12-11"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
    external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
    droplet: '<path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z"/>',
    repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'
  };
  return `<svg ${common}>${paths[name] || paths.info}</svg>`;
}
function routeTo(path) {
  history.pushState({}, '', path);
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}
function showToast(message, error = false) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = `toast${error ? ' error' : ''}`;
  el.textContent = tr(message);
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 3400);
}
function moneylessDate(value) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.valueOf()) ? esc(value) : new Intl.DateTimeFormat(dateLocale(), { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
function fmt(value, digits = 2) {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString(locale(), { maximumFractionDigits: digits });
}
function averageCapacity(records) {
  const valid = records.filter(row => row.oil_retained_g !== null && row.oil_retained_g !== undefined && Number(row.dry_mass_g) > 0);
  if (!valid.length) return null;
  return valid.reduce((sum, row) => sum + Number(row.oil_retained_g) / Number(row.dry_mass_g), 0) / valid.length;
}
async function api(path, options = {}) {
  if (!configured) throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada file .env.');
  const token = session?.access_token || SUPABASE_KEY;
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { data = body; }
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase request failed (${response.status})`);
  return data;
}
async function loadResearchData() {
  let real = { modules: [], experiments: [], records: [] };
  if (configured) {
    const [modules, experiments, records] = await Promise.all([
      api('modules?select=id,module_code,design_type,connector_type,created_at&order=created_at.desc'),
      api('experiments?select=id,title,description,is_published,created_at&order=created_at.desc'),
      api('test_records?select=id,experiment_id,module_id,test_date,cycle_number,dry_mass_g,oil_retained_g,water_retained_g,measurement_method,is_published,created_at&order=test_date.desc')
    ]);
    real = { modules: modules || [], experiments: experiments || [], records: records || [] };
  }
  const empty = !real.modules.length && !real.experiments.length && !real.records.length;
  demoActive = empty && !demoOff();
  cache = demoActive ? { modules: [...DEMO_DATA.modules], experiments: [...DEMO_DATA.experiments], records: [...DEMO_DATA.records] } : real;
  window.__demoAvailable = empty;
}
function demoBanner() {
  if (demoActive) return `<div class="demo-banner" role="status"><div><strong>Data contoh</strong><span>Angka di bawah dikarang hanya untuk memperlihatkan tampilan. Bukan hasil penelitian.</span></div><button class="btn btn--outline btn--small" id="demoToggle" type="button">Sembunyikan data contoh</button></div>`;
  if (window.__demoAvailable) return `<div class="demo-banner demo-banner--off" role="status"><div><strong>Belum ada data</strong><span>Tampilkan data contoh untuk melihat bentuk grafik dan tabel.</span></div><button class="btn btn--small" id="demoToggle" type="button">Tampilkan data contoh</button></div>`;
  return '';
}
async function passwordGrant(email, password) {
  if (!configured) throw new Error('Konfigurasi Supabase belum tersedia.');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = String(data?.msg || data?.message || data?.error_description || '');
    if (/not confirmed/i.test(msg)) throw new Error('Email belum dikonfirmasi. Buka email Anda, klik tautan konfirmasi, lalu kirim formulir ini lagi.');
    throw new Error('Email atau kata sandi tidak cocok.');
  }
  return data;
}
async function registerAccount(email, password) {
  if (!configured) throw new Error('Konfigurasi Supabase belum tersedia.');
  // 1) buat akun (bila sudah ada, lanjut ke langkah masuk)
  await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  }).catch(() => {});
  // 2) masuk, lalu 3) klaim keanggotaan dengan kode undangan (diperiksa di server)
  const data = await passwordGrant(email, password);
  saveSession(data);
  let result;
  try { result = await api('rpc/register_team_member', { method: 'POST', body: '{}' }); }
  catch (error) { saveSession(null); throw error; }
  if (result !== 'ok') {
    saveSession(null);
    throw new Error(({
      unconfirmed: 'Email belum dikonfirmasi. Buka email Anda, klik tautan konfirmasi, lalu kirim formulir ini lagi.',
      not_allowed: 'Email ini belum didaftarkan sebagai anggota tim oleh pengelola proyek.'
    })[result] || 'Pendaftaran gagal.');
  }
}
async function login(email, password) {
  const data = await passwordGrant(email, password);
  saveSession(data);
  try {
    // Pendaftaran terbuka: akun yang berhasil masuk otomatis menjadi anggota tim.
    const result = await api('rpc/register_team_member', { method: 'POST', body: '{}' });
    if (result !== 'ok') throw new Error('Akun belum bisa diaktifkan sebagai anggota tim.');
  } catch (error) { saveSession(null); throw error; }
}
async function logout() {
  if (session?.access_token && configured) {
    try { await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` } }); } catch { /* local logout still proceeds */ }
  }
  saveSession(null);
  routeTo('/app');
}

const SECTIONS = [['home', 'Home'], ['problem', 'Masalah & inovasi'], ['about', 'Kenali modul'], ['how', 'How It Works'], ['research', 'Research']];
function landingPage() {
  return `
  <div class="landing-page">
    <div class="scroll-progress" aria-hidden="true"><i></i></div>
    <header class="site-header"><div class="container navbar">
      <a class="brand" href="/" data-route><img src="/logo-mark.svg" alt=""/><span class="brand-text"><strong>BIO-SORB</strong><small>MagnetLink</small></span></a>
      <nav class="nav-links" id="siteNav" aria-label="Navigasi utama"><a class="is-active" href="#home">Home</a><a href="#problem">Background</a><a href="#about">About</a><a href="#how">How It Works</a><a href="#research">Research</a><a class="nav-links__login" href="/login" data-route>Team Login</a></nav>
      <div class="nav-actions">${langSwitch()}<a href="/app#/dashboard" data-route data-tryme class="btn btn--small">Try Me ${icon('arrow',15)}</a><button class="nav-toggle" id="navToggle" aria-label="Buka navigasi" aria-expanded="false">${icon('menu',20)}</button></div>
    </div></header>
    <nav class="dots" aria-label="Navigasi bagian">${SECTIONS.map(([id, label], i) => `<a class="dots__dot${i === 0 ? ' is-active' : ''}" href="#${id}" data-dot="${id}" aria-label="${label}"><span class="dots__label">${label}</span></a>`).join('')}</nav>
    <main>
      <!-- 1 · Key visual -->
      <section class="hero snap" id="home">
        <span class="leaf leaf--a" aria-hidden="true"></span><span class="leaf leaf--b" aria-hidden="true"></span>
        <div class="container hero-grid">
          <div class="hero-copy">
            <div class="hero-badge"><i></i> Inovasi untuk masa depan yang lebih bersih · HydroFest 2026</div>
            <h1>BIO-SORB<span>MagnetLink</span></h1>
            <p class="hero-slogan">Nature-Inspired Absorption. <br/>Connected by Innovation.</p>
            <p class="hero-desc">Modul penyerap minyak berbahan serat sabut kelapa, dengan konektor magnet di kedua ujung agar modul dapat disusun dan dilepas satu per satu.</p>
            <div class="hero-actions">
              <a href="/app#/dashboard" data-route data-tryme class="btn btn--lg">Try Me ${icon('arrow',17)}</a>
              <a href="/app#/dashboard" data-route class="hero-link"><span class="hero-link__icon">${icon('chart',16)}</span><span>Explore Our Research Dashboard</span></a>
            </div>
          </div>
          <figure class="hero-art">
            <img src="/images/hero-scene.webp" width="1932" height="1092" alt="Maskot Koko berdiri di samping tiga bantalan serat sabut kelapa yang tersambung dengan konektor magnet di tepi air" fetchpriority="high"/>
            <figcaption class="hero-art__tag"><span class="hero-art__mark">${icon('repeat',16)}</span><span><strong>Modul saling terhubung</strong><small>Konektor magnet di dua sisi</small></span></figcaption>
          </figure>
        </div>
        <div class="hero-status"><span class="hero-status__chip">HydroFest 2026 · Prototipe penelitian</span><span class="hero-status__text"><i></i>Status: pengujian masih berlangsung. Belum ada klaim efektivitas.</span></div>
        <a class="scroll-cue" href="#problem" aria-label="Gulir"><span class="scroll-cue__mouse"><i></i></span><span>Gulir</span></a>
      </section>

      <!-- 2 · Latar belakang (tab) -->
      <section class="lore snap" id="problem" data-lore>
        <div class="lore__bgs" aria-hidden="true">
          <img class="lore__bg is-active" src="/images/oil-surface.webp" alt="" loading="lazy"/>
          <img class="lore__bg" src="/images/coir-detail.webp" alt="" loading="lazy"/>
        </div>
        <div class="lore__shade" aria-hidden="true"></div>
        <div class="container lore__grid">
          <div class="lore__main" data-reveal>
            <p class="section-kicker section-kicker--light">Latar belakang</p>
            <div class="lore__tabs" role="tablist" aria-label="Latar belakang">
              <button class="lore__tab is-active" role="tab" aria-selected="true" data-lore-tab="0">The Problem</button>
              <button class="lore__tab" role="tab" aria-selected="false" data-lore-tab="1">Our Innovation</button>
            </div>
            <div class="lore__panel is-active" role="tabpanel">
              <h2>Minyak di atas air, masalah bagi semua.</h2>
              <p>Tumpahan minyak di permukaan air mengganggu ekosistem perairan dan kehidupan sekitarnya. Penanganannya perlu bahan yang mudah didapat, dapat dipasang cepat, dan dapat diangkat kembali.</p>
              <ul class="chips"><li>Mudah didapat</li><li>Cepat dipasang</li><li>Dapat diangkat kembali</li></ul>
            </div>
            <div class="lore__panel" role="tabpanel" hidden>
              <h2>Serat yang diuji, magnet yang menghubungkan.</h2>
              <p>Serat sabut kelapa dipadukan dengan konektor magnet. Material seratlah yang diuji untuk menyerap minyak; magnet hanya berfungsi sebagai penghubung antarmodul, bukan sebagai penyerap.</p>
              <ul class="chips"><li>Serat sabut kelapa</li><li>Konektor magnet</li><li>Modular</li></ul>
            </div>
          </div>
          <figure class="lore__frame" data-reveal>
            <img class="lore__shot is-active" src="/images/oil-surface.webp" alt="Lapisan minyak terlihat di permukaan air" loading="lazy"/>
            <img class="lore__shot" src="/images/coir-detail.webp" alt="Serat sabut kelapa dan rumah konektor magnet pada ujung modul" loading="lazy"/>
          </figure>
        </div>
      </section>

      <!-- 3 · Kenali modul (roster) -->
      <section class="roster snap" id="about" data-roster>
        <div class="container">
          <div class="roster__head" data-reveal><p class="section-kicker">Kenali modul</p><h2>Meet the Modules</h2><p>Empat bagian yang membentuk BIO-SORB MagnetLink.</p></div>
          <div class="roster__body" data-reveal>
            <div class="roster__stage">
              <span class="roster__ghost" aria-hidden="true">BIO-SORB</span>
              <img class="roster__art is-active" src="/images/koko-mascot.webp" alt="Maskot Koko" loading="lazy"/>
              <img class="roster__art roster__art--wide" src="/images/coir-detail.webp" alt="Serat sabut kelapa dan rumah konektor magnet pada ujung modul" loading="lazy"/>
              <img class="roster__art roster__art--wide" src="/images/step-module.webp" alt="Serat sabut kelapa di dalam kantong mesh" loading="lazy"/>
              <img class="roster__art roster__art--wide" src="/images/step-link.webp" alt="Dua modul tersambung dengan konektor magnet" loading="lazy"/>
            </div>
            <div class="roster__panel">
              <div class="roster__info is-active"><span class="role-chip">Maskot</span><h3>Koko</h3><p>Koko adalah maskot proyek: wajah ramah untuk pesan sederhana tentang air yang lebih bersih.</p></div>
              <div class="roster__info" hidden><span class="role-chip">Material</span><h3>Serat sabut kelapa</h3><p>Material utama yang diuji sebagai penyerap minyak. Kinerjanya dinilai dari data pengujian.</p></div>
              <div class="roster__info" hidden><span class="role-chip">Wadah</span><h3>Kantong mesh</h3><p>Menjaga serat tetap terkumpul sehingga modul mudah dipasang dan diangkat kembali.</p></div>
              <div class="roster__info" hidden><span class="role-chip">Penghubung</span><h3>Konektor magnet</h3><p>Terpasang di dua sisi untuk menyambung modul. Magnet tidak menyerap minyak; ia hanya menghubungkan.</p></div>
              <div class="roster__thumbs" role="tablist" aria-label="Kenali modul">
                <button class="roster__thumb is-active" role="tab" aria-selected="true" data-roster-tab="0"><img src="/images/koko-mascot.webp" alt="" loading="lazy"/><span>Koko</span></button>
                <button class="roster__thumb" role="tab" aria-selected="false" data-roster-tab="1"><img src="/images/coir-detail.webp" alt="" loading="lazy"/><span>Serat sabut kelapa</span></button>
                <button class="roster__thumb" role="tab" aria-selected="false" data-roster-tab="2"><img src="/images/step-module.webp" alt="" loading="lazy"/><span>Kantong mesh</span></button>
                <button class="roster__thumb" role="tab" aria-selected="false" data-roster-tab="3"><img src="/images/step-link.webp" alt="" loading="lazy"/><span>Konektor magnet</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 · Cara kerja (slider) -->
      <section class="how snap" id="how" data-slider>
        <div class="container">
          <div class="how__head" data-reveal><p class="section-kicker section-kicker--light">Cara kerja</p><h2>How It Works</h2></div>
          <div class="slider" data-reveal>
            <div class="slider__viewport"><div class="slider__track">
              <article class="slide is-active"><span class="slide__no" aria-hidden="true">01</span><div class="slide__copy"><h3>Serat sabut kelapa dalam kantong mesh</h3><p>Serat sabut kelapa dimasukkan ke dalam kantong mesh agar bentuk modul terjaga.</p></div><div class="slide__img"><img src="/images/step-module.webp" alt="Serat sabut kelapa di dalam kantong mesh" loading="lazy"/></div></article>
              <article class="slide"><span class="slide__no" aria-hidden="true">02</span><div class="slide__copy"><h3>Modul disambungkan dengan konektor magnet</h3><p>Dua modul disambungkan lewat konektor magnet di sisi yang berhadapan.</p></div><div class="slide__img"><img src="/images/step-link.webp" alt="Dua modul tersambung dengan konektor magnet" loading="lazy"/></div></article>
              <article class="slide"><span class="slide__no" aria-hidden="true">03</span><div class="slide__copy"><h3>Uji dalam eksperimen terkontrol</h3><p>Modul diuji dalam eksperimen terkontrol, lalu hasilnya dicatat apa adanya di dashboard.</p></div><div class="slide__img"><img src="/images/step-test.webp" alt="Modul diuji di dalam wadah berisi air" loading="lazy"/></div></article>
            </div></div>
            <div class="slider__bar">
              <button class="slider__btn" data-slide-dir="-1" aria-label="Langkah sebelumnya">${icon('arrow',18)}</button>
              <div class="slider__dots" role="tablist" aria-label="Cara kerja"><button class="is-active" role="tab" aria-selected="true" data-slide-to="0" aria-label="Langkah 1"></button><button role="tab" aria-selected="false" data-slide-to="1" aria-label="Langkah 2"></button><button role="tab" aria-selected="false" data-slide-to="2" aria-label="Langkah 3"></button></div>
              <button class="slider__btn" data-slide-dir="1" aria-label="Langkah berikutnya">${icon('arrow',18)}</button>
            </div>
            <p class="how__note">Efektivitas produk belum disimpulkan dan akan dinilai dari data pengujian.</p>
          </div>
        </div>
      </section>

      <!-- 6 · Riset + CTA -->
      <section class="finale snap" id="research">
        <div class="container">
          <div class="preview-head" data-reveal>
            <div><p class="section-kicker">Research Preview</p><h2>Lihat prosesnya, bukan hanya tampilan produknya.</h2></div>
            <p>Dashboard menyimpan data eksperimen dan menampilkan hasil yang sudah dipublikasikan. Angka baru tampil setelah tim memasukkan pengukuran yang sebenarnya.</p>
          </div>
          <div class="preview"><div class="explore-grid" data-reveal>
            <a class="explore-card explore-card--fiber" href="/app#/experiments" data-route><span class="explore-card__icon">${icon('flask',22)}</span><span><strong>Catatan pengujian</strong><small>Sampel, tanggal, siklus, dan metode pengukuran.</small></span><span class="explore-card__go">${icon('arrow',16)}</span></a>
            <a class="explore-card explore-card--module" href="/app#/modules" data-route><span class="explore-card__icon">${icon('layers',22)}</span><span><strong>Rancangan MagnetLink</strong><small>Kode modul, variasi desain, jenis sambungan.</small></span><span class="explore-card__go">${icon('arrow',16)}</span></a>
            <a class="explore-card explore-card--chart" href="/app#/analysis" data-route><span class="explore-card__icon">${icon('chart',22)}</span><span><strong>Analisis hasil</strong><small>Perbandingan dari pengukuran yang valid.</small></span><span class="explore-card__go">${icon('arrow',16)}</span></a>
          </div></div>
          <div class="cta-card" data-reveal>
            <div class="cta-card__copy">
              <h2>Explore the Science Behind BIO-SORB.</h2>
              <p>Lihat data, grafik, dan hasil penelitian secara langsung melalui platform kami.</p>
              <a href="/app#/dashboard" data-route data-tryme class="btn btn--cream">Try Me ${icon('arrow',16)}</a>
            </div>
            <figure class="cta-card__screen"><div class="laptop"><div class="laptop__lid"><img src="/images/dashboard-live.webp" width="2240" height="1400" alt="Pratinjau antarmuka dashboard BIO-SORB dalam keadaan awal tanpa data eksperimen" loading="lazy"/></div><div class="laptop__base"></div></div><figcaption>Pratinjau antarmuka · belum menampilkan data penelitian</figcaption></figure>
          </div>
        </div>
      </section>
    </main>
    <footer class="footer"><div class="container footer-grid"><div class="footer-brand"><img src="/logo-mark.svg" alt=""/><span><strong>BIO-SORB MagnetLink</strong><small>HYDROFEST 2026 · WATER INNOVATION</small></span></div><p class="footer-note">Prototipe penelitian penyerap minyak berbahan serat sabut kelapa. Seluruh klaim performa mengikuti hasil pengujian yang tersedia.</p><nav class="footer-links"><a href="#about">About</a><a href="#how">How It Works</a><a href="/app#/dashboard" data-route>Dashboard ↗</a></nav></div></footer>
  </div>`;
}

const navItems = [
  ['dashboard','Dashboard','home'], ['experiments','Eksperimen','flask'], ['modules','Modul','layers'], ['analysis','Analisis','chart'], ['reports','Laporan','file'], ['about','Tentang BIO-SORB','leaf']
];
function appShell(view, content) {
  const title = navItems.find(item => item[0] === view)?.[1] || 'Dashboard';
  return `<div class="app-shell">
    <aside class="app-sidebar" id="appSidebar"><a class="brand" href="/" data-route><img src="/logo-mark.svg" alt=""/><span class="brand-text"><strong>BIO-SORB</strong><small>MAGNETLINK</small></span></a>
      <p class="sidebar-label">Ruang penelitian</p><nav class="sidebar-nav">${navItems.map(([key,label,ico]) => `<a class="side-link ${view===key?'active':''}" href="/app#/${key}" data-route>${icon(ico)}<span>${label}</span></a>`).join('')}</nav>
      <div class="sidebar-bottom"><strong>Riset untuk lingkungan</strong><small>Catat hasil secara jujur, bandingkan setiap rancangan, dan kembangkan berdasarkan bukti.</small></div>
    </aside>
    <main class="app-main"><header class="app-topbar"><div style="display:flex;align-items:center"><button class="mobile-sidebar-toggle" id="sidebarToggle" aria-label="Buka menu">${icon('menu',17)}</button><div class="breadcrumb"><small>BIO-SORB / MAGNETLINK</small><strong>${title}</strong></div></div><div class="top-actions">${langSwitch()}<a class="back-home" href="/" data-route>${icon('home',16)}<span>Back to Home</span></a><span class="public-pill"><i></i>${session?.user ? 'Mode tim' : 'Mode publik'}</span>${session?.user ? `<button class="btn btn--outline btn--small" id="logoutBtn">Keluar ${icon('logout',14)}</button>` : `<a class="btn btn--small" href="/login" data-route>Masuk tim ${icon('lock',14)}</a>`}<div class="avatar">${session?.user ? esc((session.user.email||'T').slice(0,1).toUpperCase()) : 'B'}</div></div></header>
      <div class="app-content">${content}</div></main></div>`;
}
function statCard(label, value, hint, ico) {
  return `<article class="stat-card"><span class="stat-icon"><img src="/images/${({layers:'icon-cube',flask:'icon-flask',droplet:'icon-chart',repeat:'icon-recycle'})[ico]||'icon-cube'}.webp" alt="" width="58" height="58"/></span><div class="stat-body"><span class="stat-label">${label}</span><div class="stat-value">${value}</div><div class="stat-hint">${hint}</div></div></article>`;
}
function dashboardView() {
  const { modules, experiments, records } = cache;
  const avg = averageCapacity(records);
  const valid = records.filter(r => r.oil_retained_g !== null && Number(r.dry_mass_g)>0);
  const cycles = new Set(records.map(r => `${r.module_id}:${r.cycle_number}`)).size;
  const latest = records.slice(0,5);
  const bars = modules.slice(0,5).map(module => {
    const list = valid.filter(r => r.module_id === module.id);
    const value = list.length ? list.reduce((s,r)=>s+Number(r.oil_retained_g)/Number(r.dry_mass_g),0)/list.length : null;
    return { name: module.module_code, value };
  }).filter(x=>x.value !== null);
  const max = Math.max(1,...bars.map(x=>x.value));
  return `<section class="dashboard-hero"><div class="dashboard-hero__copy"><p class="section-kicker">Ruang penelitian BIO-SORB</p><h1>Halo, Peneliti!</h1><p>Selamat datang di BIO-SORB MagnetLink. Pantau modul, catat eksperimen, dan tinjau hasil pengujian dari satu tempat.</p><div class="dashboard-hero__actions">${session?.user ? `<a class="btn btn--small" href="/app#/experiments" data-route>${icon('plus',14)} Input eksperimen</a>` : `<span class="pill">${icon('info',13)} Mode publik · baca saja</span>`}<span class="dashboard-hero__meta">Data ditampilkan sesuai status publikasi.</span></div></div><div class="dashboard-hero__art"><img src="/images/coir-detail.webp" alt="Detail serat sabut kelapa dan konektor magnet pada modul" loading="lazy"/></div></section>
    <div class="stats-grid">${statCard('Total modul',modules.length,'Modul yang terdaftar','layers')}${statCard('Total eksperimen',experiments.length,'Kegiatan penelitian','flask')}${statCard('Rata-rata kapasitas',avg===null?'—':`${fmt(avg)} <small>g/g</small>`,valid.length?`${valid.length} pengukuran minyak valid`:'Belum ada pengukuran valid','droplet')}${statCard('Siklus tercatat',cycles,'Riwayat penggunaan modul','repeat')}</div>
    ${!configured ? `<div class="notice">Supabase belum dikonfigurasi. Website berjalan dalam mode pratinjau kosong. Isi file <b>.env</b> untuk menghubungkan database penelitian.</div>` : ''}
    <div class="app-grid"><section class="panel"><div class="panel-head"><div><h2>Perbandingan kapasitas penyerapan</h2><p>Rata-rata minyak tertahan per gram material, berdasarkan data valid.</p></div><span class="pill">${bars.length} modul</span></div>
      ${bars.length ? `<div class="chart-area">${bars.map(row=>`<div class="chart-col"><div class="bar-stack"><div class="bar" style="height:${Math.max(3,row.value/max*100)}%" title="${fmt(row.value)} g/g"></div></div><span class="bar-label">${esc(row.name)}</span><span class="bar-label">${fmt(row.value)} g/g</span></div>`).join('')}</div><div class="chart-legend" style="margin-top:12px"><span><i class="legend-dot"></i>Kapasitas penyerapan minyak</span></div>` : `<div class="empty-state"><span class="empty-icon">${icon('chart',20)}</span><strong>Belum ada data untuk dibandingkan</strong><p>Grafik akan muncul setelah modul memiliki hasil pengujian dengan massa minyak yang terukur secara terpisah.</p></div>`}
    </section><section class="panel"><div class="panel-head"><div><h2>Aktivitas pengujian terbaru</h2><p>Lima catatan paling baru.</p></div><a class="text-link" href="/app#/experiments" data-route>Lihat semua ↗</a></div>
      ${latest.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Modul</th><th>Siklus</th><th>Kapasitas</th></tr></thead><tbody>${latest.map(row=>{const mod=modules.find(m=>m.id===row.module_id);const q=row.oil_retained_g!==null&&Number(row.dry_mass_g)>0?Number(row.oil_retained_g)/Number(row.dry_mass_g):null;return `<tr><td>${moneylessDate(row.test_date)}</td><td class="code">${esc(mod?.module_code||'—')}</td><td>${esc(row.cycle_number)}</td><td>${q===null?'—':`${fmt(q)} g/g`}</td></tr>`}).join('')}</tbody></table></div>`:`<div class="empty-state"><span class="empty-icon">${icon('flask',20)}</span><strong>Belum ada catatan pengujian</strong><p>Eksperimen yang sudah dipublikasikan akan muncul di bagian ini.</p></div>`}
    </section></div>
    <div class="app-grid"><section class="panel"><div class="panel-head"><div><h2>Modul terdaftar</h2><p>Identitas dan jenis sambungan.</p></div><a class="text-link" href="/app#/modules" data-route>Semua modul ↗</a></div>${modules.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode</th><th>Desain</th><th>Konektor</th></tr></thead><tbody>${modules.slice(0,5).map(m=>`<tr><td class="code">${esc(m.module_code)}</td><td>${esc(m.design_type)}</td><td>${esc(m.connector_type)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><span class="empty-icon">${icon('layers',20)}</span><strong>Belum ada modul</strong><p>Modul BIO-SORB akan tercatat di sini setelah didaftarkan oleh tim.</p></div>`}</section>
      <section class="panel" style="background:#e9f0e4"><div class="panel-head"><div><h2>Catatan metode</h2><p>Interpretasi data yang hati-hati.</p></div>${icon('info',18)}</div><p style="color:#607866;font-size:11px;line-height:1.8;margin:0">Nilai kapasitas minyak hanya dihitung ketika massa minyak dapat diukur terpisah. Kenaikan massa bantalan tidak otomatis sama dengan massa minyak karena air mungkin ikut tertahan.</p><a class="text-link" style="margin-top:15px" href="/app#/about" data-route>Pahami metode ${icon('arrow',13)}</a></section></div>`;
}
function experimentView() {
  const { experiments, modules, records } = cache;
  const form = session?.user ? `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h2>Tambah catatan pengujian</h2><p>Masukkan data hasil pengukuran yang benar-benar dilakukan.</p></div><span class="pill">Tim</span></div>
    <form id="recordForm"><div class="form-grid">
      <div class="field"><label for="experiment_id">Eksperimen</label><select class="field-select" id="experiment_id" name="experiment_id" required>${experiments.map(e=>`<option value="${esc(e.id)}">${esc(e.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="module_id">Modul</label><select class="field-select" id="module_id" name="module_id" required>${modules.map(m=>`<option value="${esc(m.id)}">${esc(m.module_code)} · ${esc(m.design_type)}</option>`).join('')}</select></div>
      <div class="field"><label for="test_date">Tanggal uji</label><input class="field-input" type="date" id="test_date" name="test_date" required value="${new Date().toISOString().slice(0,10)}"/></div>
      <div class="field"><label for="cycle_number">Siklus penggunaan</label><input class="field-input" type="number" min="1" step="1" id="cycle_number" name="cycle_number" required value="1"/></div>
      <div class="field"><label for="dry_mass_g">Massa kering material (g)</label><input class="field-input" type="number" min="0.001" step="0.001" id="dry_mass_g" name="dry_mass_g" required placeholder="Contoh: 5.000"/></div>
      <div class="field"><label for="oil_retained_g">Massa minyak tertahan (g)</label><input class="field-input" type="number" min="0" step="0.001" id="oil_retained_g" name="oil_retained_g" placeholder="Kosongkan jika belum terukur terpisah"/><small>Jangan isi dengan selisih massa total jika air masih ikut tertahan.</small></div>
      <div class="field"><label for="water_retained_g">Massa air ikut tertahan (g)</label><input class="field-input" type="number" min="0" step="0.001" id="water_retained_g" name="water_retained_g" placeholder="Opsional"/></div>
      <div class="field"><label for="measurement_method">Metode pengukuran</label><input class="field-input" id="measurement_method" name="measurement_method" required placeholder="Contoh: pemisahan dan penimbangan"/></div>
    </div><div class="form-actions"><button class="btn btn--small" type="submit">Simpan catatan ${icon('arrow',14)}</button></div></form>
    ${(!experiments.length||!modules.length)?`<p class="notice" style="margin-top:14px">Buat minimal satu eksperimen dan satu modul sebelum menambahkan catatan pengujian.</p>`:''}</section>` : `<div class="notice notice--green" style="margin-bottom:16px">Mode publik hanya dapat melihat catatan yang telah dipublikasikan. <a class="text-link" href="/login" data-route>Masuk sebagai tim ${icon('arrow',13)}</a> untuk mengelola eksperimen.</div>`;
  const experimentForm = session?.user ? `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h2>Buat kegiatan eksperimen</h2><p>Definisikan kegiatan sebelum memasukkan catatan pengujian.</p></div></div><form id="experimentForm"><div class="form-grid"><div class="field"><label>Judul eksperimen</label><input class="field-input" name="title" required placeholder="Contoh: Uji susunan serat kelapa"/></div><div class="field"><label>Deskripsi / tujuan</label><input class="field-input" name="description" placeholder="Variasi desain dan tujuan pengujian"/></div><div class="field"><label>Status publikasi</label><select class="field-select" name="is_published"><option value="false">Draft — hanya tim</option><option value="true">Publikasikan untuk pengunjung</option></select></div></div><div class="form-actions"><button class="btn btn--small" type="submit">Simpan eksperimen ${icon('arrow',14)}</button></div></form></section>` : '';
  const experimentList = `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h2>Daftar kegiatan</h2><p>${experiments.length} eksperimen terdaftar.</p></div></div>${experiments.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Judul eksperimen</th><th>Status</th><th>Dibuat</th></tr></thead><tbody>${experiments.map(e=>`<tr><td class="code">${esc(e.title)}</td><td><span class="pill ${e.is_published?'':'pill--draft'}">${e.is_published?'Publik':'Draft'}</span></td><td>${moneylessDate(String(e.created_at||'').slice(0,10))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><strong>Belum ada eksperimen</strong><p>Buat kegiatan eksperimen sebelum menambahkan catatan pengujian.</p></div>`}</section>`;
  return `<div class="app-welcome"><div><p class="section-kicker">Data primer</p><h1>Eksperimen & pengujian</h1><p>Kelola kegiatan dan catatan pengujian setiap modul BIO-SORB.</p></div></div>${experimentForm}${experimentList}${form}<section class="panel"><div class="panel-head"><div><h2>Daftar hasil pengujian</h2><p>${records.length} catatan yang dapat diakses.</p></div></div>${records.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Eksperimen</th><th>Modul</th><th>Siklus</th><th>Massa kering</th><th>Minyak tertahan</th><th>Kapasitas</th></tr></thead><tbody>${records.map(r=>{const m=modules.find(x=>x.id===r.module_id),e=experiments.find(x=>x.id===r.experiment_id);const q=r.oil_retained_g!==null?Number(r.oil_retained_g)/Number(r.dry_mass_g):null;return `<tr><td>${moneylessDate(r.test_date)}</td><td>${esc(e?.title||'—')}</td><td class="code">${esc(m?.module_code||'—')}</td><td>${r.cycle_number}</td><td>${fmt(r.dry_mass_g,3)} g</td><td>${r.oil_retained_g===null?'—':`${fmt(r.oil_retained_g,3)} g`}</td><td>${q===null?'—':`${fmt(q)} g/g`}</td></tr>`}).join('')}</tbody></table></div>`:`<div class="empty-state"><span class="empty-icon">${icon('database',20)}</span><strong>Belum ada data pengujian</strong><p>Catatan yang dipublikasikan akan tampil di sini. Tim dapat memasukkan data setelah login.</p></div>`}</section>`;
}
function modulesView() {
  const { modules } = cache;
  const form = session?.user ? `<section class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h2>Daftarkan modul</h2><p>Gunakan kode unik untuk setiap bantalan.</p></div></div><form id="moduleForm"><div class="form-grid"><div class="field"><label>Kode modul</label><input class="field-input" name="module_code" required placeholder="Contoh: BS-M01"/></div><div class="field"><label>Jenis desain</label><input class="field-input" name="design_type" required placeholder="Contoh: serat longgar"/></div><div class="field"><label>Jenis konektor</label><select class="field-select" name="connector_type"><option value="magnet">Magnet</option><option value="standard">Standar / tanpa magnet</option></select></div></div><div class="form-actions"><button class="btn btn--small" type="submit">Simpan modul ${icon('arrow',14)}</button></div></form></section>` : `<div class="notice notice--green" style="margin-bottom:16px">Daftar modul publik. Login tim diperlukan untuk menambahkan modul.</div>`;
  return `<div class="app-welcome"><div><p class="section-kicker">Inventaris produk</p><h1>Modul BIO-SORB</h1><p>Identitas modul, variasi desain, dan jenis konektor.</p></div></div>${form}<section class="panel"><div class="panel-head"><div><h2>Daftar modul</h2><p>${modules.length} modul terdaftar.</p></div></div>${modules.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Kode modul</th><th>Jenis desain</th><th>Konektor</th><th>Dibuat</th></tr></thead><tbody>${modules.map(m=>`<tr><td class="code">${esc(m.module_code)}</td><td>${esc(m.design_type)}</td><td><span class="pill">${esc(m.connector_type)}</span></td><td>${moneylessDate(String(m.created_at||'').slice(0,10))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state"><span class="empty-icon">${icon('layers',20)}</span><strong>Belum ada modul terdaftar</strong><p>Modul yang didaftarkan tim akan muncul di sini.</p></div>`}</section>`;
}
function analysisView() {
  const { modules, records } = cache;
  const items = modules.map(m=>{const valid=records.filter(r=>r.module_id===m.id&&r.oil_retained_g!==null&&Number(r.dry_mass_g)>0);const q=valid.length?valid.reduce((s,r)=>s+Number(r.oil_retained_g)/Number(r.dry_mass_g),0)/valid.length:null;return {name:m.module_code,value:q,n:valid.length};}).filter(x=>x.value!==null).sort((a,b)=>b.value-a.value);
  const max=Math.max(1,...items.map(x=>x.value));
  return `<div class="app-welcome"><div><p class="section-kicker">Analisis data</p><h1>Perbandingan kapasitas</h1><p>Hanya hasil yang memiliki massa minyak terukur terpisah yang dihitung.</p></div></div><section class="panel"><div class="panel-head"><div><h2>Kapasitas penyerapan minyak per modul</h2><p>Q = massa minyak tertahan / massa kering material (g/g).</p></div><span class="pill">${items.length} modul terukur</span></div>${items.length?`<div class="analysis-bars">${items.map(x=>`<div class="analysis-row"><strong>${esc(x.name)}</strong><div class="track"><span style="width:${x.value/max*100}%"></span></div><em>${fmt(x.value)} g/g</em></div>`).join('')}</div>`:`<div class="empty-state"><span class="empty-icon">${icon('chart',20)}</span><strong>Analisis belum tersedia</strong><p>Masukkan massa minyak yang benar-benar terukur, bukan sekadar perubahan massa total bantalan.</p></div>`}</section><section class="panel" style="margin-top:14px"><div class="panel-head"><div><h2>Prinsip membaca hasil</h2><p>Perbandingan yang dapat dipertanggungjawabkan.</p></div></div><div class="notice">Jika air ikut tertahan dan belum dipisahkan dari minyak, kapasitas penyerapan minyak tidak boleh dihitung dari kenaikan massa bantalan saja. Catat kondisi tersebut sebagai keterbatasan metode.</div></section>`;
}
function reportsView() {
  return `<div class="app-welcome"><div><p class="section-kicker">Dokumentasi</p><h1>Laporan penelitian</h1><p>Unduh data eksperimen yang sedang dapat diakses dalam format CSV.</p></div><button class="btn btn--small" id="exportCsv">Ekspor CSV ${icon('file',14)}</button></div><section class="panel"><div class="panel-head"><div><h2>Data untuk laporan</h2><p>${cache.records.length} catatan pengujian tersedia.</p></div></div><div class="notice">File CSV berisi data yang diizinkan oleh kebijakan akses Supabase. Pastikan metode pengukuran dan satuan dicantumkan dalam laporan akhir.</div></section>`;
}
function aboutView() {
  return `<div class="app-welcome"><div><p class="section-kicker">Tentang proyek</p><h1>BIO-SORB MagnetLink</h1><p>Rancangan penyerap minyak berbasis serat sabut kelapa dengan sambungan magnetik.</p></div></div><div class="innovation-grid"><div class="innovation-visual"><img src="/images/koko-mascot.webp" alt="Maskot Koko"/></div><div class="innovation-copy"><p class="section-kicker">Ringkasan konsep</p><h2>Produk fisik dan sistem pencatatan yang saling melengkapi.</h2><p>BIO-SORB dirancang sebagai bantalan modular berisi serat sabut kelapa di dalam kantong mesh. Konektor magnet pada kedua sisi berlawanan digunakan untuk menyambungkan beberapa modul.</p><ul class="feature-list"><li><span class="feature-index">1</span><span><strong>Material</strong><small>Serat sabut kelapa yang diuji sebagai bahan penyerap.</small></span></li><li><span class="feature-index">2</span><span><strong>Konektor</strong><small>Magnet terlindungi sebagai penghubung antarmodul.</small></span></li><li><span class="feature-index">3</span><span><strong>Website</strong><small>Pencatatan, pengelolaan, dan analisis hasil pengujian.</small></span></li></ul></div></div>`;
}
function loginPage() {
  return `<div class="login-wrap"><div class="login-art"><img src="/images/koko-mascot.webp" alt="Maskot Koko BIO-SORB"/></div><div class="login-panel"><div class="login-box"><div class="login-lang">${langSwitch()}</div><a class="brand" href="/" data-route><img src="/logo-mark.svg" alt=""/><span class="brand-text"><strong>BIO-SORB</strong><small>MAGNETLINK</small></span></a><p class="section-kicker" style="margin-top:30px">Akses anggota tim</p><h1>Selamat datang kembali.</h1><p>Masuk untuk mengelola modul dan catatan eksperimen BIO-SORB. Pengunjung tidak perlu masuk untuk melihat hasil yang telah dipublikasikan.</p>${!configured?`<div class="notice" style="margin-bottom:17px">Supabase belum dikonfigurasi. Isi file .env terlebih dahulu sebelum login.</div>`:''}<form id="loginForm"><div class="field"><label for="email">Email tim</label><input class="field-input" id="email" name="email" type="email" autocomplete="username" required placeholder="nama@tim-biosorb.id"/></div><div class="field"><label for="password">Kata sandi</label><input class="field-input" id="password" name="password" type="password" autocomplete="current-password" required placeholder="Masukkan kata sandi"/></div><button class="btn" type="submit" ${configured?'':'disabled'}>Masuk ke ruang riset ${icon('arrow',15)}</button></form><p class="login-alt">Belum punya akun? <a href="/register" data-route>Daftar</a></p><a class="login-back" href="/" data-route>← Kembali ke halaman utama</a></div></div></div>`;
}

function registerPage() {
  return `<div class="login-wrap"><div class="login-art"><img src="/images/koko-mascot.webp" alt="Maskot Koko BIO-SORB"/></div><div class="login-panel"><div class="login-box"><div class="login-lang">${langSwitch()}</div><a class="brand" href="/" data-route><img src="/logo-mark.svg" alt=""/><span class="brand-text"><strong>BIO-SORB</strong><small>MAGNETLINK</small></span></a><p class="section-kicker" style="margin-top:30px">Pendaftaran anggota tim</p><h1>Buat akun tim.</h1><p>Siapa pun boleh mendaftar. Akun baru langsung bisa menambah dan mengubah data penelitian.</p>${!configured?`<div class="notice" style="margin-bottom:17px">Supabase belum dikonfigurasi. Isi file .env terlebih dahulu sebelum mendaftar.</div>`:''}<form id="registerForm"><div class="field"><label for="reg-email">Email tim</label><input class="field-input" id="reg-email" name="email" type="email" autocomplete="username" required placeholder="nama@tim-biosorb.id"/></div><div class="field"><label for="reg-password">Kata sandi</label><input class="field-input" id="reg-password" name="password" type="password" autocomplete="new-password" minlength="8" required placeholder="Minimal 8 karakter"/></div><div class="field"><label for="reg-confirm">Ulangi kata sandi</label><input class="field-input" id="reg-confirm" name="confirm" type="password" autocomplete="new-password" minlength="8" required placeholder="Ketik ulang kata sandi"/></div><button class="btn" type="submit" ${configured?'':'disabled'}>Daftar sebagai anggota tim ${icon('arrow',15)}</button></form><p class="login-alt">Sudah punya akun? <a href="/login" data-route>Masuk</a></p><a class="login-back" href="/" data-route>← Kembali ke halaman utama</a></div></div></div>`;
}

async function render() {
  const pathname = location.pathname;
  applyDocumentLang();
  document.documentElement.classList.remove('snap-page');
  if (pathname === '/login') { root.innerHTML = loginPage(); localize(root); return; }
  if (pathname === '/register') { root.innerHTML = registerPage(); localize(root); return; }
  if (pathname.startsWith('/app')) {
    const view = (location.hash || '#/dashboard').replace(/^#\/?/, '') || 'dashboard';
    root.innerHTML = appShell(view, `<div class="empty-state"><strong>Memuat data…</strong></div>`);
    localize(root);
    try { await loadResearchData(); }
    catch (error) { showToast(error.message, true); }
    const content = ({ dashboard: dashboardView, experiments: experimentView, modules: modulesView, analysis: analysisView, reports: reportsView, about: aboutView }[view] || dashboardView)();
    root.innerHTML = appShell(view, demoBanner() + content);
    localize(root);
    return;
  }
  root.innerHTML = landingPage();
  localize(root);
  afterLanding();
}

let landingObserver;
const NAV_FOR = { home: 'home', problem: 'problem', about: 'about', how: 'how', research: 'research' };
function afterLanding() {
  document.documentElement.classList.add('snap-page');
  landingObserver?.disconnect();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!reduce && 'IntersectionObserver' in window) {
    landingObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); landingObserver.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => { el.classList.add('reveal'); landingObserver.observe(el); });
  }
  const secs = [...document.querySelectorAll('main > section[id]')];
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const dots = [...document.querySelectorAll('.dots__dot')];
  const bar = document.querySelector('.scroll-progress i');
  const header = document.querySelector('.site-header');
  const mark = () => {
    const y = scrollY + innerHeight * 0.4; let cur = secs[0];
    for (const sec of secs) if (sec.offsetTop <= y) cur = sec;
    const navId = NAV_FOR[cur.id];
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${navId}`));
    dots.forEach((d) => d.classList.toggle('is-active', d.dataset.dot === cur.id));
    document.documentElement.dataset.tone = cur.dataset.tone || '';
    header?.classList.toggle('is-scrolled', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    if (!reduce) document.documentElement.style.setProperty('--sy', String(Math.min(scrollY, 900)));
  };
  window.removeEventListener('scroll', window.__bioMark);
  window.__bioMark = mark; window.addEventListener('scroll', mark, { passive: true }); mark();
}

function pick(scope, selector, i, activeClass = 'is-active') {
  [...scope.querySelectorAll(selector)].forEach((el, k) => {
    const on = k === i;
    el.classList.toggle(activeClass, on);
    if (el.matches('[role="tab"]')) el.setAttribute('aria-selected', String(on));
    if (el.hasAttribute('hidden') || el.matches('.lore__panel, .roster__info')) el.hidden = !on;
  });
}
function setLore(i) {
  const sec = document.querySelector('[data-lore]'); if (!sec) return;
  ['.lore__tab', '.lore__panel', '.lore__bg', '.lore__shot'].forEach((q) => pick(sec, q, i));
}
function setRoster(i) {
  const sec = document.querySelector('[data-roster]'); if (!sec) return;
  ['.roster__thumb', '.roster__info', '.roster__art'].forEach((q) => pick(sec, q, i));
}
function setSlide(i) {
  const sec = document.querySelector('[data-slider]'); if (!sec) return;
  const n = sec.querySelectorAll('.slide').length;
  const k = ((i % n) + n) % n;
  sec.dataset.index = String(k);
  sec.querySelector('.slider__track').style.transform = `translateX(${-k * 100}%)`;
  pick(sec, '.slide', k); pick(sec, '.slider__dots button', k);
  sec.querySelectorAll('.slide').forEach((el, idx) => el.setAttribute('aria-hidden', String(idx !== k)));
}
let touchX = null;
root.addEventListener('touchstart', (e) => { touchX = e.target.closest('.slider__viewport') ? e.touches[0].clientX : null; }, { passive: true });
root.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  const cur = Number(document.querySelector('[data-slider]')?.dataset.index || 0);
  if (Math.abs(dx) > 40) setSlide(cur + (dx < 0 ? 1 : -1));
}, { passive: true });
root.addEventListener('keydown', (e) => {
  if (!e.target.closest('.slider')) return;
  const cur = Number(document.querySelector('[data-slider]')?.dataset.index || 0);
  if (e.key === 'ArrowRight') setSlide(cur + 1);
  if (e.key === 'ArrowLeft') setSlide(cur - 1);
});

root.addEventListener('click', async (event) => {
  const langBtn = event.target.closest('[data-lang]');
  if (langBtn) {
    const y = window.scrollY;
    setLang(langBtn.dataset.lang);
    await render();
    window.scrollTo({ top: y, behavior: 'auto' });
    return;
  }
  const loreTab = event.target.closest('[data-lore-tab]');
  if (loreTab) { setLore(Number(loreTab.dataset.loreTab)); return; }
  const rosterTab = event.target.closest('[data-roster-tab]');
  if (rosterTab) { setRoster(Number(rosterTab.dataset.rosterTab)); return; }
  const slideBtn = event.target.closest('[data-slide-dir], [data-slide-to]');
  if (slideBtn) {
    const cur = Number(document.querySelector('[data-slider]')?.dataset.index || 0);
    setSlide(slideBtn.dataset.slideTo !== undefined ? Number(slideBtn.dataset.slideTo) : cur + Number(slideBtn.dataset.slideDir));
    return;
  }
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && document.querySelector('.landing-page')) {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState({}, '', anchor.getAttribute('href'));
      document.querySelector('#siteNav')?.classList.remove('open');
      return;
    }
  }
  const route = event.target.closest('[data-route]');
  if (route) {
    event.preventDefault();
    routeTo(route.getAttribute('href'));
    return;
  }
  if (event.target.closest('#navToggle')) { const o = document.querySelector('#siteNav')?.classList.toggle('open'); document.querySelector('#navToggle')?.setAttribute('aria-expanded', String(!!o)); }
  if (event.target.closest('#siteNav a[href^="#"]')) document.querySelector('#siteNav')?.classList.remove('open');
  if (event.target.closest('#sidebarToggle')) document.querySelector('#appSidebar')?.classList.toggle('open');
  if (event.target.closest('#logoutBtn')) await logout();
  if (event.target.closest('#exportCsv')) exportRecords();
  if (event.target.closest('#demoToggle')) { setDemoOff(demoActive); await render(); }
});
root.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const submit = form.querySelector('[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    if (form.id === 'loginForm') {
      const fd = new FormData(form);
      await login(String(fd.get('email')).trim(), String(fd.get('password')));
      showToast('Berhasil masuk sebagai anggota tim.');
      routeTo('/app#/dashboard');
    }
    if (form.id === 'registerForm') {
      const fd = new FormData(form);
      const password = String(fd.get('password'));
      if (password.length < 8) throw new Error('Kata sandi minimal 8 karakter.');
      if (password !== String(fd.get('confirm'))) throw new Error('Kata sandi dan pengulangannya tidak sama.');
      await registerAccount(String(fd.get('email')).trim(), password);
      showToast('Pendaftaran berhasil. Selamat datang di tim BIO-SORB.');
      routeTo('/app#/dashboard');
    }
    if (form.id === 'experimentForm') {
      const fd = new FormData(form);
      await api('experiments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ title: String(fd.get('title')).trim(), description: String(fd.get('description') || '').trim() || null, is_published: fd.get('is_published') === 'true' }) });
      showToast('Eksperimen berhasil disimpan.');
      await render();
    }
    if (form.id === 'moduleForm') {
      const fd = new FormData(form);
      await api('modules', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ module_code: String(fd.get('module_code')).trim(), design_type: String(fd.get('design_type')).trim(), connector_type: fd.get('connector_type') }) });
      showToast('Modul berhasil disimpan.');
      await render();
    }
    if (form.id === 'recordForm') {
      if (demoActive) throw new Error('Sembunyikan data contoh dan daftarkan modul serta eksperimen asli terlebih dahulu.');
      if (!cache.experiments.length || !cache.modules.length) throw new Error('Daftarkan satu eksperimen dan satu modul terlebih dahulu.');
      const fd = new FormData(form);
      const rawOil = String(fd.get('oil_retained_g') || '').trim();
      const rawWater = String(fd.get('water_retained_g') || '').trim();
      const record = {
        experiment_id: fd.get('experiment_id'), module_id: fd.get('module_id'), test_date: fd.get('test_date'),
        cycle_number: Number(fd.get('cycle_number')), dry_mass_g: Number(fd.get('dry_mass_g')),
        oil_retained_g: rawOil === '' ? null : Number(rawOil), water_retained_g: rawWater === '' ? null : Number(rawWater),
        measurement_method: String(fd.get('measurement_method')).trim(), is_published: false
      };
      if (!(record.dry_mass_g > 0) || !(record.cycle_number > 0)) throw new Error('Massa kering dan nomor siklus harus lebih besar dari nol.');
      if ((record.oil_retained_g !== null && record.oil_retained_g < 0) || (record.water_retained_g !== null && record.water_retained_g < 0)) throw new Error('Massa tidak boleh bernilai negatif.');
      await api('test_records', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record) });
      showToast('Catatan pengujian berhasil disimpan sebagai draft.');
      await render();
    }
  } catch (error) { showToast(error.message || 'Terjadi kesalahan.', true); if (submit) submit.disabled = false; }
});
function exportRecords() {
  const fields = ['test_date','module_id','cycle_number','dry_mass_g','oil_retained_g','water_retained_g','measurement_method'];
  const rows = [fields.join(','), ...cache.records.map(row => fields.map(key => JSON.stringify(row[key] ?? '')).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bio-sorb-data-pengujian.csv'; anchor.click(); URL.revokeObjectURL(url);
}
window.addEventListener('popstate', render);
window.addEventListener('hashchange', () => { if (location.pathname.startsWith('/app')) render(); });
render();
