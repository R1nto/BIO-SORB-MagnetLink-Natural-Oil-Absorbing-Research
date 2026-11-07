import { icon } from '../../assets/icons/icons.js';
import { esc } from '../utils/formatters.js';

export const NAV_ITEMS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'main' },
  { name: 'experiments', label: 'Eksperimen', icon: 'flask', group: 'main' },
  { name: 'records', label: 'Input Data', icon: 'records', group: 'main', team: true },
  { name: 'analysis', label: 'Analisis', icon: 'chart', group: 'main' },
  { name: 'modules', label: 'Modul', icon: 'modules', group: 'main' },
  { name: 'reports', label: 'Laporan', icon: 'report', group: 'main' },
  { name: 'about', label: 'Tentang', icon: 'info', group: 'info' },
];

/** Isi sidebar. `active` = nama rute aktif. Item khusus tim hanya muncul setelah login sebagai anggota tim. */
export function renderSidebar({ active, auth }) {
  const link = (item) => `
    <a class="nav__link" href="#/${item.name}" ${item.name === active ? 'aria-current="page"' : ''}>
      ${icon(item.icon)}<span>${esc(item.label)}</span>
    </a>`;

  const items = NAV_ITEMS.filter((i) => !i.team || auth.isTeam);
  const account = auth.session
    ? `<div class="account">
         <div class="account__who">${icon('user', 18)}<span title="${esc(auth.user?.email ?? '')}">${esc(auth.user?.email ?? '')}</span></div>
         <div>${auth.isTeam ? '<span class="badge badge--public">Anggota tim</span>' : '<span class="badge badge--info">Pengguna</span>'}</div>
         ${auth.isTeam ? '' : `<a class="btn btn--sm" href="#/activate">${icon('lock', 16)}Aktifkan akun tim</a>`}
         <button type="button" class="btn btn--sm" data-logout>${icon('logout', 16)}Keluar</button>
       </div>`
    : `<div class="account"><a class="btn btn--sm btn--primary" href="/login" data-link>${icon('login', 16)}Masuk</a><a class="btn btn--sm" href="#/register">Daftar</a></div>`;

  return `
    <a class="sidebar__brand" href="#/dashboard" aria-label="BIO-SORB MagnetLink, ke Dashboard">
      <img src="/favicon.svg" alt="" width="36" height="36" />
      <div><strong>BIO-SORB</strong><span>MagnetLink</span></div>
    </a>
    <nav class="nav" aria-label="Navigasi utama">
      ${items.filter((i) => i.group === 'main').map(link).join('')}
      <div class="nav__label">Informasi</div>
      ${items.filter((i) => i.group === 'info').map(link).join('')}
    </nav>
    <div class="sidebar__foot"><a class="btn btn--sm" href="/" data-link>← Back to Home</a>${account}</div>`;
}
