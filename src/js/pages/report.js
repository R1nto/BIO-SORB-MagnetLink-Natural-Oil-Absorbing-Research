import { listRecords } from '../services/record.service.js';
import { pageHeader } from '../components/navbar.js';
import { statCard } from '../components/stat-card.js';
import { dataTable } from '../components/data-table.js';
import { barConfig, makeChart, destroyCharts } from '../components/chart.js';
import { emptyState, errorState, loadingState } from '../components/states.js';
import { toast } from '../components/toast.js';
import { icon } from '../../assets/icons/icons.js';
import { oilCapacity, massChange, summarizeOil, summarizeMassChange, statsByModule } from '../utils/calculations.js';
import { toCSV, downloadText } from '../utils/csv.js';
import { esc, fmtNum, fmtSigned, fmtDate, todayISO, connectorLabel } from '../utils/formatters.js';
import { SITE } from '../config/site.js';

const CSV_COLUMNS = [
  { label: 'Eksperimen', value: (r) => r.experiments?.title },
  { label: 'Tanggal uji', value: (r) => r.test_date },
  { label: 'Kode modul', value: (r) => r.modules?.module_code },
  { label: 'Jenis desain', value: (r) => r.modules?.design_type },
  { label: 'Konektor', value: (r) => connectorLabel(r.modules?.connector_type) },
  { label: 'Siklus', value: (r) => r.cycle_number },
  { label: 'Massa kering (g)', value: (r) => r.dry_mass_g },
  { label: 'Massa minyak tertahan (g)', value: (r) => r.oil_retained_g },
  { label: 'Massa air tertahan (g)', value: (r) => r.water_retained_g },
  { label: 'Massa basah total (g)', value: (r) => r.wet_mass_g },
  { label: 'Perubahan massa total (g)', value: (r) => massChange(r) },
  { label: 'Kapasitas minyak Q (g/g)', value: (r) => oilCapacity(r) },
  { label: 'Metode pengukuran', value: (r) => r.measurement_method },
];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'laporan';

export async function render(root, { auth, query }) {
  const charts = [];
  let all = [];
  let experimentId = query.get('experiment') ?? '';

  async function load() {
    root.innerHTML = pageHeader({ title: 'Laporan' }) + loadingState();
    try {
      all = await listRecords();
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Laporan' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    draw();
  }

  function draw() {
    destroyCharts(charts);
    if (!all.length) {
      root.innerHTML = `${pageHeader({ title: 'Laporan', subtitle: 'Ringkasan hasil penelitian yang dapat diunduh dan dicetak.' })}
        <div class="card">${emptyState({
          title: 'Belum ada data untuk dilaporkan',
          text: auth.isTeam ? 'Laporan dibuat dari data pengujian yang tercatat. Tidak ada data contoh yang dimasukkan.' : 'Laporan tersedia setelah tim mempublikasikan hasil pengujian.',
          actionsHtml: auth.isTeam ? '<a class="btn btn--primary" href="#/records">Input data pengujian</a>' : '',
        })}</div>`;
      return;
    }

    const exps = new Map(all.map((r) => [r.experiment_id, r.experiments?.title ?? '—']));
    if (experimentId && !exps.has(experimentId)) experimentId = '';
    const rows = all.filter((r) => !experimentId || r.experiment_id === experimentId).sort((a, b) => a.test_date.localeCompare(b.test_date) || a.cycle_number - b.cycle_number);
    const title = experimentId ? exps.get(experimentId) : 'Semua eksperimen';
    const oil = summarizeOil(rows);
    const mass = summarizeMassChange(rows);
    const byModule = statsByModule(rows);
    const methods = [...new Set(rows.map((r) => r.measurement_method))];
    const dates = rows.map((r) => r.test_date).sort();
    const unpublishedInfo = auth.isTeam && rows.some((r) => !r.is_published || !r.experiments?.is_published);

    root.innerHTML = `
      ${pageHeader({
        title: 'Laporan penelitian',
        subtitle: 'Ringkasan dari data yang tercatat. Tidak ada angka contoh di laporan ini.',
        actionsHtml: `<button type="button" class="btn" data-print>${icon('print', 18)}Cetak</button>
                      <button type="button" class="btn btn--primary" data-csv>${icon('download', 18)}Ekspor CSV</button>`,
      })}
      <div class="stack">
        <div class="filters no-print" style="margin:0">
          <div class="field"><label for="r-exp">Eksperimen</label>
            <select class="select" id="r-exp"><option value="">Semua eksperimen</option>
              ${[...exps].map(([id, t]) => `<option value="${esc(id)}" ${id === experimentId ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        </div>
        <div class="print-only"><h2>${esc(SITE.name)} — ${esc(title)}</h2><p>Dicetak ${esc(fmtDate(todayISO()))}</p></div>
        ${unpublishedInfo ? '<div class="callout callout--warn no-print"><strong>Laporan ini memuat data internal</strong>Sebagian data belum dipublikasikan. Periksa sebelum membagikan hasil cetak atau CSV kepada pihak luar.</div>' : ''}

        <section class="card" aria-labelledby="h-sum">
          <h2 id="h-sum">Ringkasan eksperimen</h2>
          <dl class="meta-list" style="margin-top:12px">
            <dt>Cakupan</dt><dd>${esc(title)}</dd>
            <dt>Data pengujian</dt><dd>${rows.length}</dd>
            <dt>Periode uji</dt><dd>${dates.length ? `${esc(fmtDate(dates[0]))} – ${esc(fmtDate(dates[dates.length - 1]))}` : '—'}</dd>
            <dt>Modul teruji</dt><dd>${new Set(rows.map((r) => r.module_id)).size}</dd>
          </dl>
        </section>

        <section class="grid-stats" aria-label="Statistik Q">
          ${statCard({ label: 'Rata-rata Q', value: oil.n ? fmtNum(oil.mean, 3) : null, unit: 'g/g', iconName: 'chart', hint: oil.n ? `n = ${oil.n}${oil.sd !== null ? `, SD = ${fmtNum(oil.sd, 3)}` : ''}` : 'Belum ada massa minyak terukur terpisah' })}
          ${statCard({ label: 'Q minimum', value: oil.n ? fmtNum(oil.min, 3) : null, unit: 'g/g', iconName: 'chart' })}
          ${statCard({ label: 'Q maksimum', value: oil.n ? fmtNum(oil.max, 3) : null, unit: 'g/g', iconName: 'chart' })}
          ${statCard({ label: 'Perubahan massa total', value: mass.n ? fmtSigned(mass.mean, 2) : null, unit: 'g', iconName: 'flask', hint: mass.n ? `Rata-rata ${mass.n} data tanpa pemisahan; bukan Q` : 'Tidak ada data tanpa pemisahan' })}
        </section>

        <section class="card" aria-labelledby="h-chart">
          <h2 id="h-chart" style="margin-bottom:16px">Grafik kapasitas penyerapan per modul</h2>
          ${byModule.length
            ? '<div class="chart-box"><canvas id="r-chart" role="img" aria-label="Diagram batang rata-rata Q per modul"></canvas></div>'
            : emptyState({ title: 'Grafik belum tersedia', text: 'Diperlukan data dengan massa minyak yang diukur terpisah dari air.' })}
        </section>

        <section class="card card--flush" aria-labelledby="h-tab">
          <div class="card__head"><h2 id="h-tab">Tabel hasil pengujian</h2></div>
          ${dataTable({
            caption: `Hasil pengujian ${title}`,
            rows,
            columns: [
              { label: 'Tanggal', render: (r) => fmtDate(r.test_date) },
              { label: 'Modul', render: (r) => `<strong>${esc(r.modules?.module_code ?? '—')}</strong><span class="cell-sub">${esc(connectorLabel(r.modules?.connector_type))}</span>` },
              { label: 'Siklus', num: true, render: (r) => String(r.cycle_number) },
              { label: 'Kering (g)', num: true, render: (r) => fmtNum(r.dry_mass_g) },
              { label: 'Minyak (g)', num: true, render: (r) => fmtNum(r.oil_retained_g) },
              { label: 'Air (g)', num: true, render: (r) => fmtNum(r.water_retained_g) },
              { label: 'Q (g/g)', num: true, render: (r) => { const q = oilCapacity(r); return q !== null ? `<strong>${fmtNum(q, 3)}</strong>` : '—'; } },
              { label: 'Δ massa total (g)', num: true, render: (r) => (oilCapacity(r) === null && massChange(r) !== null ? fmtSigned(massChange(r), 2) : '—') },
            ],
          })}
        </section>

        <section class="card" aria-labelledby="h-method">
          <h2 id="h-method">Informasi metode pengukuran</h2>
          <ul class="plain-list" style="margin-top:12px">
            <li>Rumus: <strong>Q = massa minyak tertahan (g) ÷ massa kering (g)</strong>.</li>
            <li>Q hanya dihitung bila massa minyak diukur terpisah. Kolom “Δ massa total” berisi selisih massa basah dan kering, dan <strong>bukan</strong> kapasitas minyak karena air bisa ikut tertahan.</li>
            <li>Sel “—” berarti tidak diukur atau tidak dapat dihitung, bukan nol.</li>
            <li>Simpangan baku (SD) memakai rumus sampel (n − 1).</li>
            <li>Metode tercatat pada data: ${methods.map((m) => `<em>${esc(m)}</em>`).join('; ')}.</li>
          </ul>
        </section>
      </div>`;

    root.querySelector('#r-exp').addEventListener('change', (e) => {
      experimentId = e.target.value;
      draw();
    });
    root.querySelector('[data-print]').addEventListener('click', () => window.print());
    root.querySelector('[data-csv]').addEventListener('click', () => {
      try {
        downloadText(`biosorb-${slug(title)}-${todayISO()}.csv`, toCSV(CSV_COLUMNS, rows));
        toast.success(`CSV berisi ${rows.length} baris diunduh.`);
      } catch {
        toast.error('CSV gagal dibuat. Coba lagi atau gunakan browser lain.');
      }
    });

    const canvas = root.querySelector('#r-chart');
    if (canvas) {
      charts.push(
        makeChart(
          canvas,
          barConfig({
            labels: byModule.map((s) => s.label),
            data: byModule.map((s) => s.mean),
            label: 'Rata-rata Q',
            yTitle: 'Q (g/g)',
            meta: byModule.map((s) => `n = ${s.n}${s.sd !== null ? `, SD = ${fmtNum(s.sd, 3)}` : ''}`),
          }),
        ),
      );
    }
  }

  await load();
  return () => destroyCharts(charts);
}
