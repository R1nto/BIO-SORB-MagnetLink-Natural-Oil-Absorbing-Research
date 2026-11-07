import { icon } from '../../assets/icons/icons.js';
import { esc } from '../utils/formatters.js';

/** Bilah atas untuk tablet/ponsel: tombol menu + judul halaman. Disembunyikan di desktop lewat CSS. */
export function renderTopbar(title) {
  return `
    <button type="button" class="icon-btn" data-nav-toggle aria-label="Buka menu navigasi" aria-expanded="false" aria-controls="sidebar">${icon('menu', 24)}</button>
    <div class="topbar__title">${esc(title)}</div>`;
}

/** Judul halaman + deskripsi + aksi utama. `actionsHtml` harus HTML aman. */
export function pageHeader({ title, subtitle = '', actionsHtml = '' }) {
  return `
    <header class="page-head">
      <div class="page-head__text">
        <h1>${esc(title)}</h1>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
      </div>
      ${actionsHtml ? `<div class="page-head__actions">${actionsHtml}</div>` : ''}
    </header>`;
}
