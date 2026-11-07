import {
  Chart,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { fmtNum } from '../utils/formatters.js';

Chart.register(BarController, LineController, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);
Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#5b6674';
Chart.defaults.borderColor = '#e3ebe4';

// Palet berurutan: tiga warna pertama dari palet proyek, sisanya dipilih agar tetap mudah dibedakan.
export const SERIES_COLORS = ['#166534', '#168ec1', '#159b70', '#b45309', '#7c3aed', '#be185d', '#475569', '#0e7490'];

const axisTitle = (text) => (text ? { display: true, text } : { display: false });

/** Diagram batang: satu nilai (rata-rata) per kategori. `meta[i]` = teks tambahan tooltip (mis. n dan SD). */
export function barConfig({ labels, data, label, yTitle, xTitle, meta = [], colors }) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: colors ?? labels.map((_, i) => SERIES_COLORS[i % SERIES_COLORS.length]),
          borderRadius: 4,
          maxBarThickness: 64,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${label}: ${fmtNum(ctx.parsed.y, 3)}`,
            afterLabel: (ctx) => meta[ctx.dataIndex] ?? '',
          },
        },
      },
      scales: {
        y: { beginAtZero: true, title: axisTitle(yTitle), ticks: { callback: (v) => fmtNum(v, 2) } },
        x: { title: axisTitle(xTitle), grid: { display: false } },
      },
    },
  };
}

/** Diagram garis: beberapa seri (mis. satu per modul) menurut siklus. Nilai null = tidak ada data (garis putus). */
export function lineConfig({ labels, series, yTitle, xTitle }) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
        backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0,
        spanGaps: false,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: series.length > 1, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtNum(ctx.parsed.y, 3)}` } },
      },
      scales: {
        y: { beginAtZero: true, title: axisTitle(yTitle), ticks: { callback: (v) => fmtNum(v, 2) } },
        x: { title: axisTitle(xTitle), grid: { display: false } },
      },
    },
  };
}

/** Buat grafik di <canvas>; mengembalikan instance agar bisa dihancurkan saat pindah halaman. */
export function makeChart(canvas, config) {
  return new Chart(canvas, config);
}

export function destroyCharts(list) {
  while (list.length) list.pop().destroy();
}
