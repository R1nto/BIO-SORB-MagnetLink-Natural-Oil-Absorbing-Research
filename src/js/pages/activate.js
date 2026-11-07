import { activateTeam } from '../services/auth.service.js';
import { pageHeader } from '../components/navbar.js';
import { toast } from '../components/toast.js';
import { esc } from '../utils/formatters.js';

// Untuk pengguna yang sudah masuk dan ingin mengelola data penelitian (khusus anggota tim).
export function render(root, { auth, navigate }) {
  if (auth.isTeam) return navigate('/records');
  if (!auth.session) return navigate('/login?next=%2Factivate');

  root.innerHTML = `
    <div class="auth-wrap">
      ${pageHeader({ title: 'Aktifkan akun tim', subtitle: 'Khusus anggota tim peneliti (maksimal 2 akun) yang mengelola data. Pengguna lain tetap bisa melihat hasil yang dipublikasikan.' })}
      <div class="card">
        <p style="margin:0">Akun: <strong>${esc(auth.user?.email)}</strong></p>
        <form id="activate-form" novalidate>
          <div class="stack" style="gap:16px">
            <div class="field">
              <label for="invite">Kode undangan</label>
              <input class="input" id="invite" name="code" type="password" autocomplete="off" aria-describedby="err-code" />
              <p class="field__error" id="err-code" role="alert"></p>
            </div>
            <button class="btn btn--primary" type="submit">Aktifkan akun tim</button>
          </div>
        </form>
        <p class="muted" style="font-size:.8125rem;margin:0">Tidak punya kode? Anda tidak perlu mengaktifkan apa pun untuk melihat hasil penelitian.</p>
      </div>
    </div>`;

  const form = root.querySelector('#activate-form');
  const btn = form.querySelector('button');
  form.addEventListener('input', () => (root.querySelector('#err-code').textContent = ''));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.elements.code.value.trim()) {
      root.querySelector('#err-code').textContent = 'Isi kode undangan.';
      return form.elements.code.focus();
    }
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Memeriksa kode…';
    try {
      await activateTeam(form.elements.code.value);
      toast.success('Akun diaktifkan. Selamat datang, anggota tim.');
      // Perubahan status memicu render ulang; halaman ini lalu mengarahkan ke Input Data.
    } catch (err) {
      root.querySelector('#err-code').textContent = err.message;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Aktifkan akun tim';
    }
  });
  form.elements.code.focus();
}
