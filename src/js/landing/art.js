// Ilustrasi SVG inline (tanpa gambar eksternal) untuk landing page.
// Semua ilustrasi memakai satu sprite <symbol> modul agar ringan.

// Pseudo-acak deterministik: serat selalu sama di setiap render.
function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function fibers() {
  const r = rng(42);
  const cols = ['#8a5a2b', '#a9733a', '#6f4620', '#b98748', '#7d5126'];
  let out = '';
  for (let i = 0; i < 34; i++) {
    const x = 6 + r() * 148;
    const y = 4 + r() * 92;
    const dx = (r() - 0.5) * 70;
    const dy = (r() - 0.5) * 40;
    const c1x = x + dx / 2 + (r() - 0.5) * 30;
    const c1y = y + dy / 2 + (r() - 0.5) * 30;
    out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${c1x.toFixed(1)} ${c1y.toFixed(1)} ${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}" stroke="${cols[i % cols.length]}" stroke-width="${(1.4 + r() * 1.8).toFixed(1)}"/>`;
  }
  return out;
}

/** Sprite tersembunyi: pola mesh + simbol modul. Letakkan sekali di halaman. */
export function artSprite() {
  return `
  <svg class="lp-sprite" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="bs-mesh" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0H9M0 0V9" stroke="#166534" stroke-opacity=".55" stroke-width="1.1" fill="none"/>
      </pattern>
      <linearGradient id="bs-cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e5e7eb"/><stop offset=".5" stop-color="#9ca3af"/><stop offset="1" stop-color="#d1d5db"/>
      </linearGradient>
      <linearGradient id="bs-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4fb3da"/><stop offset="1" stop-color="#0f6e96"/>
      </linearGradient>
      <clipPath id="bs-clip"><rect x="14" y="8" width="132" height="84" rx="16"/></clipPath>
      <symbol id="bs-module" viewBox="0 0 160 100">
        <rect x="14" y="8" width="132" height="84" rx="16" fill="#e0c293"/>
        <g clip-path="url(#bs-clip)" fill="none" stroke-linecap="round">${fibers()}</g>
        <rect x="14" y="8" width="132" height="84" rx="16" fill="url(#bs-mesh)"/>
        <rect x="14" y="8" width="132" height="84" rx="16" fill="none" stroke="#166534" stroke-width="3"/>
        <rect x="8" y="36" width="7" height="28" rx="2.5" fill="url(#bs-cap)" stroke="#6b7280" stroke-width="1"/>
        <rect x="145" y="36" width="7" height="28" rx="2.5" fill="url(#bs-cap)" stroke="#6b7280" stroke-width="1"/>
        <circle cx="11.5" cy="50" r="2" fill="#159b70"/><circle cx="148.5" cy="50" r="2" fill="#159b70"/>
      </symbol>
    </defs>
  </svg>`;
}

const label = (x, y, text, w) => `
  <g class="lp-art__label">
    <rect x="${x - w / 2}" y="${y - 17}" width="${w}" height="30" rx="15"/>
    <text x="${x}" y="${y + 3}" text-anchor="middle">${text}</text>
  </g>`;

/** Ilustrasi utama hero: rangkaian tiga modul terapung di permukaan air berminyak. */
export function heroArt() {
  return `
  <svg class="lp-art lp-art--hero" viewBox="0 0 560 440" role="img"
    aria-label="Ilustrasi tiga modul BIO-SORB MagnetLink: kantong mesh berisi serat sabut kelapa, disambungkan konektor magnet, terapung di permukaan air">
    <circle cx="280" cy="230" r="205" class="lp-art__halo"/>
    <g class="lp-art__float">
      <g transform="translate(33 190) scale(1.1)">
        <use href="#bs-module" width="160" height="100" x="0"/>
        <use href="#bs-module" width="160" height="100" x="144"/>
        <use href="#bs-module" width="160" height="100" x="288"/>
      </g>
      <g class="lp-art__spark">
        <circle cx="200" cy="245" r="9"/><circle cx="359" cy="245" r="9"/>
      </g>
    </g>
    <clipPath id="bs-pond"><ellipse cx="280" cy="318" rx="272" ry="122"/></clipPath>
    <g clip-path="url(#bs-pond)">
    <g class="lp-art__waves">
      <path d="M-40 272c40-14 80 14 120 0s80-14 120 0 80 14 120 0 80-14 120 0 80 14 120 0 80-14 120 0V450H-40Z" fill="url(#bs-water)" opacity=".62"/>
      <ellipse cx="120" cy="300" rx="70" ry="9" fill="#1f2937" opacity=".16"/>
      <ellipse cx="440" cy="322" rx="90" ry="11" fill="#1f2937" opacity=".14"/>
      <ellipse cx="290" cy="352" rx="110" ry="10" fill="#1f2937" opacity=".1"/>
    </g>
    <path d="M-40 292c40-12 80 12 120 0s80-12 120 0 80 12 120 0 80-12 120 0 80 12 120 0 80-12 120 0V450H-40Z" fill="#168ec1" opacity=".35" class="lp-art__waves lp-art__waves--b"/>
    </g>
    ${label(200, 92, 'Konektor magnet', 150)}
    <path d="M200 106V232" class="lp-art__leader"/>
    ${label(305, 150, 'Serat sabut kelapa', 168)}
    <path d="M305 164V224" class="lp-art__leader"/>
    ${label(448, 92, 'Kantong mesh', 126)}
    <path d="M448 106V200" class="lp-art__leader"/>
  </svg>`;
}

const step = (inner, aria) =>
  `<svg class="lp-art lp-art--step" viewBox="0 0 260 160" role="img" aria-label="${aria}">${inner}</svg>`;

/** Tiga ilustrasi tahap "How It Works". */
export function stepArt() {
  const loose = (() => {
    const r = rng(7);
    let o = '';
    for (let i = 0; i < 16; i++) {
      const x = 14 + r() * 56;
      const y = 40 + r() * 70;
      o += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${((r() - 0.5) * 30).toFixed(1)} ${((r() - 0.5) * 30).toFixed(1)} ${((r() - 0.5) * 40).toFixed(1)} ${((r() - 0.5) * 24).toFixed(1)}" stroke="${i % 2 ? '#8a5a2b' : '#b98748'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    }
    return o;
  })();

  const one = step(
    `${loose}
     <path d="M84 80h36" stroke="#159b70" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/>
     <path d="M114 70l10 10-10 10" fill="none" stroke="#159b70" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
     <use href="#bs-module" x="118" y="38" width="128" height="80"/>`,
    'Serat sabut kelapa lepas dimasukkan ke dalam kantong mesh',
  );

  const two = step(
    `<use href="#bs-module" x="6" y="40" width="128" height="80"/>
     <use href="#bs-module" x="121" y="40" width="128" height="80"/>
     <g class="lp-art__spark"><circle cx="128" cy="80" r="8"/></g>
     <path d="M104 24l24 10M152 24l-24 10" stroke="#159b70" stroke-width="3" stroke-linecap="round"/>`,
    'Dua modul disambungkan lewat konektor magnet di sisi modul',
  );

  const three = step(
    `<path d="M62 22l6 108a10 10 0 0 0 10 9h104a10 10 0 0 0 10-9l6-108" fill="#ffffff" fill-opacity=".6" stroke="#475569" stroke-width="3" stroke-linejoin="round"/>
     <path d="M66 70h128l-3 60a10 10 0 0 1-10 9H78a10 10 0 0 1-10-9Z" fill="url(#bs-water)" opacity=".8"/>
     <path d="M65 62h130l-1 9H66Z" fill="#1f2937" opacity=".35"/>
     <use href="#bs-module" x="84" y="58" width="92" height="58" opacity=".95"/>
     <path d="M214 40v70M206 40h16M206 110h16" stroke="#166534" stroke-width="2.5" stroke-linecap="round" fill="none"/>
     <path d="M42 22h176" stroke="#475569" stroke-width="3" stroke-linecap="round"/>`,
    'Modul diuji dalam wadah eksperimen terkontrol berisi air dan minyak',
  );
  return [one, two, three];
}
