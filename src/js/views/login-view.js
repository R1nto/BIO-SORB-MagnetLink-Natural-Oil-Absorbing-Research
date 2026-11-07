// Halaman /login berdiri sendiri (tanpa sidebar dashboard).
import { initAuth, authState, onAuthChange } from '../services/auth.service.js';
import { isConfigured } from '../config/supabase.js';
import { navigateTo } from '../router.js';
import { render as renderLogin } from '../pages/login.js';
import { SITE } from '../config/site.js';
import { esc } from '../utils/formatters.js';

export async function mount(el) {
  document.title = `Masuk · ${SITE.name}`;
  el.innerHTML = `
    <div class="auth-page">
      <header class="auth-page__top">
        <a class="auth-page__brand" href="/" data-link aria-label="${esc(SITE.name)}, kembali ke beranda">
          <img src="/favicon.svg" alt="" width="32" height="32" /><strong>${esc(SITE.name)}</strong>
        </a>
        <a class="btn btn--sm" href="/" data-link>← Back to Home</a>
      </header>
      <main class="auth-page__main" id="main-content" tabindex="-1"><div data-login-root></div></main>
    </div>`;
  const root = el.querySelector('[data-login-root]');
  const query = new URLSearchParams(location.search);
  const go = (path) => navigateTo(`/app#${path}`);

  if (!isConfigured) {
    root.innerHTML = `<div class="auth-wrap"><div class="card"><h1>Supabase belum dikonfigurasi</h1>
      <p class="muted">Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>, lalu jalankan ulang.</p>
      <a class="btn" href="/app" data-link>Buka dashboard</a></div></div>`;
    return;
  }

  let alive = true;
  await initAuth();
  if (!alive) return;
  const draw = () => alive && renderLogin(root, { auth: authState, navigate: go, query });
  draw();
  let lastKey = `${authState.user?.id ?? ''}:${authState.isTeam}`;
  const off = onAuthChange(() => {
    const key = `${authState.user?.id ?? ''}:${authState.isTeam}`;
    if (key !== lastKey) {
      lastKey = key;
      draw();
    }
  });
  return () => {
    alive = false;
    off();
  };
}
