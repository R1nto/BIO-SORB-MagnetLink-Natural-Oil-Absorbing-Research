import { listRecords } from '../services/record.service.js';
import { pageHeader } from '../components/navbar.js';
import { statCard } from '../components/stat-card.js';
import { dataTable } from '../components/data-table.js';
import { barConfig, lineConfig, makeChart, destroyCharts } from '../components/chart.js';
import { emptyState, errorState, loadingState } from '../components/states.js';
import {
  filterRecords,
  summarizeOil,
  summarizeMassChange,
  statsByModule,
  statsByConnector,
  seriesByCycle,
  hasValidOil,
} from '../utils/calculations.js';
import { esc, fmtNum, fmtSigned } from '../utils/formatters.js';

const sdText = (s) => (s.sd !== null ? `, SD = ${fmtNum(s.sd, 3)}` : '');

export async function render(root, { auth }) {
  const charts = [];
  let all = [];
  const filter = { from: '', to: '', experimentId: '', moduleId: '' };

  async function load() {
    root.innerHTML = pageHeader({ title: 'Analisis' }) + loadingState();
    try {
      all = await listRecords();
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Analisis' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    drawShell();
  }

  // Opsi filter diambil dari data yang benar-benar ada (bukan seluruh tabel) agar tidak ada pilihan kosong.
  const unique = (pick) => {
    const m = new Map();
    for (const r of all) m.set(...pick(r));
    return [...m.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'id', { numeric: true }));
  };

  function drawShell() {
    if (!all.length) {
      root.innerHTML = `${pageHeader({ title: 'Analisis', subtitle: 'Grafik dan ringkasan statistik dari data pengujian.' })}
        <div class="card">${emptyState({
          title: auth.isTeam ? 'Belum ada data untuk dianalisis' : 'Belum ada data yang dipublikasikan',
          text: auth.isTeam ? 'Catat data pengujian terlebih dahulu. Grafik dan statistik dihitung otomatis dari data tersebut.' : 'Analisis akan tampil setelah tim mempublikasikan hasil pengujian.',
          actionsHtml: auth.isTeam ? '<a class="btn btn--primary" href="#/records">Input data pengujian</a>' : '',
        })}</div>`;
      return;
    }
    const experiments = unique((r) => [r.experiment_id, r.experiments?.title ?? '—']);
    const modules = unique((r) => [r.module_id, r.modules?.module_code ?? '—']);

    root.innerHTML = `
      ${pageHeader({ title: 'Analisis', subtitle: 'Grafik dan ringkasan statistik dari data valid. Gunakan filter untuk membandingkan.' })}
      <div class="stack">
        <form class="filters card" id="filters" aria-label="Filter data" style="padding:16px;margin:0">
          <div class="field"><label for="f-from">Dari tanggal</label><input class="input" type="date" id="f-from" name="from" value="${esc(filter.from)}" /></div>
          <div class="field"><label for="f-to">Sampai tanggal</label><input class="input" type="date" id="f-to" name="to" value="${esc(filter.to)}" /></div>
          <div class="field"><label for="f-exp">Eksperimen</label><select class="select" id="f-exp" name="experimentId"><option value="">Semua</option>
            ${experiments.map(([id, t]) => `<option value="${esc(id)}" ${filter.experimentId === id ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          <div class="field"><label for="f-mod">Modul</label><select class="select" id="f-mod" name="moduleId"><option value="">Semua</option>
            ${modules.map(([id, t]) => `<option value="${esc(id)}" ${filter.moduleId === id ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
          <div><button type="button" class="btn" data-reset>Atur ulang filter</button></div>
        </form>
        <div id="analysis-body" class="stack" aria-live="polite"></div>
      </div>`;

    const form = root.querySelector('#filters');
    form.addEventListener('input', () => {
      filter.from = form.elements.from.value;
      filter.to = form.elements.to.value;
      filter.experimentId = form.elements.experimentId.value;
      filter.moduleId = form.elements.moduleId.value;
      drawBody();
    });
    form.querySelector('[data-reset]').addEventListener('click', () => {
      Object.assign(filter, { from: '', to: '', experimentId: '', moduleId: '' });
      drawShell();
    });
    drawBody();
  }

  function drawBody() {
    destroyCharts(charts);
    const body = root.querySelector('#analysis-body');
    const rows = filterRecords(all, filter);
    const oil = summarizeOil(rows);
    const mass = summarizeMassChange(rows);
    const byModule = statsByModule(rows);
    const byConnector = statsByConnector(rows);
    const cycles = seriesByCycle(rows);
    const invalid = rows.filter((r) => !hasValidOil(r)).length;
    const dateOrderBad = filter.from && filter.to && filter.from > filter.to;

    if (dateOrderBad) {
      body.innerHTML = `<div class="callout callout--warn"><strong>Rentang tanggal terbalik</strong>Tanggal “dari” lebih besar dari “sampai”. Perbaiki rentangnya.</div>`;
      return;
    }
    if (!rows.length) {
      body.innerHTML = `<div class="card">${emptyState({ title: 'Tidak ada data untuk filter ini', text: 'Perluas rentang tanggal atau pilih “Semua” pada eksperimen/modul.' })}</div>`;
      return;
    }

    body.innerHTML = `
      <section class="grid-stats" aria-label="Ringkasan statistik">
        ${statCard({ label: 'Data terfilter', value: String(rows.length), iconName: 'records', hint: `${oil.n} valid untuk Q, ${invalid} tanpa minyak terukur` })}
        ${statCard({ label: 'Rata-rata Q', value: oil.n ? fmtNum(oil.mean, 3) : null, unit: 'g/g', iconName: 'chart', hint: oil.n ? `Median ${fmtNum(oil.median, 3)}` : 'Belum ada data valid' })}
        ${statCard({ label: 'Simpangan baku Q', value: oil.sd !== null ? fmtNum(oil.sd, 3) : null, unit: 'g/g', iconName: 'chart', hint: oil.n > 1 ? 'Sampel (n − 1)' : 'Butuh minimal 2 data valid' })}
        ${statCard({ label: 'Rentang Q', value: oil.n ? `${fmtNum(oil.min, 2)} – ${fmtNum(oil.max, 2)}` : null, unit: 'g/g', iconName: 'chart', hint: 'Minimum – maksimum' })}
      </section>

      ${
        oil.n
          ? `<div class="grid-2">
        <section class="card" aria-labelledby="h-mod">
          <div class="card__head"><div><h2 id="h-mod">Kapasitas penyerapan per modul</h2><p>Rata-rata Q setiap modul.</p></div></div>
          <div class="chart-box"><canvas id="c-mod" role="img" aria-label="Diagram batang rata-rata Q per modul"></canvas></div>
        </section>
        <section class="card" aria-labelledby="h-conn">
          <div class="card__head"><div><h2 id="h-conn">Perbandingan jenis konektor</h2><p>Rata-rata Q: modul magnet vs standar.</p></div></div>
          <div class="chart-box"><canvas id="c-conn" role="img" aria-label="Diagram batang perbandingan Q berdasarkan jenis konektor"></canvas></div>
          ${
            byConnector.length < 2
              ? '<p class="muted" style="font-size:.8125rem;margin-top:12px">Perbandingan membutuhkan data valid dari kedua jenis konektor.</p>'
              : '<p class="muted" style="font-size:.8125rem;margin-top:12px">Perbandingan deskriptif. Belum merupakan uji signifikansi, dan jumlah data (n) kecil dapat menyesatkan.</p>'
          }
        </section>
      </div>
      <section class="card" aria-labelledby="h-cyc">
        <div class="card__head"><div><h2 id="h-cyc">Hasil menurut siklus pengujian</h2><p>Q rata-rata pada setiap siklus, satu garis per modul.</p></div></div>
        <div class="chart-box chart-box--tall"><canvas id="c-cyc" role="img" aria-label="Diagram garis Q menurut siklus pengujian"></canvas></div>
      </section>
      <section class="card card--flush" aria-labelledby="h-tab">
        <div class="card__head"><h2 id="h-tab">Ringkasan per modul</h2></div>
        ${dataTable({
          caption: 'Statistik Q per modul',
          rows: byModule,
          columns: [
            { label: 'Modul', render: (s) => `<strong>${esc(s.label)}</strong>` },
            { label: 'n', num: true, render: (s) => String(s.n) },
            { label: 'Rata-rata (g/g)', num: true, render: (s) => fmtNum(s.mean, 3) },
            { label: 'SD', num: true, render: (s) => fmtNum(s.sd, 3) },
            { label: 'Min', num: true, render: (s) => fmtNum(s.min, 3) },
            { label: 'Maks', num: true, render: (s) => fmtNum(s.max, 3) },
          ],
        })}
      </section>`
          : `<div class="card">${emptyState({
              title: 'Belum ada data valid untuk menghitung Q',
              text: 'Q hanya dihitung bila massa minyak diukur terpisah dari air. Data pada filter ini tidak memilikinya, sehingga grafik kapasitas minyak tidak ditampilkan.',
            })}</div>`
      }

      ${
        mass.n
          ? `<section class="card" aria-labelledby="h-mass">
        <h2 id="h-mass">Data tanpa pemisahan minyak dan air</h2>
        <p class="muted" style="margin-top:8px">${mass.n} data hanya memiliki massa basah. Rata-rata perubahan massa total <strong>${fmtSigned(mass.mean, 3)} g</strong>${sdText(mass)}.
        Ini <strong>bukan kapasitas penyerapan minyak</strong>, karena air bisa ikut tertahan.</p>
      </section>`
          : ''
      }`;

    if (oil.n) {
      charts.push(
        makeChart(
          body.querySelector('#c-mod'),
          barConfig({
            labels: byModule.map((s) => s.label),
            data: byModule.map((s) => s.mean),
            label: 'Rata-rata Q',
            yTitle: 'Q (g/g)',
            meta: byModule.map((s) => `n = ${s.n}${sdText(s)}`),
          }),
        ),
        makeChart(
          body.querySelector('#c-conn'),
          barConfig({
            labels: byConnector.map((s) => `${s.label} (n=${s.n})`),
            data: byConnector.map((s) => s.mean),
            label: 'Rata-rata Q',
            yTitle: 'Q (g/g)',
            meta: byConnector.map((s) => `n = ${s.n}${sdText(s)}`),
            colors: byConnector.map((s) => (s.key === 'magnet' ? '#168ec1' : '#166534')),
          }),
        ),
        makeChart(
          body.querySelector('#c-cyc'),
          lineConfig({
            labels: cycles.cycles.map((c) => `Siklus ${c}`),
            series: cycles.series,
            yTitle: 'Q (g/g)',
          }),
        ),
      );
    }
  }

  await load();
  return () => destroyCharts(charts);
}
