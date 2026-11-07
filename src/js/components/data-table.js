import { esc } from '../utils/formatters.js';

/**
 * Tabel data.
 * columns: [{ label, render(row) -> html, num?: boolean, className?: string }]
 * `render` harus menghasilkan HTML aman (gunakan esc() untuk teks dari pengguna).
 */
export function dataTable({ columns, rows, caption = '', emptyHtml = '' }) {
  if (!rows.length) return emptyHtml;
  const head = columns
    .map((c) => `<th scope="col" class="${c.num ? 'num' : ''}">${c.srOnly ? `<span class="sr-only">${esc(c.label)}</span>` : esc(c.label)}</th>`)
    .join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td class="${[c.num ? 'num' : '', c.className ?? ''].join(' ').trim()}">${c.render(row)}</td>`)
          .join('')}</tr>`,
    )
    .join('');
  return `
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption || 'Tabel data')}">
      <table class="table">
        ${caption ? `<caption class="sr-only">${esc(caption)}</caption>` : ''}
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}
