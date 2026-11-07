import { listExperiments } from '../services/experiment.service.js';
import { listModules } from '../services/module.service.js';
import { listRecords } from '../services/record.service.js';
import { pageHeader } from '../components/navbar.js';
import { statCard } from '../components/stat-card.js';
import { dataTable } from '../components/data-table.js';
import { barConfig, makeChart, destroyCharts } from '../components/chart.js';
import { emptyState, errorState, loadingState } from '../components/states.js';
import { summarizeOil, statsByModule, hasValidOil, massChange } from '../utils/calculations.js';
import { esc, fmtNum, fmtDate } from '../utils/formatters.js';

export async function render(root, { auth }) {
  const charts = [];

  async function load() {
    root.innerHTML = pageHeader({ title: 'Dashboard', subtitle: 'Ringkasan data penelitian BIO-SORB MagnetLink.' }) + loadingState();
    let experiments, modules, records;
    try {
      [experiments, modules, records] = await Promise.all([listExperiments(), listModules(), listRecords()]);
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Dashboard' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    draw({ experiments, modules, records });
  }

  function draw({ experiments, modules, records }) {
    destroyCharts(charts);
    const oil = summarizeOil(records);
    const validCount = records.filter(hasValidOil).length;
    const massOnly = records.filter((r) => !hasValidOil(r) && massChange(r) !== null).length;
    const maxCycle = records.reduce((m, r) => Math.max(m, r.cycle_number), 0);
    const moduleStats = statsByModule(records);
    const recent = experiments.slice(0, 5);

    const emptyAll = !experiments.length && !modules.length && !records.length;

    const intro = emptyAll
      ? `<div class="card">${emptyState({
          title: auth.isTeam ? 'Belum ada data penelitian' : 'Belum ada hasil penelitian yang dipublikasikan',
          text: auth.isTeam
            ? 'Mulai dengan mendaftarkan modul, membuat eksperimen, lalu mencatat hasil pengujian. Dashboard akan terisi otomatis dari data tersebut.'
            : 'Data akan tampil di sini setelah tim penelitian mempublikasikan hasil eksperimen.',
          actionsHtml: auth.isTeam
            ? '<a class="btn btn--primary" href="#/modules">Daftarkan modul</a><a class="btn" href="#/experiments">Buat eksperimen</a>'
            : '<a class="btn" href="#/about">Tentang penelitian ini</a>',
        })}</div>`
      : '';

    root.innerHTML = `
      ${pageHeader({
        title: 'Dashboard',
        subtitle: auth.isTeam
          ? 'Ringkasan seluruh data, termasuk yang belum dipublikasikan.'
          : 'Ringkasan hasil penelitian yang telah dipublikasikan.',
        actionsHtml: auth.isTeam ? '<a class="btn btn--primary" href="#/records">Input data pengujian</a>' : '',
      })}
      <div class="stack">
        <section class="grid-stats" aria-label="Statistik utama">
          ${statCard({ label: 'Modul BIO-SORB', value: String(modules.length), iconName: 'modules', hint: auth.isTeam ? 'Terdaftar' : 'Dengan data terpublikasi' })}
          ${statCard({ label: 'Eksperimen', value: String(experiments.length), iconName: 'flask', hint: auth.isTeam ? `${experiments.filter((e) => e.is_published).length} dipublikasikan` : 'Dipublikasikan' })}
          ${statCard({
            label: 'Rata-rata kapasitas minyak',
            value: oil.n ? fmtNum(oil.mean, 2) : null,
            unit: 'g/g',
            iconName: 'chart',
            hint: oil.n ? `Dari ${oil.n} pengukuran valid (minyak terukur terpisah)` : 'Belum ada data valid dengan massa minyak terukur',
          })}
          ${statCard({
            label: 'Siklus pengujian tercatat',
            value: String(records.length),
            iconName: 'records',
            hint: records.length ? `Siklus tertinggi: ${maxCycle}` : 'Belum ada pengujian',
          })}
        </section>
        ${intro}
        ${
          emptyAll
            ? ''
            : `<div class="grid-main-side">
          <section class="card" aria-labelledby="h-chart">
            <div class="card__head"><div><h2 id="h-chart">Kapasitas penyerapan minyak per modul</h2>
              <p>Rata-rata Q (g minyak per g massa kering). Hanya pengukuran dengan massa minyak terukur terpisah.</p></div></div>
            ${
              moduleStats.length
                ? '<div class="chart-box"><canvas id="chart-modules" role="img" aria-label="Diagram batang rata-rata kapasitas penyerapan minyak per modul"></canvas></div>'
                : emptyState({
                    title: 'Grafik belum bisa ditampilkan',
                    text: 'Diperlukan minimal satu data pengujian dengan massa minyak yang diukur terpisah.',
                    actionsHtml: auth.isTeam ? '<a class="btn" href="#/records">Input data pengujian</a>' : '',
                  })
            }
          </section>
          <section class="card" aria-labelledby="h-status">
            <h2 id="h-status" style="margin-bottom:16px">Status penelitian</h2>
            <dl class="meta-list">
              <dt>Data pengujian</dt><dd class="num" style="text-align:left">${records.length}</dd>
              <dt>Valid untuk Q</dt><dd>${validCount}</dd>
              <dt>Hanya massa total</dt><dd>${massOnly}</dd>
            </dl>
            <div class="callout" style="margin-top:16px">
              <strong>Cara membaca angka</strong>
              Q hanya dihitung bila massa minyak diukur terpisah. Perubahan massa total (basah − kering) tidak disebut kapasitas minyak karena air ikut tertahan.
            </div>
            ${!auth.isTeam ? '<p class="muted" style="margin-top:12px;font-size:.8125rem">Anda melihat data yang dipublikasikan tim.</p>' : ''}
          </section>
        </div>
        <section class="card card--flush" aria-labelledby="h-recent">
          <div class="card__head"><h2 id="h-recent">Eksperimen terbaru</h2><a href="#/experiments">Lihat semua</a></div>
          ${dataTable({
            caption: 'Eksperimen terbaru',
            rows: recent,
            columns: [
              { label: 'Judul', render: (e) => `<a href="#/experiments/${esc(e.id)}"><strong>${esc(e.title)}</strong></a>` },
              { label: 'Dibuat', render: (e) => fmtDate(e.created_at) },
              { label: 'Data', num: true, render: (e) => String(e.record_count) },
              ...(auth.isTeam
                ? [{ label: 'Status', render: (e) => (e.is_published ? '<span class="badge badge--public">Dipublikasikan</span>' : '<span class="badge">Draft</span>') }]
                : []),
            ],
            emptyHtml: emptyState({ title: 'Belum ada eksperimen', text: auth.isTeam ? 'Buat eksperimen pertama di halaman Eksperimen.' : 'Belum ada eksperimen yang dipublikasikan.' }),
          })}
        </section>`
        }
      </div>`;

    const canvas = root.querySelector('#chart-modules');
    if (canvas && moduleStats.length) {
      charts.push(
        makeChart(
          canvas,
          barConfig({
            labels: moduleStats.map((s) => s.label),
            data: moduleStats.map((s) => s.mean),
            label: 'Rata-rata Q',
            yTitle: 'Q (g/g)',
            meta: moduleStats.map((s) => `n = ${s.n}${s.sd !== null ? `, SD = ${fmtNum(s.sd, 3)}` : ''}`),
          }),
        ),
      );
    }
  }

  await load();
  return () => destroyCharts(charts);
}
