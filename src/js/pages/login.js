import { signIn } from '../services/auth.service.js';
import { pageHeader } from '../components/navbar.js';
import { toast } from '../components/toast.js';

// Halaman pertama bagi pengunjung yang belum masuk: masuk, daftar, atau lihat sebagai tamu.
export async function render(root, { auth, navigate, query }) {
  // Hanya izinkan tujuan internal di dalam /app (/halaman) agar tidak bisa dipakai untuk redirect ke situs lain.
  const rawNext = query.get('next') ?? '';
  const hasNext = /^\/[a-z]+(\/[\w-]+)?(\?.*)?$/i.test(rawNext);

  if (auth.session) {
    navigate(hasNext ? rawNext : auth.isTeam ? '/records' : '/dashboard');
    return;
  }

  root.innerHTML = `
    <div class="auth-wrap">
      ${pageHeader({ title: 'Masuk ke BIO-SORB MagnetLink', subtitle: 'Masuk dengan akun Anda, atau daftar bila belum punya akun.' })}
      <div class="card">
        ${
          query.get('confirmed')
            ? '<div class="callout callout--ok"><strong>Email terkonfirmasi.</strong>Silakan masuk dengan akun Anda.</div>'
            : ''
        }
        <form id="login-form" novalidate>
          <div class="stack" style="gap:16px">
            <div class="field">
              <label for="email">Email</label>
              <input class="input" id="email" name="email" type="email" autocomplete="username" required aria-describedby="err-email" />
              <p class="field__error" id="err-email" role="alert"></p>
            </div>
            <div class="field">
              <label for="password">Kata sandi</label>
              <input class="input" id="password" name="password" type="password" autocomplete="current-password" required aria-describedby="err-password" />
              <p class="field__error" id="err-password" role="alert"></p>
            </div>
            <p class="field__error" id="err-form" role="alert"></p>
            <button class="btn btn--primary" type="submit">Masuk</button>
          </div>
        </form>
        <hr style="border:0;border-top:1px solid var(--border);margin:4px 0" />
        <div class="stack" style="gap:12px">
          <p style="margin:0"><strong>Belum punya akun?</strong></p>
          <a class="btn" href="/app#/register" data-link>Daftar akun baru</a>
          <p class="muted" style="font-size:.8125rem;margin:0">Hanya ingin melihat hasil penelitian? <a href="/app#/dashboard" data-link>Lanjut sebagai tamu</a></p>
        </div>
      </div>
    </div>`;

  const form = root.querySelector('#login-form');
  const btn = form.querySelector('button');
  const setErr = (field, msg) => {
    const input = form.elements[field];
    root.querySelector(`#err-${field}`).textContent = msg;
    input?.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  form.addEventListener('input', (e) => {
    if (e.target.name) setErr(e.target.name, '');
    root.querySelector('#err-form').textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    let bad = false;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErr('email', 'Isi alamat email yang valid, contoh nama@sekolah.sch.id.');
      bad = true;
    }
    if (!password) {
      setErr('password', 'Isi kata sandi.');
      bad = true;
    }
    if (bad) return form.querySelector('[aria-invalid="true"]')?.focus();

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Memeriksa akun…';
    try {
      await signIn(email, password);
      toast.success('Berhasil masuk.');
      // Status login memicu render ulang halaman ini, lalu pengguna diarahkan ke tujuan.
    } catch (err) {
      root.querySelector('#err-form').textContent = err.message;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Masuk';
    }
  });

  form.elements.email.focus();
}
