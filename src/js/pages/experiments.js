import {
  listExperiments,
  getExperiment,
  createExperiment,
  updateExperiment,
  deleteExperiment,
} from '../services/experiment.service.js';
import { listRecords, setRecordsPublished } from '../services/record.service.js';
import { pageHeader } from '../components/navbar.js';
import { dataTable } from '../components/data-table.js';
import { statCard } from '../components/stat-card.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { emptyState, errorState, loadingBlock } from '../components/states.js';
import { icon } from '../../assets/icons/icons.js';
import { validateExperiment } from '../utils/validators.js';
import { summarizeOil, summarizeMassChange, oilCapacity, massChange } from '../utils/calculations.js';
import { esc, fmtNum, fmtSigned, fmtDate } from '../utils/formatters.js';

const statusBadge = (e) => (e.is_published ? '<span class="badge badge--public">Dipublikasikan</span>' : '<span class="badge">Draft</span>');

/** Dialog tambah/ubah eksperimen. onSaved dipanggil setelah berhasil. */
function openExperimentForm(existing, onSaved) {
  const e = existing ?? { title: '', description: '', is_published: false };
  const dlg = openModal({
    title: existing ? 'Ubah eksperimen' : 'Tambah eksperimen',
    body: `
      <form id="exp-form" novalidate>
        <div class="stack" style="gap:16px">
          <div class="field">
            <label for="exp-title">Judul eksperimen</label>
            <input class="input" id="exp-title" name="title" maxlength="150" value="${esc(e.title)}" aria-describedby="err-title" />
            <p class="field__error" id="err-title" role="alert"></p>
          </div>
          <div class="field">
            <label for="exp-desc">Deskripsi <span class="field__opt">(opsional)</span></label>
            <textarea class="textarea" id="exp-desc" name="description" maxlength="2000" aria-describedby="err-description">${esc(e.description ?? '')}</textarea>
            <p class="field__hint">Tujuan, kondisi pengujian, jenis minyak, dan hal lain yang perlu diketahui pembaca.</p>
            <p class="field__error" id="err-description" role="alert"></p>
          </div>
          <label class="check"><input type="checkbox" name="is_published" ${e.is_published ? 'checked' : ''} />
            <span><strong>Publikasikan eksperimen</strong><span class="field__hint" style="display:block">Pengunjung dapat melihatnya. Data pengujian tetap harus dipublikasikan satu per satu atau lewat tombol di halaman detail.</span></span></label>
        </div>
      </form>`,
    footer: `<button type="button" class="btn" data-close>Batal</button>
             <button type="submit" form="exp-form" class="btn btn--primary" data-save>${existing ? 'Simpan perubahan' : 'Simpan eksperimen'}</button>`,
  });
  const form = dlg.querySelector('#exp-form');
  const saveBtn = dlg.querySelector('[data-save]');
  const showErrors = (errors) => {
    for (const f of ['title', 'description']) {
      dlg.querySelector(`#err-${f}`).textContent = errors[f] ?? '';
      form.elements[f].setAttribute('aria-invalid', errors[f] ? 'true' : 'false');
    }
  };
  form.addEventListener('input', (ev) => {
    if (ev.target.name) showErrors({ ...{}, [ev.target.name]: '' });
  });
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const { ok, errors, values } = validateExperiment({
      title: form.elements.title.value,
      description: form.elements.description.value,
      is_published: form.elements.is_published.checked,
    });
    showErrors(errors);
    if (!ok) return dlg.querySelector('[aria-invalid="true"]')?.focus();
    saveBtn.disabled = true;
    saveBtn.setAttribute('aria-busy', 'true');
    try {
      if (existing) await updateExperiment(existing.id, values);
      else await createExperiment(values);
      toast.success(existing ? 'Perubahan eksperimen tersimpan.' : 'Eksperimen berhasil dibuat.');
      dlg.close();
      onSaved();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.removeAttribute('aria-busy');
    }
  });
  form.elements.title.focus();
}

async function confirmDelete(exp) {
  const n = exp.record_count ?? 0;
  return confirmDialog({
    title: 'Hapus eksperimen ini?',
    message: `Eksperimen <strong>${esc(exp.title)}</strong> akan dihapus${
      n ? ` beserta <strong>${n} data pengujian</strong> di dalamnya` : ''
    }. Tindakan ini tidak dapat dibatalkan.`,
    confirmLabel: 'Hapus eksperimen',
  });
}

export async function render(root, { auth, navigate, route }) {
  return route.param ? renderDetail(root, { auth, navigate, id: route.param }) : renderList(root, { auth });
}

/* ------------------------------ Daftar ------------------------------ */
async function renderList(root, { auth }) {
  async function load() {
    root.innerHTML = pageHeader({ title: 'Eksperimen' }) + loadingBlock('Memuat eksperimen…');
    let experiments;
    try {
      experiments = await listExperiments();
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Eksperimen' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    draw(experiments);
  }

  function draw(experiments) {
    root.innerHTML = `
      ${pageHeader({
        title: 'Eksperimen',
        subtitle: auth.isTeam ? 'Kelola eksperimen dan atur mana yang dipublikasikan.' : 'Eksperimen yang telah dipublikasikan oleh tim peneliti.',
        actionsHtml: auth.isTeam ? `<button type="button" class="btn btn--primary" data-add>${icon('plus', 18)}Tambah eksperimen</button>` : '',
      })}
      ${
        experiments.length
          ? `<div class="grid-cards">${experiments
              .map(
                (e) => `
            <article class="exp-card" data-id="${esc(e.id)}">
              <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
                <h3><a href="#/experiments/${esc(e.id)}">${esc(e.title)}</a></h3>
                ${auth.isTeam ? statusBadge(e) : ''}
              </div>
              <p class="exp-card__desc">${e.description ? esc(e.description) : '<span class="muted">Belum ada deskripsi.</span>'}</p>
              <div class="exp-card__foot">
                <span>${e.record_count} data · ${fmtDate(e.created_at)}</span>
                <span class="row-actions">
                  <a class="icon-btn" href="#/experiments/${esc(e.id)}" aria-label="Lihat detail ${esc(e.title)}" title="Lihat detail">${icon('eye', 18)}</a>
                  ${
                    auth.isTeam
                      ? `<button type="button" class="icon-btn" data-edit="${esc(e.id)}" aria-label="Ubah ${esc(e.title)}" title="Ubah">${icon('edit', 18)}</button>
                         <button type="button" class="icon-btn icon-btn--danger" data-delete="${esc(e.id)}" aria-label="Hapus ${esc(e.title)}" title="Hapus">${icon('trash', 18)}</button>`
                      : ''
                  }
                </span>
              </div>
            </article>`,
              )
              .join('')}</div>`
          : `<div class="card">${emptyState({
              title: auth.isTeam ? 'Belum ada eksperimen' : 'Belum ada eksperimen yang dipublikasikan',
              text: auth.isTeam
                ? 'Eksperimen mengelompokkan data pengujian, misalnya satu serangkaian uji dengan jenis minyak yang sama.'
                : 'Hasil akan muncul setelah tim mempublikasikan eksperimen.',
              actionsHtml: auth.isTeam ? `<button type="button" class="btn btn--primary" data-add>${icon('plus', 18)}Tambah eksperimen</button>` : '',
            })}</div>`
      }`;

    root.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => openExperimentForm(null, load)));
    root.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openExperimentForm(experiments.find((e) => e.id === b.dataset.edit), load)),
    );
    root.querySelectorAll('[data-delete]').forEach((b) =>
      b.addEventListener('click', async () => {
        const exp = experiments.find((e) => e.id === b.dataset.delete);
        if (!(await confirmDelete(exp))) return;
        try {
          await deleteExperiment(exp.id);
          toast.success('Eksperimen dihapus.');
          load();
        } catch (err) {
          toast.error(err.message);
        }
      }),
    );
  }

  await load();
}

/* ------------------------------ Detail ------------------------------ */
async function renderDetail(root, { auth, navigate, id }) {
  async function load() {
    root.innerHTML = pageHeader({ title: 'Detail eksperimen' }) + loadingBlock('Memuat detail eksperimen…');
    let exp, records;
    try {
      [exp, records] = await Promise.all([getExperiment(id), listRecords({ experimentId: id })]);
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Detail eksperimen' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    if (!exp) {
      root.innerHTML = `<div class="card">${emptyState({
        title: 'Eksperimen tidak ditemukan',
        text: 'Eksperimen ini mungkin sudah dihapus atau belum dipublikasikan.',
        actionsHtml: '<a class="btn btn--primary" href="#/experiments">Kembali ke daftar eksperimen</a>',
      })}</div>`;
      return;
    }
    draw(exp, records);
  }

  function draw(exp, records) {
    const oil = summarizeOil(records);
    const mass = summarizeMassChange(records);
    const publishedCount = records.filter((r) => r.is_published).length;

    root.innerHTML = `
      <p style="margin-bottom:8px"><a href="#/experiments">← Semua eksperimen</a></p>
      ${pageHeader({
        title: exp.title,
        subtitle: exp.description ?? '',
        actionsHtml: auth.isTeam
          ? `<button type="button" class="btn" data-edit>${icon('edit', 18)}Ubah</button>
             <a class="btn btn--primary" href="#/records?experiment=${esc(exp.id)}">${icon('plus', 18)}Input data</a>`
          : `<a class="btn" href="#/reports?experiment=${esc(exp.id)}">${icon('report', 18)}Lihat laporan</a>`,
      })}
      <div class="stack">
        <section class="grid-stats" aria-label="Ringkasan eksperimen">
          ${statCard({ label: 'Data pengujian', value: String(records.length), iconName: 'records', hint: auth.isTeam ? `${publishedCount} dipublikasikan` : '' })}
          ${statCard({ label: 'Rata-rata Q', value: oil.n ? fmtNum(oil.mean, 2) : null, unit: 'g/g', iconName: 'chart', hint: oil.n ? `n = ${oil.n}${oil.sd !== null ? `, SD = ${fmtNum(oil.sd, 3)}` : ''}` : 'Belum ada massa minyak yang diukur terpisah' })}
          ${statCard({ label: 'Rata-rata perubahan massa', value: mass.n ? fmtSigned(mass.mean, 2) : null, unit: 'g', iconName: 'flask', hint: mass.n ? `Dari ${mass.n} data tanpa pemisahan minyak/air` : 'Tidak ada data tanpa pemisahan' })}
          ${auth.isTeam ? statCard({ label: 'Status', value: exp.is_published ? 'Publik' : 'Draft', iconName: 'eye', hint: `Dibuat ${fmtDate(exp.created_at)}` }) : ''}
        </section>
        ${
          auth.isTeam
            ? `<section class="card" aria-labelledby="h-publish">
                 <div class="card__head"><div><h2 id="h-publish">Publikasi</h2>
                   <p>Pengunjung hanya melihat data yang eksperimen <em>dan</em> data pengujiannya sama-sama dipublikasikan.</p></div></div>
                 <div class="state__actions" style="margin:0">
                   <button type="button" class="btn" data-toggle-exp>${exp.is_published ? 'Tarik eksperimen dari publik' : 'Publikasikan eksperimen'}</button>
                   <button type="button" class="btn" data-bulk="true" ${records.length ? '' : 'disabled'}>Publikasikan semua data pengujian</button>
                   <button type="button" class="btn" data-bulk="false" ${records.length ? '' : 'disabled'}>Tarik semua data pengujian</button>
                   <button type="button" class="btn btn--danger" data-delete>${icon('trash', 16)}Hapus eksperimen</button>
                 </div>
               </section>`
            : ''
        }
        <section class="card card--flush" aria-labelledby="h-records">
          <div class="card__head"><h2 id="h-records">Data pengujian</h2></div>
          ${dataTable({
            caption: `Data pengujian eksperimen ${exp.title}`,
            rows: records,
            columns: [
              { label: 'Tanggal', render: (r) => fmtDate(r.test_date) },
              { label: 'Modul', render: (r) => `<strong>${esc(r.modules?.module_code ?? '—')}</strong>` },
              { label: 'Siklus', num: true, render: (r) => String(r.cycle_number) },
              { label: 'Massa kering (g)', num: true, render: (r) => fmtNum(r.dry_mass_g) },
              { label: 'Minyak (g)', num: true, render: (r) => fmtNum(r.oil_retained_g) },
              { label: 'Air (g)', num: true, render: (r) => fmtNum(r.water_retained_g) },
              {
                label: 'Q (g/g)',
                num: true,
                render: (r) => {
                  const q = oilCapacity(r);
                  if (q !== null) return `<strong>${fmtNum(q, 3)}</strong>`;
                  const d = massChange(r);
                  return d !== null
                    ? `<span class="muted" title="Perubahan massa total, bukan kapasitas minyak">Δ ${fmtSigned(d, 2)} g</span>`
                    : '<span class="muted">—</span>';
                },
              },
              { label: 'Metode', className: 'cell-clip', render: (r) => esc(r.measurement_method) },
              ...(auth.isTeam
                ? [{ label: 'Publik', render: (r) => (r.is_published ? '<span class="badge badge--public">Ya</span>' : '<span class="badge">Tidak</span>') }]
                : []),
            ],
            emptyHtml: emptyState({
              title: 'Belum ada data pengujian',
              text: auth.isTeam ? 'Catat hasil pengujian pertama untuk eksperimen ini.' : 'Data pengujian belum dipublikasikan.',
              actionsHtml: auth.isTeam ? `<a class="btn btn--primary" href="#/records?experiment=${esc(exp.id)}">Input data pengujian</a>` : '',
            }),
          })}
        </section>
        <p class="muted" style="font-size:.8125rem">Q (g/g) = massa minyak tertahan ÷ massa kering. Baris bertanda Δ hanya memiliki massa basah, sehingga ditampilkan sebagai perubahan massa total, bukan kapasitas minyak.</p>
      </div>`;

    root.querySelector('[data-edit]')?.addEventListener('click', () => openExperimentForm(exp, load));
    root.querySelector('[data-toggle-exp]')?.addEventListener('click', async () => {
      try {
        await updateExperiment(exp.id, { is_published: !exp.is_published });
        toast.success(exp.is_published ? 'Eksperimen ditarik dari publik.' : 'Eksperimen dipublikasikan.');
        load();
      } catch (err) {
        toast.error(err.message);
      }
    });
    root.querySelectorAll('[data-bulk]').forEach((b) =>
      b.addEventListener('click', async () => {
        const flag = b.dataset.bulk === 'true';
        try {
          const n = await setRecordsPublished(exp.id, flag);
          toast.success(`${n} data pengujian ${flag ? 'dipublikasikan' : 'ditarik dari publik'}.`);
          load();
        } catch (err) {
          toast.error(err.message);
        }
      }),
    );
    root.querySelector('[data-delete]')?.addEventListener('click', async () => {
      if (!(await confirmDelete({ ...exp, record_count: records.length }))) return;
      try {
        await deleteExperiment(exp.id);
        toast.success('Eksperimen dihapus.');
        navigate('/experiments');
      } catch (err) {
        toast.error(err.message);
      }
    });
  }

  await load();
}
