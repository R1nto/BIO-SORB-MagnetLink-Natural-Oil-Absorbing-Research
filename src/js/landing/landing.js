import { SITE } from '../config/site.js';
import { esc } from '../utils/formatters.js';
import { artSprite, heroArt, stepArt } from './art.js';
import { mountPreview } from './preview.js';

const NAV = [
  { href: '#home', label: 'Beranda', id: 'home' },
  { href: '#about', label: 'Rancangan', id: 'about' },
  { href: '#how', label: 'Cara kerja', id: 'how' },
  { href: '#research', label: 'Data riset', id: 'research' },
];

const STATUS = { done: 'Selesai', ongoing: 'Sedang berjalan', next: 'Berikutnya' };

function template() {
  const steps = stepArt();
  const { team } = SITE;
  const hasTeam = team.name || team.school || team.members.length;
  const check = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

  return `
  ${artSprite()}
  <a class="skip-link" href="#main-content">Lewati ke konten utama</a>

  <header class="lp-nav" data-nav>
    <div class="lp-wrap lp-nav__inner">
      <a class="lp-brand" href="#home" aria-label="${esc(SITE.name)}, ke bagian atas">
        <img src="/logo-mark.svg" alt="" width="42" height="42" />
        <span><strong>BIO-SORB</strong><small>MagnetLink</small></span>
      </a>
      <button type="button" class="lp-nav__toggle" data-nav-toggle aria-expanded="false" aria-controls="lp-menu" aria-label="Buka menu">
        <span></span><span></span><span></span>
      </button>
      <nav class="lp-nav__menu" id="lp-menu" aria-label="Navigasi utama">
        ${NAV.map((n) => `<a href="${n.href}" data-spy="${n.id}">${n.label}</a>`).join('')}
        <a href="/login" data-link class="lp-nav__login">Masuk tim</a>
        <a href="/app#/dashboard" data-link class="lp-btn lp-btn--primary lp-btn--sm">Try me <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>

  <main id="main-content" tabindex="-1">
    <!-- 1. HERO -->
    <section class="lp-hero" id="home" aria-labelledby="hero-title">
      <div class="lp-wrap lp-hero__grid">
        <div class="lp-hero__copy" data-reveal>
          <p class="lp-chip"><span class="lp-dot" aria-hidden="true"></span>RISET MATERIAL LOKAL / ${esc(SITE.event)}</p>
          <h1 id="hero-title">BIO-SORB<span>MagnetLink</span></h1>
          <p class="lp-slogan">Mengolah potensi serat sabut kelapa menjadi modul penyerap minyak yang dapat dirangkai.</p>
          <p class="lp-lead">Kami merancang modul berisi serat sabut kelapa di dalam kantong mesh. Konektor magnet pada kedua sisinya membantu beberapa modul tersambung menjadi satu rangkaian. Kinerjanya masih kami uji melalui eksperimen terukur.</p>
          <div class="lp-cta">
            <a class="lp-btn lp-btn--primary lp-btn--lg" href="/app#/dashboard" data-link>TRY ME <span aria-hidden="true">↗</span></a>
            <span class="lp-cta__hint">Lihat data dan proses pengujiannya</span>
          </div>
        </div>
        <div class="lp-hero__visual" data-reveal style="--d:120ms">
          <div class="lp-hero__visual-frame">${heroArt()}</div>
          <div class="lp-visual-caption"><span>Gambar 01 · Konsep susunan modul</span><span>Ilustrasi konseptual</span></div>
          <aside class="lp-mascot-card" aria-label="Maskot BIO-SORB bernama Koko">
            <img src="/images/koko-mascot.webp" alt="Koko, maskot serat sabut kelapa BIO-SORB" />
            <span><strong>Kenalan dengan Koko</strong><small>Teman eksplorasi BIO-SORB</small></span>
          </aside>
        </div>
      </div>
    </section>

    <!-- 1B. PROJECT SNAPSHOT -->
    <section class="lp-snapshot" aria-label="Ringkasan rancangan BIO-SORB">
      <div class="lp-wrap lp-snapshot__grid">
        <article><span class="lp-snapshot__icon">01</span><div><strong>Serat sabut kelapa</strong><small>Material utama yang diteliti</small></div></article>
        <article><span class="lp-snapshot__icon">02</span><div><strong>Konektor magnet</strong><small>Penghubung antarmodul</small></div></article>
        <article><span class="lp-snapshot__icon">03</span><div><strong>Uji terkontrol</strong><small>Data dicatat dan dibandingkan</small></div></article>
        <article><span class="lp-snapshot__icon">04</span><div><strong>Terbuka untuk ditinjau</strong><small>Hasil publik ditampilkan transparan</small></div></article>
      </div>
    </section>

    <!-- 2. THE PROBLEM -->
    <section class="lp-section" id="problem" aria-labelledby="problem-title">
      <div class="lp-wrap">
        <header class="lp-head" data-reveal>
          <p class="lp-eyebrow">01 / Latar belakang</p>
          <h2 id="problem-title">Tumpahan minyak perlu ditangani dengan cermat.</h2>
          <p>Saat minyak tumpah atau terbuang ke sungai, danau, atau laut, minyak tidak larut. Ia cenderung menyebar membentuk lapisan tipis di permukaan air.</p>
        </header>
        <div class="lp-cards lp-cards--3">
          <article class="lp-card" data-reveal>
            <span class="lp-card__icon lp-card__icon--water" aria-hidden="true">${waterIcon()}</span>
            <h3>Menyebar di permukaan</h3>
            <p>Karena lebih ringan dari air, minyak mengapung dan mudah terbawa arus atau angin ke area yang lebih luas.</p>
          </article>
          <article class="lp-card" data-reveal style="--d:80ms">
            <span class="lp-card__icon" aria-hidden="true">${leafIcon()}</span>
            <h3>Mengganggu lingkungan</h3>
            <p>Lapisan minyak dapat mengganggu makhluk hidup di dalam dan di sekitar perairan, serta mencemari tepian.</p>
          </article>
          <article class="lp-card" data-reveal style="--d:160ms">
            <span class="lp-card__icon lp-card__icon--sun" aria-hidden="true">${searchIcon()}</span>
            <h3>Pertanyaan penelitian</h3>
            <p>Bisakah bahan alami yang mudah didapat membantu menyerap minyak? Kami menjawabnya lewat pengukuran, bukan dugaan.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- 2B. RESEARCH AREAS -->
    <section class="lp-section lp-section--featured" id="explore" aria-labelledby="explore-title">
      <div class="lp-wrap">
        <div class="lp-section-heading" data-reveal>
          <div><p class="lp-eyebrow">Jelajahi proyek</p><h2 id="explore-title">Satu inovasi, tiga hal untuk ditelusuri.</h2></div>
          <a class="lp-text-link" href="/app#/dashboard" data-link>Buka seluruh dashboard <span aria-hidden="true">↗</span></a>
        </div>
        <div class="lp-explore-grid">
          <a class="lp-explore-card lp-explore-card--material" href="/app#/records" data-link data-reveal>
            <span class="lp-explore-card__number">01 / MATERIAL</span><span class="lp-explore-card__art lp-explore-card__art--fiber" aria-hidden="true">〰</span>
            <h3>Serat dan daya serap</h3><p>Telusuri data massa, cairan tertahan, dan metode pengukuran material.</p><span class="lp-explore-card__link">Jelajahi data <b>↗</b></span>
          </a>
          <a class="lp-explore-card lp-explore-card--module" href="/app#/modules" data-link data-reveal style="--d:90ms">
            <span class="lp-explore-card__number">02 / MODUL</span><span class="lp-explore-card__art lp-explore-card__art--magnet" aria-hidden="true">＋</span>
            <h3>Rancangan MagnetLink</h3><p>Lihat variasi modul, tipe konektor, dan catatan pengembangan desain.</p><span class="lp-explore-card__link">Lihat modul <b>↗</b></span>
          </a>
          <a class="lp-explore-card lp-explore-card--analysis" href="/app#/analysis" data-link data-reveal style="--d:180ms">
            <span class="lp-explore-card__number">03 / ANALISIS</span><span class="lp-explore-card__art lp-explore-card__art--chart" aria-hidden="true">⌁</span>
            <h3>Hasil yang terukur</h3><p>Bandingkan eksperimen dan ikuti perkembangan hasil yang telah dipublikasikan.</p><span class="lp-explore-card__link">Buka analisis <b>↗</b></span>
          </a>
        </div>
      </div>
    </section>

    <!-- 3. OUR INNOVATION -->
    <section class="lp-section lp-section--tint" id="about" aria-labelledby="about-title">
      <div class="lp-wrap lp-split">
        <div data-reveal>
          <p class="lp-eyebrow">02 / Rancangan modul</p>
          <h2 id="about-title">Serat alami, kantong mesh, dan sambungan magnet.</h2>
          <ul class="lp-feature">
            <li><span class="lp-feature__num">1</span><div><h3>Serat sabut kelapa</h3><p>Material yang sedang kami teliti sebagai penyerap minyak. Seberapa baik kemampuannya baru bisa dinyatakan setelah data terkumpul.</p></div></li>
            <li><span class="lp-feature__num">2</span><div><h3>Kantong mesh</h3><p>Menahan serat tetap pada tempatnya, membiarkan cairan keluar-masuk, dan memudahkan modul diangkat kembali.</p></div></li>
            <li><span class="lp-feature__num">3</span><div><h3>Konektor magnet di sisi modul</h3><p>Dipasang pada dua sisi yang berlawanan agar beberapa modul mudah disambungkan dan dilepas.</p></div></li>
          </ul>
          <div class="lp-callout" role="note">
            <strong>Penting:</strong> magnet hanya berfungsi menyambungkan modul. Magnet <u>bukan</u> penyerap minyak. Penyerapan dilakukan oleh serat sabut kelapa.
          </div>
        </div>
        <div class="lp-module-card" data-reveal style="--d:120ms">
          <div class="lp-module-card__module"><svg viewBox="0 0 160 100" role="img" aria-label="Satu modul BIO-SORB: kantong mesh berisi serat sabut kelapa dengan konektor magnet di kiri dan kanan"><use href="#bs-module" width="160" height="100"/></svg></div>
          <img class="lp-module-card__mascot" src="/images/koko-mascot.webp" alt="Maskot Koko, karakter serat sabut kelapa" loading="lazy" />
          <p>Rancangan satu modul BIO-SORB</p>
        </div>
      </div>
    </section>

    <!-- 4. HOW IT WORKS -->
    <section class="lp-section" id="how" aria-labelledby="how-title">
      <div class="lp-wrap">
        <header class="lp-head" data-reveal>
          <p class="lp-eyebrow">03 / Alur kerja</p>
          <h2 id="how-title">Tiga tahap, dari serat hingga eksperimen.</h2>
        </header>
        <ol class="lp-steps">
          <li class="lp-step" data-reveal>
            <div class="lp-step__art">${steps[0]}</div>
            <span class="lp-step__num" aria-hidden="true">1</span>
            <h3>Serat dalam kantong mesh</h3>
            <p>Serat sabut kelapa ditempatkan di dalam kantong mesh sehingga membentuk satu modul.</p>
          </li>
          <li class="lp-step" data-reveal style="--d:100ms">
            <div class="lp-step__art">${steps[1]}</div>
            <span class="lp-step__num" aria-hidden="true">2</span>
            <h3>Sambungkan dengan magnet</h3>
            <p>Beberapa modul dapat disambungkan lewat konektor magnet di sisi modul menjadi satu rangkaian.</p>
          </li>
          <li class="lp-step" data-reveal style="--d:200ms">
            <div class="lp-step__art">${steps[2]}</div>
            <span class="lp-step__num" aria-hidden="true">3</span>
            <h3>Uji secara terkontrol</h3>
            <p>Modul diuji dalam eksperimen terkontrol, dan setiap pengukuran dicatat di dashboard penelitian.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- 4B. PLATFORM FEATURES -->
    <section class="lp-section lp-section--services" aria-labelledby="services-title">
      <div class="lp-wrap">
        <div class="lp-section-heading" data-reveal><div><p class="lp-eyebrow">Ruang kerja penelitian</p><h2 id="services-title">Semua catatan riset dalam satu tempat.</h2></div><a class="lp-text-link" href="/app#/dashboard" data-link>Masuk ke dashboard ↗</a></div>
        <div class="lp-services-grid">
          <a href="/app#/experiments" data-link class="lp-service" data-reveal><span>▤</span><strong>Eksperimen</strong><small>Catat proses dan kondisi uji.</small></a>
          <a href="/app#/modules" data-link class="lp-service" data-reveal style="--d:70ms"><span>◈</span><strong>Data modul</strong><small>Kenali setiap konfigurasi modul.</small></a>
          <a href="/app#/analysis" data-link class="lp-service" data-reveal style="--d:140ms"><span>⌁</span><strong>Analisis</strong><small>Bandingkan pengukuran secara visual.</small></a>
          <a href="/app#/reports" data-link class="lp-service" data-reveal style="--d:210ms"><span>▧</span><strong>Laporan</strong><small>Susun dan ekspor ringkasan riset.</small></a>
        </div>
      </div>
    </section>

    <!-- 5. RESEARCH JOURNEY -->
    <section class="lp-section lp-section--tint" id="journey" aria-labelledby="journey-title">
      <div class="lp-wrap">
        <header class="lp-head" data-reveal>
          <p class="lp-eyebrow">04 / Tahapan penelitian</p>
          <h2 id="journey-title">Proyek ini masih dalam proses pengujian.</h2>
          <p>Kami belum menyimpulkan apa pun. Berikut tahapan penelitian dan posisi kami saat ini.</p>
        </header>
        <ol class="lp-timeline">
          ${SITE.journey
            .map(
              (s, i) => `
          <li class="lp-timeline__item lp-timeline__item--${esc(s.status)}" data-reveal style="--d:${i * 70}ms">
            <span class="lp-timeline__dot" aria-hidden="true">${s.status === 'done' ? check : i + 1}</span>
            <div>
              <h3>${esc(s.title)} <span class="lp-tag lp-tag--${esc(s.status)}">${STATUS[s.status] ?? ''}</span></h3>
              <p>${esc(s.text)}</p>
            </div>
          </li>`,
            )
            .join('')}
        </ol>
      </div>
    </section>

    <!-- 6. RESEARCH PREVIEW -->
    <section class="lp-section" id="research" aria-labelledby="research-title">
      <div class="lp-wrap">
        <header class="lp-head" data-reveal>
          <p class="lp-eyebrow">05 / Data penelitian</p>
          <h2 id="research-title">Cuplikan hasil yang sudah tersedia.</h2>
          <p>Hanya data yang telah dipublikasikan tim dan diambil langsung dari database.</p>
        </header>
        <div class="lp-panel" data-reveal data-preview></div>
      </div>
    </section>

    <!-- 7. FINAL CTA -->
    <section class="lp-final" aria-labelledby="final-title">
      <div class="lp-wrap lp-final__inner" data-reveal>
        <div class="lp-final__copy"><p class="lp-eyebrow">Buka ruang penelitian</p><h2 id="final-title">Ide yang baik perlu diuji. Datanya perlu dibuka.</h2><p>Jelajahi rancangan, catatan eksperimen, dan hasil yang telah dipublikasikan oleh tim BIO-SORB.</p><a class="lp-btn lp-btn--light lp-btn--lg" href="/app#/dashboard" data-link>Try me — buka dashboard <span aria-hidden="true">↗</span></a></div>
        <img src="/images/koko-mascot.webp" alt="Koko, maskot BIO-SORB" loading="lazy" />
      </div>
    </section>
  </main>

  <!-- 8. FOOTER -->
  <footer class="lp-footer">
    <div class="lp-wrap lp-footer__inner">
      <div>
        <p class="lp-footer__name"><img src="/logo-mark.svg" alt="" width="34" height="34" />${esc(SITE.name)}</p>
        <p class="lp-footer__sub">${esc(SITE.event)}</p>
      </div>
      <div class="lp-footer__team">
        ${
          hasTeam
            ? `${team.name ? `<p><strong>${esc(team.name)}</strong></p>` : ''}${team.school ? `<p>${esc(team.school)}</p>` : ''}${team.members.length ? `<p>${team.members.map(esc).join(' · ')}</p>` : ''}`
            : '<p>Identitas tim akan ditambahkan.</p>'
        }
      </div>
      <nav class="lp-footer__links" aria-label="Tautan footer">
        <a href="/app#/dashboard" data-link>Dashboard penelitian</a>
        <a href="/login" data-link>Masuk tim</a>
      </nav>
    </div>
  </footer>`;
}

const waterIcon = () => '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 5-6 8-6 11a6 6 0 0 0 12 0c0-3-2-6-6-11Z"/></svg>';
const leafIcon = () => '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14Z"/><path d="M5 19c3-5 6-8 10-10"/></svg>';
const searchIcon = () => '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

export function mount(el) {
  document.title = `${SITE.name} — Riset material serat sabut kelapa dan modul penyerap minyak`;
  el.innerHTML = `<div class="landing js-reveal">${template()}</div>`;
  const root = el.firstElementChild;
  const cleanups = [];

  // Menu mobile
  const nav = root.querySelector('[data-nav]');
  const toggle = root.querySelector('[data-nav-toggle]');
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => e.target.closest('a') && setOpen(false));
  const onKey = (e) => e.key === 'Escape' && setOpen(false);
  document.addEventListener('keydown', onKey);
  cleanups.push(() => document.removeEventListener('keydown', onKey));

  // Bayangan header saat di-scroll
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  cleanups.push(() => window.removeEventListener('scroll', onScroll));

  // Animasi muncul saat scroll (ringan: satu observer, sekali jalan per elemen)
  const items = root.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    items.forEach((i) => io.observe(i));
    cleanups.push(() => io.disconnect());
  } else items.forEach((i) => i.classList.add('is-in'));

  // Tandai menu aktif sesuai bagian yang terlihat
  const links = [...root.querySelectorAll('[data-spy]')];
  if ('IntersectionObserver' in window) {
    const ids = { home: 'home', about: 'about', how: 'how', research: 'research' };
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          links.forEach((l) => (l.dataset.spy === e.target.id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    Object.values(ids).forEach((id) => root.querySelector(`#${id}`) && spy.observe(root.querySelector(`#${id}`)));
    cleanups.push(() => spy.disconnect());
  }

  cleanups.push(mountPreview(root.querySelector('[data-preview]')));
  return () => cleanups.forEach((fn) => fn());
}
