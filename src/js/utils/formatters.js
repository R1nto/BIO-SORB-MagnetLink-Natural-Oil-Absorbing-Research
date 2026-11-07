// Fungsi format tampilan. Tidak bergantung pada DOM atau Vite, sehingga bisa diuji dengan Node.

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/** Angka gaya Indonesia (koma desimal). null/undefined/NaN -> "—". */
export function fmtNum(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

/** Angka dengan tanda +/- eksplisit, untuk perubahan massa. */
export function fmtSigned(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  return (n > 0 ? '+' : '') + fmtNum(n, digits);
}

/** "2026-11-03" -> "3 Nov 2026" tanpa pergeseran zona waktu. */
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const pad = (n) => String(n).padStart(2, '0');

/** Tanggal lokal hari ini dalam format YYYY-MM-DD. */
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function connectorLabel(type) {
  return type === 'magnet' ? 'Magnet' : 'Standard (tanpa magnet)';
}

export function truncate(text, max = 60) {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
