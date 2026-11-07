// "Research Preview": ringkasan hasil penelitian yang benar-benar tersedia di Supabase.
// Hanya data yang DIPUBLIKASIKAN yang dipakai. Tanpa data -> pesan "belum tersedia". Tidak ada angka karangan.

import { isConfigured } from '../config/supabase.js';
import { esc, fmtNum } from '../utils/formatters.js';
import { summarizeOil, statsByModule } from '../utils/calculations.js';

const skeleton = `
  <div role="status" aria-live="polite" class="lp-skel">
    <span class="sr-only">Memuat ringkasan hasil penelitian…</span>
    <div class="lp-skel__row"><i></i><i></i><i></i></div><div class="lp-skel__block"></div>
  </div>`;

const empty = (title, text) => `
  <div class="lp-empty">
    <div class="lp-empty__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7" stroke-dasharray="2 3"/></svg>
    </div>
    <h3>${esc(title)}</h3><p>${esc(text)}</p>
    <a class="lp-btn lp-btn--ghost" href="/app" data-link>Buka research dashboard</a>
  </div>`;

async function fetchPublished() {
  const { supabase } = await import('../config/supabase.js');
  // Filter eksplisit: meskipun pengunjung sedang login sebagai tim, landing tidak menampilkan data draft.
  // Batas waktu 10 detik agar tampilan tidak menggantung di jaringan buruk.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const { data, error } = await supabase
      .from('test_records')
      .select('*, modules(module_code, design_type, connector_type), experiments!inner(title, is_published)')
      .eq('is_published', true)
      .eq('experiments.is_published', true)
      .abortSignal(ctrl.signal);
    if (error) throw error;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function draw(el) {
  el.innerHTML = skeleton;
  if (!isConfigured) {
    el.innerHTML = empty('Hasil penelitian belum tersedia', 'Koneksi ke database belum diatur, sehingga belum ada data yang bisa ditampilkan.');
    return;
  }
  let records;
  try {
    records = await fetchPublished();
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="lp-empty" role="alert"><h3>Data belum bisa dimuat</h3>
      <p>Periksa koneksi internet lalu coba lagi.</p>
      <button type="button" class="lp-btn lp-btn--ghost" data-retry>Coba lagi</button></div>`;
    el.querySelector('[data-retry]')?.addEventListener('click', () => draw(el));
    return;
  }

  const oil = summarizeOil(records);
  const byModule = statsByModule(records);
  if (!records.length || !oil.n) {
    el.innerHTML = empty(
      'Hasil penelitian belum tersedia',
      records.length
        ? 'Data pengujian sudah dicatat, tetapi belum ada pengukuran dengan massa minyak yang diukur terpisah, sehingga kapasitas penyerapan belum bisa dihitung.'
        : 'Tim belum mempublikasikan data pengujian. Hasil akan muncul di sini setelah dipublikasikan.',
    );
    return;
  }

  el.innerHTML = `
    <div class="lp-preview">
      <ul class="lp-stats" aria-label="Ringkasan data yang dipublikasikan">
        <li><span>Pengukuran valid</span><strong>${fmtNum(oil.n, 0)}</strong></li>
        <li><span>Modul dengan data</span><strong>${fmtNum(byModule.length, 0)}</strong></li>
        <li><span>Rata-rata Q</span><strong>${fmtNum(oil.mean, 2)}<small> g/g</small></strong></li>
      </ul>
      <figure class="lp-chart">
        <figcaption>Rata-rata kapasitas penyerapan minyak per modul (Q, g minyak per g massa kering)</figcaption>
        <div class="lp-chart__box"><canvas role="img" aria-label="Diagram batang rata-rata kapasitas penyerapan minyak per modul"></canvas></div>
      </figure>
    </div>
    <p class="lp-note">Q hanya dihitung dari massa minyak yang diukur terpisah. Ini data penelitian yang masih berjalan, bukan klaim efektivitas produk.</p>`;

  const { barConfig, makeChart } = await import('../components/chart.js');
  const canvas = el.querySelector('canvas');
  const chart = makeChart(
    canvas,
    barConfig({
      labels: byModule.map((s) => s.label),
      data: byModule.map((s) => s.mean),
      label: 'Rata-rata Q',
      yTitle: 'Q (g/g)',
      meta: byModule.map((s) => `n = ${s.n}${s.sd !== null ? `, SD = ${fmtNum(s.sd, 3)}` : ''}`),
    }),
  );
  el._chart = chart;
}

/** Muat data saat bagian mendekati layar (hemat jaringan). Mengembalikan fungsi pembersih. */
export function mountPreview(el) {
  el.innerHTML = skeleton;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    draw(el);
  };
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
  } else start();
  return () => {
    io?.disconnect();
    el._chart?.destroy();
    el._chart = null;
  };
}
