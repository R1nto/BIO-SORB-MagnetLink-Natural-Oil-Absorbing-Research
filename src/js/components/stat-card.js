import { icon } from '../../assets/icons/icons.js';
import { esc } from '../utils/formatters.js';

/** Kartu statistik. `value` null -> tampil "—" dengan petunjuk mengapa kosong. */
export function statCard({ label, value, unit = '', hint = '', iconName = 'chart' }) {
  const empty = value === null || value === undefined || value === '—';
  return `
    <div class="stat">
      <div class="stat__label">${icon(iconName, 18)}<span>${esc(label)}</span></div>
      <div class="stat__value ${empty ? 'stat__value--empty' : ''}">${empty ? '—' : esc(value)}${
        !empty && unit ? ` <small>${esc(unit)}</small>` : ''
      }</div>
      ${hint ? `<div class="stat__hint">${esc(hint)}</div>` : ''}
    </div>`;
}
