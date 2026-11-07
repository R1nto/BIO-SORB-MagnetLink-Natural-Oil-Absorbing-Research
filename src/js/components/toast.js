import { icon } from '../../assets/icons/icons.js';
import { esc } from '../utils/formatters.js';

function container() {
  let el = document.getElementById('toasts');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toasts';
    el.className = 'toasts';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'false');
    document.body.append(el);
  }
  return el;
}

function show(message, kind) {
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  el.innerHTML = `<div class="toast__msg">${esc(message)}</div>
    <button type="button" class="icon-btn" aria-label="Tutup notifikasi">${icon('close', 16)}</button>`;
  const dismiss = () => el.remove();
  el.querySelector('button').addEventListener('click', dismiss);
  container().append(el);
  setTimeout(dismiss, kind === 'error' ? 8000 : 4500);
}

export const toast = {
  success: (message) => show(message, 'success'),
  error: (message) => show(message, 'error'),
};
