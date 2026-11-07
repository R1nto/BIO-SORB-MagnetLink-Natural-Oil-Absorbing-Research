// Router tingkat atas: / (landing), /app (dashboard riset), /login.
// Sub-halaman dashboard tetap memakai hash (/app#/experiments) agar refresh & deep link aman di Vercel.
// Perpindahan antar tiga tampilan ini dilakukan tanpa memuat ulang halaman, dengan transisi fade ringan.

const VIEWS = {
  '/': () => import('./landing/landing.js'),
  '/app': () => import('./views/app-view.js'),
  '/login': () => import('./views/login-view.js'),
};

let mountEl = null;
let current = { path: null, cleanup: null };
let token = 0;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalisasi pathname ke salah satu kunci VIEWS. Path tidak dikenal -> '/'. */
export function normalizePath(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/app' || p.startsWith('/app/')) return '/app';
  if (p === '/login') return '/login';
  return '/';
}

async function show(path, { first = false } = {}) {
  const my = ++token;
  if (!first && !reduceMotion()) {
    mountEl.classList.add('is-leaving');
    await wait(160);
    if (my !== token) return;
  }
  current.cleanup?.();
  current = { path, cleanup: null };
  mountEl.classList.remove('is-leaving');
  mountEl.replaceChildren();
  document.body.dataset.view = path === '/' ? 'landing' : path.slice(1);
  window.scrollTo(0, 0);

  try {
    const mod = await VIEWS[path]();
    if (my !== token) return;
    const cleanup = await mod.mount(mountEl);
    if (my !== token) return cleanup?.();
    current.cleanup = cleanup ?? null;
    mountEl.classList.add('is-entering');
    setTimeout(() => mountEl.classList.remove('is-entering'), 400);
    if (path === '/' && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch (err) {
    console.error(err);
    if (my === token) {
      mountEl.innerHTML = `<div style="padding:2rem;font-family:system-ui,sans-serif;max-width:560px;margin:auto">
        <h1 style="font-size:1.25rem">Halaman gagal dimuat</h1>
        <p>Periksa koneksi internet lalu muat ulang halaman.</p>
        <p><a href="/">Ke beranda</a></p></div>`;
    }
  }
}

/** Pindah ke URL internal (mis. '/app#/records', '/login?next=…'). */
export function navigateTo(url, { replace = false } = {}) {
  const target = new URL(url, location.origin);
  const path = normalizePath(target.pathname);
  const href = target.pathname + target.search + target.hash;
  if (path === current.path && target.pathname === location.pathname) {
    // Tampilan sama: cukup ubah hash/query (dashboard mendengarkan hashchange).
    if (replace) history.replaceState(null, '', href);
    else if (href !== location.pathname + location.search + location.hash) history.pushState(null, '', href);
    if (path === '/') document.getElementById(target.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else if (path === '/app') window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  history[replace ? 'replaceState' : 'pushState'](null, '', href);
  show(path);
}

function onClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const path = normalizePath(url.pathname);
  const samePage = url.pathname === location.pathname;
  // Tautan hash di halaman yang sama (#about, #/experiments) ditangani browser / hashchange.
  if (samePage && !a.hasAttribute('data-link')) return;
  if (!['/', '/app', '/login'].includes(url.pathname.replace(/\/+$/, '') || '/') && path === '/') {
    if (!a.hasAttribute('data-link')) return; // berkas statis, dll.
  }
  e.preventDefault();
  navigateTo(url.pathname + url.search + url.hash);
}

export function startRouter(el) {
  mountEl = el;
  // Tautan konfirmasi email Supabase mendarat dengan #access_token=… / #error=…; arahkan ke halaman masuk.
  if (/^#(access_token|error|type)=/.test(location.hash)) {
    history.replaceState(null, '', '/login?confirmed=1');
  } else {
    const norm = normalizePath(location.pathname);
    if (norm !== location.pathname && !(norm === '/app' && location.pathname.startsWith('/app/'))) {
      history.replaceState(null, '', norm + location.search + location.hash);
    }
  }
  document.addEventListener('click', onClick);
  window.addEventListener('popstate', () => {
    const path = normalizePath(location.pathname);
    if (path !== current.path) show(path);
    else if (path === '/' && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  });
  return show(normalizePath(location.pathname), { first: true });
}
