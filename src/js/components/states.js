import { esc } from '../utils/formatters.js';

/** Kerangka pemuatan. Dipakai untuk pemuatan data halaman (biasanya > 1 detik di jaringan lambat). */
export function loadingState(label = 'Memuat data…') {
  return `
    <div role="status" aria-live="polite" class="stack">
      <span class="sr-only">${esc(label)}</span>
      <div class="grid-stats">
        <div class="skeleton skeleton--stat"></div><div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div><div class="skeleton skeleton--stat"></div>
      </div>
      <div class="skeleton skeleton--block"></div>
    </div>`;
}

export function loadingBlock(label = 'Memuat…') {
  return `<div role="status" aria-live="polite"><span class="sr-only">${esc(label)}</span><div class="skeleton skeleton--block"></div></div>`;
}

/** Keadaan kosong: jelaskan apa yang kosong, mengapa, dan langkah berikutnya. */
export function emptyState({ title, text, actionsHtml = '', center = false }) {
  return `
    <div class="state ${center ? 'state--center' : ''}">
      <h3>${esc(title)}</h3>
      ${text ? `<p>${text}</p>` : ''}
      ${actionsHtml ? `<div class="state__actions">${actionsHtml}</div>` : ''}
    </div>`;
}

export function errorState(message, { retry = true } = {}) {
  return `
    <div class="card" role="alert">
      <div class="callout callout--danger"><strong>Data belum bisa dimuat</strong>${esc(message)}</div>
      ${retry ? '<div class="state__actions" style="margin-top:16px"><button type="button" class="btn" data-retry>Coba lagi</button></div>' : ''}
    </div>`;
}
