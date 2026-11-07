// Kerangka dashboard riset di /app: router sub-halaman berbasis hash (/app#/halaman), sidebar, bilah atas, penjaga akses.
// Hash dipilih untuk sub-halaman agar refresh/deep link selalu bekerja di Vercel tanpa konfigurasi server tambahan.
// Perpindahan antara / , /app, dan /login ditangani oleh router.js.

import { isConfigured, hasSecretKey } from './config/supabase.js';

import { authState, initAuth, onAuthChange, signOut } from './services/auth.service.js';
import { renderSidebar, NAV_ITEMS } from './components/sidebar.js';
import { renderTopbar } from './components/navbar.js';
import { errorState, loadingState } from './components/states.js';
import { toast } from './components/toast.js';
import { esc } from './utils/formatters.js';
import { SITE } from './config/site.js';
import { navigateTo } from './router.js';

// team: true -> hanya anggota tim. Halaman lain bersifat publik (data tetap disaring RLS).
const ROUTES = {
  dashboard: { title: 'Dashboard', load: () => import('./pages/dashboard.js') },
  experiments: { title: 'Eksperimen', load: () => import('./pages/experiments.js') },
  records: { title: 'Input Data', team: true, load: () => import('./pages/records.js') },
  analysis: { title: 'Analisis', load: () => import('./pages/analysis.js') },
  modules: { title: 'Modul', load: () => import('./pages/modules.js') },
  reports: { title: 'Laporan', load: () => import('./pages/report.js') },
  about: { title: 'Tentang', load: () => import('./pages/about.js') },
  register: { title: 'Daftar', load: () => import('./pages/register.js') },
  activate: { title: 'Aktifkan akun tim', load: () => import('./pages/activate.js') },
};

let els = {};
let cleanup = null;
let renderToken = 0;

export function parseHash(hash = location.hash) {
  const [pathPart, queryPart = ''] = hash.replace(/^#\/?/, '').split('?');
  const [name = '', param = ''] = pathPart.split('/');
  return { name: name || 'dashboard', param: decodeURIComponent(param), query: new URLSearchParams(queryPart) };
}

export function navigate(path) {
  // /login adalah halaman tersendiri; sub-halaman dashboard memakai hash.
  if (path.startsWith('/login')) return navigateTo(path);
  if (location.hash === `#${path}`) renderRoute();
  else location.hash = path;
}

function setNavOpen(open) {
  document.body.classList.toggle('nav-open', open);
  els.toggle?.setAttribute('aria-expanded', String(open));
  els.toggle?.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
}

function updateChrome(route) {
  const active = NAV_ITEMS.some((i) => i.name === route.name) ? route.name : '';
  els.sidebar.innerHTML = renderSidebar({ active, auth: authState });
  const title = ROUTES[route.name]?.title ?? 'Halaman tidak ditemukan';
  els.topbar.innerHTML = renderTopbar(title);
  els.toggle = els.topbar.querySelector('[data-nav-toggle]');
  document.title = `${title} · ${SITE.name}`;
}

function setupNotConfigured() {
  els.view.innerHTML = `
    <div class="auth-wrap" style="max-width:640px">
      <div class="card">
        <h1>Supabase belum dikonfigurasi</h1>
        <div class="callout ${hasSecretKey ? 'callout--danger' : 'callout--warn'}">
          ${
            hasSecretKey
              ? '<strong>Key rahasia terdeteksi di frontend.</strong>Hentikan: key <code>service_role</code> / <code>sb_secret_…</code> tidak boleh dipakai di browser. Ganti dengan publishable key.'
              : '<strong>Environment variable belum diisi.</strong>Aplikasi tidak menampilkan data apa pun sampai terhubung ke database.'
          }
        </div>
        <ol class="plain-list">
          <li>Salin <code>.env.example</code> menjadi <code>.env</code>.</li>
          <li>Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> dari Supabase (Project Settings → API Keys).</li>
          <li>Jalankan ulang <code>npm run dev</code>. Di Vercel, isi dua variabel yang sama lalu deploy ulang.</li>
        </ol>
      </div>
    </div>`;
}

async function renderRoute() {
  const route = parseHash();
  const def = ROUTES[route.name];
  const token = ++renderToken;
  cleanup?.();
  cleanup = null;
  setNavOpen(false);

  updateChrome(route);

  if (!def) {
    els.view.innerHTML = `<div class="card"><h1>Halaman tidak ditemukan</h1>
      <p class="muted">Alamat <code>${esc(location.hash)}</code> tidak dikenal.</p>
      <p><a class="btn btn--primary" href="#/dashboard">Kembali ke Dashboard</a></p></div>`;
    return;
  }
  if (!isConfigured) return setupNotConfigured();

  if (!authState.ready) {
    els.view.innerHTML = loadingState();
    return;
  }

  // Penjaga akses (UX saja; penegakan sebenarnya oleh RLS di database).
  if (def.team && !authState.isTeam) {
    if (!authState.session) return navigate(`/login?next=${encodeURIComponent(location.hash.slice(1))}`);
    els.view.innerHTML = `<div class="auth-wrap"><div class="card">
      <h1>Akses khusus anggota tim</h1>
      <div class="callout callout--warn"><strong>Halaman ini untuk anggota tim peneliti.</strong>
      Jika Anda anggota tim, aktifkan akun dengan kode undangan. Jika bukan, Anda tetap bisa melihat hasil penelitian yang dipublikasikan.</div>
      <div class="state__actions"><a class="btn btn--primary" href="#/activate">Aktifkan akun tim</a><a class="btn" href="#/dashboard">Kembali ke Dashboard</a></div></div></div>`;
    return;
  }

  // Setiap render mendapat wadahnya sendiri, sehingga halaman lama yang selesai terlambat tidak menimpa halaman baru.
  const root = document.createElement('div');
  els.view.replaceChildren(root);
  root.innerHTML = loadingState();
  els.view.focus({ preventScroll: true });
  window.scrollTo(0, 0);

  try {
    const mod = await def.load();
    const result = await mod.render(root, { auth: authState, navigate, route, query: route.query });
    if (token !== renderToken) result?.();
    else cleanup = result ?? null;
  } catch (err) {
    console.error(err);
    if (token === renderToken) {
      root.innerHTML = errorState('Halaman gagal dimuat. Periksa koneksi internet lalu coba lagi.');
      root.querySelector('[data-retry]')?.addEventListener('click', renderRoute);
    }
  }
}

export async function startApp(mount) {
  let alive = true;
  mount.innerHTML = `
    <a class="skip-link" href="#main-content">Lewati ke konten utama</a>
    <div class="app-shell">
      <aside class="sidebar" id="sidebar" aria-label="Menu"></aside>
      <div class="scrim" data-scrim></div>
      <div class="main">
        <div class="topbar"></div>
        <main class="main__inner" id="main-content" tabindex="-1"></main>
        <footer class="footer">${esc(SITE.name)} · alat pendukung penelitian ${esc(SITE.event)}. Angka yang tampil berasal dari data yang tercatat, bukan klaim efektivitas produk.</footer>
      </div>
    </div>`;
  els = {
    sidebar: mount.querySelector('.sidebar'),
    topbar: mount.querySelector('.topbar'),
    view: mount.querySelector('#main-content'),
  };

  const onClick = (e) => {
    if (e.target.closest('[data-nav-toggle]')) setNavOpen(!document.body.classList.contains('nav-open'));
    else if (e.target.closest('[data-scrim]') || e.target.closest('.nav__link')) setNavOpen(false);
    else if (e.target.closest('[data-logout]')) {
      signOut()
        .then(() => {
          toast.success('Anda sudah keluar.');
          navigate('/dashboard');
        })
        .catch(() => toast.error('Gagal keluar. Coba lagi.'));
    }
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setNavOpen(false);
      els.toggle?.focus();
    }
  };
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', renderRoute);

  els.view.innerHTML = loadingState();
  updateChrome(parseHash());
  await initAuth();
  if (!alive) return null;

  // Saat status login berubah (masuk/keluar/refresh token), gambar ulang halaman agar tombol & data sesuai hak akses.
  let lastKey = `${authState.user?.id ?? ''}:${authState.isTeam}`;
  const offAuth = onAuthChange(() => {
    const key = `${authState.user?.id ?? ''}:${authState.isTeam}`;
    if (key === lastKey) return;
    lastKey = key;
    renderRoute();
  });

  renderRoute();

  return () => {
    alive = false;
    renderToken++;
    offAuth();
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('hashchange', renderRoute);
    cleanup?.();
    cleanup = null;
    document.body.classList.remove('nav-open');
  };
}
