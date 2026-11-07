import { icon } from '../../assets/icons/icons.js';
import { esc } from '../utils/formatters.js';

let uid = 0;

/** Dialog asli (<dialog>): fokus terkunci di dalam dan Esc menutup. Fokus dikembalikan otomatis ke pemicu. */
export function openModal({ title, body, footer = '', dismissOnBackdrop = false, onClose }) {
  const id = `dlg-${++uid}`;
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.setAttribute('aria-labelledby', `${id}-title`);
  dlg.innerHTML = `
    <div class="modal__head">
      <h2 id="${id}-title">${esc(title)}</h2>
      <button type="button" class="icon-btn" data-close aria-label="Tutup dialog">${icon('close')}</button>
    </div>
    <div class="modal__body">${body}</div>
    ${footer ? `<div class="modal__foot">${footer}</div>` : ''}`;
  document.body.append(dlg);
  const opener = document.activeElement;
  dlg.showModal();
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || (dismissOnBackdrop && e.target === dlg)) dlg.close();
  });
  dlg.addEventListener('close', () => {
    dlg.remove();
    onClose?.();
    if (opener && document.contains(opener)) opener.focus();
  });
  return dlg;
}

/** Konfirmasi tindakan merusak. Tombol memakai nama tindakan, bukan "OK". Mengembalikan Promise<boolean>. */
export function confirmDialog({ title, message, confirmLabel = 'Hapus' }) {
  return new Promise((resolve) => {
    let result = false;
    const dlg = openModal({
      title,
      body: `<p>${message}</p>`,
      footer: `<button type="button" class="btn" data-close>Batal</button>
               <button type="button" class="btn btn--danger" data-confirm>${esc(confirmLabel)}</button>`,
      dismissOnBackdrop: true,
      onClose: () => resolve(result),
    });
    dlg.querySelector('[data-confirm]').addEventListener('click', () => {
      result = true;
      dlg.close();
    });
    dlg.querySelector('[data-close].btn').focus();
  });
}
