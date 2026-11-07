import { signUp } from '../services/auth.service.js';
import { pageHeader } from '../components/navbar.js';

const MIN_PASSWORD = 10;

export function render(root, { auth, navigate }) {
  if (auth.session) return navigate(auth.isTeam ? '/records' : '/dashboard');

  root.innerHTML = `
    <div class="auth-wrap">
      ${pageHeader({ title: 'Daftar akun tim', subtitle: 'Buat akun untuk melihat hasil penelitian yang dipublikasikan. Anggota tim peneliti dapat mengaktifkan akses pengelolaan data dengan kode undangan setelah masuk.' })}
      <div class="card">
        <form id="reg-form" novalidate>
          <div class="stack" style="gap:16px">
            <div class="field">
              <label for="r-email">Email</label>
              <input class="input" id="r-email" name="email" type="email" autocomplete="username" aria-describedby="err-email" />
              <p class="field__error" id="err-email" role="alert"></p>
            </div>
            <div class="field">
              <label for="r-pass">Kata sandi</label>
              <input class="input" id="r-pass" name="password" type="password" autocomplete="new-password" aria-describedby="hint-pass err-password" />
              <p class="field__hint" id="hint-pass">Minimal ${MIN_PASSWORD} karakter.</p>
              <p class="field__error" id="err-password" role="alert"></p>
            </div>
            <div class="field">
              <label for="r-pass2">Ulangi kata sandi</label>
              <input class="input" id="r-pass2" name="password2" type="password" autocomplete="new-password" aria-describedby="err-password2" />
              <p class="field__error" id="err-password2" role="alert"></p>
            </div>
            <p class="field__error" id="err-form" role="alert"></p>
            <button class="btn btn--primary" type="submit">Buat akun</button>
          </div>
        </form>
        <p class="muted" style="font-size:.8125rem">Sudah punya akun? <a href="/login" data-link>Masuk</a></p>
      </div>
    </div>`;

  const form = root.querySelector('#reg-form');
  const btn = form.querySelector('button');
  const setErr = (field, msg) => {
    root.querySelector(`#err-${field}`).textContent = msg;
    form.elements[field]?.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  const check = () => {
    const email = form.elements.email.value.trim();
    const pw = form.elements.password.value;
    const pw2 = form.elements.password2.value;
    const errors = {};
    if (!email) errors.email = 'Isi alamat email.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Alamat email tidak valid, contoh nama@sekolah.sch.id.';
    if (!pw) errors.password = 'Isi kata sandi.';
    else if (pw.length < MIN_PASSWORD) errors.password = `Kata sandi minimal ${MIN_PASSWORD} karakter (sekarang ${pw.length}).`;
    if (pw2 !== pw) errors.password2 = 'Kata sandi tidak sama. Ketik ulang dengan teliti.';
    return errors;
  };

  form.addEventListener('focusout', (e) => {
    const f = e.target.name;
    if (f && form.elements[f].value !== '') setErr(f, check()[f] ?? '');
  });
  form.addEventListener('input', (e) => {
    if (e.target.name) setErr(e.target.name, '');
    root.querySelector('#err-form').textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errors = check();
    for (const f of ['email', 'password', 'password2']) setErr(f, errors[f] ?? '');
    if (Object.keys(errors).length) return form.querySelector('[aria-invalid="true"]')?.focus();

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Membuat akun…';
    try {
      const { needsEmailConfirmation } = await signUp(form.elements.email.value, form.elements.password.value);
      if (needsEmailConfirmation) {
        root.querySelector('.card').innerHTML = `
          <div class="callout callout--ok"><strong>Akun dibuat. Cek email Anda.</strong>
          Klik tautan konfirmasi di email, lalu masuk.</div>
          <a class="btn btn--primary" href="/login" data-link>Ke halaman masuk</a>`;
      } else {
        navigate('/dashboard'); // sudah masuk otomatis
      }
    } catch (err) {
      root.querySelector('#err-form').textContent = err.message;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Buat akun';
    }
  });
  form.elements.email.focus();
}
