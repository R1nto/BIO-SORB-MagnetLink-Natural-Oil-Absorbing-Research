import { listExperiments } from '../services/experiment.service.js';
import { listModules } from '../services/module.service.js';
import { listRecords, createRecord, updateRecord, deleteRecord, getNotes } from '../services/record.service.js';
import { pageHeader } from '../components/navbar.js';
import { dataTable } from '../components/data-table.js';
import { confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { emptyState, errorState, loadingBlock } from '../components/states.js';
import { icon } from '../../assets/icons/icons.js';
import { validateRecord, parseDecimal } from '../utils/validators.js';
import { oilCapacity, massChange } from '../utils/calculations.js';
import { prefs } from '../utils/dom.js';
import { esc, fmtNum, fmtSigned, fmtDate, todayISO, truncate } from '../utils/formatters.js';

const FIELDS = [
  'test_date',
  'experiment_id',
  'module_id',
  'cycle_number',
  'dry_mass_g',
  'oil_retained_g',
  'water_retained_g',
  'wet_mass_g',
  'measurement_method',
  'note',
];

const METHOD_SUGGESTIONS = [
  'Gravimetri: minyak ditimbang terpisah dari air',
  'Perubahan massa total (minyak dan air belum dipisahkan)',
  'Ekstraksi pelarut',
];

const numValue = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));

export async function render(root, { query }) {
  let experiments = [];
  let modules = [];
  let records = [];
  let notes = new Map();
  let editing = null; // record yang sedang diubah
  const filter = { experimentId: '', moduleId: '' };

  async function load() {
    root.innerHTML = pageHeader({ title: 'Input Data' }) + loadingBlock('Memuat data…');
    try {
      [experiments, modules, records] = await Promise.all([listExperiments(), listModules(), listRecords()]);
      notes = await getNotes(records.map((r) => r.id));
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Input Data' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    drawAll();
  }

  /* ------------------------------ Kerangka ------------------------------ */
  function drawAll() {
    if (!experiments.length || !modules.length) {
      root.innerHTML = `${pageHeader({ title: 'Input Data', subtitle: 'Catat hasil pengujian modul BIO-SORB.' })}
        <div class="card">${emptyState({
          title: 'Lengkapi data pendukung dulu',
          text: `Untuk mencatat pengujian, dibutuhkan ${!experiments.length ? '<strong>minimal satu eksperimen</strong>' : ''}${
            !experiments.length && !modules.length ? ' dan ' : ''
          }${!modules.length ? '<strong>minimal satu modul</strong>' : ''}.`,
          actionsHtml: `${!experiments.length ? '<a class="btn btn--primary" href="#/experiments">Buat eksperimen</a>' : ''}${
            !modules.length ? '<a class="btn btn--primary" href="#/modules">Daftarkan modul</a>' : ''
          }`,
        })}</div>`;
      return;
    }

    root.innerHTML = `
      ${pageHeader({ title: 'Input Data', subtitle: 'Catat hasil pengujian. Kolom kosong berarti “tidak diukur”, bukan nol.' })}
      <div class="stack">
        <section class="card" aria-labelledby="h-form" id="form-card"></section>
        <section class="card card--flush" aria-labelledby="h-list">
          <div class="card__head"><h2 id="h-list">Data pengujian tercatat</h2></div>
          <div style="padding:16px 24px 0">
            <div class="filters" style="margin-bottom:12px">
              <div class="field"><label for="flt-exp">Eksperimen</label>
                <select class="select" id="flt-exp"><option value="">Semua eksperimen</option>
                  ${experiments.map((e) => `<option value="${esc(e.id)}" ${filter.experimentId === e.id ? 'selected' : ''}>${esc(e.title)}</option>`).join('')}</select></div>
              <div class="field"><label for="flt-mod">Modul</label>
                <select class="select" id="flt-mod"><option value="">Semua modul</option>
                  ${modules.map((m) => `<option value="${esc(m.id)}" ${filter.moduleId === m.id ? 'selected' : ''}>${esc(m.module_code)}</option>`).join('')}</select></div>
            </div>
          </div>
          <div id="rec-table"></div>
        </section>
        <p class="muted" style="font-size:.8125rem">Q (g/g) = massa minyak tertahan ÷ massa kering. Baris bertanda Δ hanya memiliki massa basah: itu perubahan massa total, bukan kapasitas minyak.</p>
      </div>`;
    drawForm();
    drawTable();
    root.querySelector('#flt-exp').addEventListener('change', (e) => {
      filter.experimentId = e.target.value;
      drawTable();
    });
    root.querySelector('#flt-mod').addEventListener('change', (e) => {
      filter.moduleId = e.target.value;
      drawTable();
    });
  }

  /* ------------------------------ Form ------------------------------ */
  function initialValues() {
    if (editing) {
      const r = editing;
      return {
        test_date: r.test_date,
        experiment_id: r.experiment_id,
        module_id: r.module_id,
        cycle_number: String(r.cycle_number),
        dry_mass_g: numValue(r.dry_mass_g),
        oil_retained_g: numValue(r.oil_retained_g),
        water_retained_g: numValue(r.water_retained_g),
        wet_mass_g: numValue(r.wet_mass_g),
        measurement_method: r.measurement_method,
        note: notes.get(r.id) ?? '',
        is_published: r.is_published,
      };
    }
    // Nilai awal cerdas: ingat pilihan terakhir agar input berulang tidak perlu mengisi ulang.
    const last = prefs.get('lastRecord', {});
    const fromQuery = query.get('experiment');
    const pick = (list, id) => (list.some((x) => x.id === id) ? id : '');
    return {
      test_date: last.test_date || todayISO(),
      experiment_id: pick(experiments, fromQuery) || pick(experiments, last.experiment_id) || (experiments.length === 1 ? experiments[0].id : ''),
      module_id: pick(modules, last.module_id) || (modules.length === 1 ? modules[0].id : ''),
      cycle_number: last.cycle_number ? String(last.cycle_number) : '1',
      dry_mass_g: '',
      oil_retained_g: '',
      water_retained_g: '',
      wet_mass_g: '',
      measurement_method: last.measurement_method ?? '',
      note: '',
      is_published: false,
    };
  }

  function drawForm() {
    const v = initialValues();
    const host = root.querySelector('#form-card');
    const field = (name, label, control, { hint = '', optional = false } = {}) => `
      <div class="field">
        <label for="f-${name}">${label}${optional ? ' <span class="field__opt">(opsional)</span>' : ''}</label>
        ${control}
        ${hint ? `<p class="field__hint" id="hint-${name}">${hint}</p>` : ''}
        <p class="field__error" id="err-${name}" role="alert"></p>
      </div>`;
    const numInput = (name) =>
      `<div class="input-unit"><input class="input" id="f-${name}" name="${name}" type="text" inputmode="decimal" autocomplete="off" value="${esc(v[name])}" aria-describedby="err-${name}${name === 'oil_retained_g' ? ' hint-' + name : ''}" /><span class="input-unit__suffix">g</span></div>`;

    host.innerHTML = `
      <div class="card__head"><div><h2 id="h-form">${editing ? 'Ubah data pengujian' : 'Tambah data pengujian'}</h2>
        ${editing ? '<p>Anda sedang mengubah data yang sudah tersimpan.</p>' : ''}</div></div>
      <form id="rec-form" novalidate>
        <div class="form-grid">
          ${field('test_date', 'Tanggal pengujian', `<input class="input" id="f-test_date" name="test_date" type="date" max="${todayISO()}" value="${esc(v.test_date)}" aria-describedby="err-test_date" />`)}
          ${field('experiment_id', 'Eksperimen terkait', `<select class="select" id="f-experiment_id" name="experiment_id" aria-describedby="err-experiment_id"><option value="">Pilih eksperimen</option>${experiments
            .map((e) => `<option value="${esc(e.id)}" ${v.experiment_id === e.id ? 'selected' : ''}>${esc(e.title)}</option>`)
            .join('')}</select>`)}
          ${field('module_id', 'Kode modul', `<select class="select" id="f-module_id" name="module_id" aria-describedby="err-module_id"><option value="">Pilih modul</option>${modules
            .map((m) => `<option value="${esc(m.id)}" ${v.module_id === m.id ? 'selected' : ''}>${esc(m.module_code)} · ${esc(m.connector_type === 'magnet' ? 'Magnet' : 'Standard')}</option>`)
            .join('')}</select>`)}
          ${field('cycle_number', 'Nomor siklus pengujian', `<input class="input" id="f-cycle_number" name="cycle_number" type="text" inputmode="numeric" autocomplete="off" value="${esc(v.cycle_number)}" aria-describedby="err-cycle_number hint-cycle_number" />`, { hint: 'Pemakaian ke-berapa modul ini (1, 2, 3, …).' })}
          ${field('dry_mass_g', 'Massa kering modul', numInput('dry_mass_g'), { hint: 'Massa modul sebelum menyerap.' })}
          ${field('oil_retained_g', 'Massa minyak yang tertahan', numInput('oil_retained_g'), { optional: true, hint: 'Isi hanya bila minyak ditimbang terpisah dari air. Kosongkan bila tidak diukur.' })}
          ${field('water_retained_g', 'Massa air yang tertahan', numInput('water_retained_g'), { optional: true, hint: 'Kosongkan bila tidak diukur.' })}
          ${field('wet_mass_g', 'Massa basah total', numInput('wet_mass_g'), { optional: true, hint: 'Massa modul setelah menyerap. Dipakai untuk perubahan massa total.' })}
          <div class="field field--wide">
            <label for="f-measurement_method">Metode pengukuran</label>
            <input class="input" id="f-measurement_method" name="measurement_method" list="method-list" maxlength="200" autocomplete="off" value="${esc(v.measurement_method)}" aria-describedby="err-measurement_method" />
            <datalist id="method-list">${METHOD_SUGGESTIONS.map((m) => `<option value="${esc(m)}"></option>`).join('')}</datalist>
            <p class="field__error" id="err-measurement_method" role="alert"></p>
          </div>
          <div class="field field--wide">
            <label for="f-note">Catatan tambahan <span class="field__opt">(opsional, internal)</span></label>
            <textarea class="textarea" id="f-note" name="note" maxlength="2000" aria-describedby="err-note hint-note">${esc(v.note)}</textarea>
            <p class="field__hint" id="hint-note">Catatan internal tidak pernah tampil ke pengunjung publik.</p>
            <p class="field__error" id="err-note" role="alert"></p>
          </div>
          <label class="check field--wide"><input type="checkbox" name="is_published" ${v.is_published ? 'checked' : ''} />
            <span><strong>Publikasikan data pengujian ini</strong><span class="field__hint" style="display:block">Tampil ke pengunjung bila eksperimennya juga dipublikasikan.</span></span></label>
        </div>
        <div class="callout" id="q-preview" style="margin-top:16px" aria-live="polite"></div>
        <div class="form-actions">
          <button type="submit" class="btn btn--primary" data-save>${editing ? 'Simpan perubahan' : 'Simpan data pengujian'}</button>
          ${editing ? '<button type="button" class="btn" data-cancel>Batalkan perubahan</button>' : ''}
        </div>
      </form>`;

    const form = host.querySelector('#rec-form');
    const saveBtn = form.querySelector('[data-save]');
    const readInput = () => ({
      ...Object.fromEntries(FIELDS.map((f) => [f, form.elements[f].value])),
      is_published: form.elements.is_published.checked,
    });

    const showErrors = (errors, only) => {
      for (const f of FIELDS) {
        if (only && f !== only) continue;
        host.querySelector(`#err-${f}`).textContent = errors[f] ?? '';
        form.elements[f].setAttribute('aria-invalid', errors[f] ? 'true' : 'false');
      }
    };

    function updatePreview() {
      const input = readInput();
      const dry = parseDecimal(input.dry_mass_g);
      const oil = parseDecimal(input.oil_retained_g);
      const wet = parseDecimal(input.wet_mass_g);
      const box = host.querySelector('#q-preview');
      const rec = { dry_mass_g: dry, oil_retained_g: oil, wet_mass_g: wet };
      const q = Number.isFinite(dry) && Number.isFinite(oil) ? oilCapacity(rec) : null;
      const d = Number.isFinite(dry) && Number.isFinite(wet) ? massChange(rec) : null;
      box.className = 'callout' + (q !== null ? ' callout--ok' : '');
      if (q !== null) {
        box.innerHTML = `<strong>Kapasitas penyerapan minyak Q = ${fmtNum(q, 3)} g/g</strong>Dihitung dari massa minyak ÷ massa kering.${
          d !== null ? ` Perubahan massa total: ${fmtSigned(d, 3)} g.` : ''
        }`;
      } else if (d !== null) {
        box.innerHTML = `<strong>Q belum dapat dihitung</strong>Massa minyak tidak diisi. Data ini akan dicatat sebagai perubahan massa total (${fmtSigned(d, 3)} g), bukan kapasitas minyak, karena air mungkin ikut tertahan.`;
      } else {
        box.innerHTML = '<strong>Pratinjau perhitungan</strong>Isi massa kering dan massa minyak untuk melihat Q. Isi massa basah bila hanya mengukur perubahan massa total.';
      }
    }

    // Validasi saat meninggalkan kolom; pesan hilang begitu pengguna mulai memperbaiki.
    form.addEventListener('focusout', (ev) => {
      const f = ev.target.name;
      if (FIELDS.includes(f)) showErrors(validateRecord(readInput()).errors, f);
    });
    form.addEventListener('input', (ev) => {
      if (FIELDS.includes(ev.target.name)) showErrors({}, ev.target.name);
      updatePreview();
    });
    form.addEventListener('change', updatePreview);
    updatePreview();

    form.querySelector('[data-cancel]')?.addEventListener('click', () => {
      editing = null;
      drawForm();
      drawTable();
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const { ok, errors, values } = validateRecord(readInput());
      showErrors(errors);
      if (!ok) {
        form.querySelector('[aria-invalid="true"]')?.focus();
        toast.error('Ada isian yang perlu diperbaiki. Lihat pesan di bawah kolom yang ditandai.');
        return;
      }
      saveBtn.disabled = true;
      saveBtn.setAttribute('aria-busy', 'true');
      saveBtn.textContent = 'Menyimpan…';
      try {
        if (editing) {
          await updateRecord(editing.id, values);
          toast.success('Perubahan data pengujian tersimpan.');
          editing = null;
        } else {
          await createRecord(values);
          toast.success(`Data modul ${modules.find((m) => m.id === values.module_id)?.module_code ?? ''} siklus ${values.cycle_number} tersimpan.`);
          // Ingat konteks, naikkan siklus untuk input berikutnya.
          prefs.set('lastRecord', {
            test_date: values.test_date,
            experiment_id: values.experiment_id,
            module_id: values.module_id,
            cycle_number: values.cycle_number + 1,
            measurement_method: values.measurement_method,
          });
        }
        [records] = await Promise.all([listRecords()]);
        notes = await getNotes(records.map((r) => r.id));
        drawForm();
        drawTable();
        root.querySelector('#f-dry_mass_g')?.focus();
      } catch (err) {
        toast.error(err.message);
        saveBtn.disabled = false;
        saveBtn.removeAttribute('aria-busy');
        saveBtn.textContent = editing ? 'Simpan perubahan' : 'Simpan data pengujian';
      }
    });
  }

  /* ------------------------------ Tabel ------------------------------ */
  function drawTable() {
    const rows = records.filter(
      (r) => (!filter.experimentId || r.experiment_id === filter.experimentId) && (!filter.moduleId || r.module_id === filter.moduleId),
    );
    const host = root.querySelector('#rec-table');
    host.innerHTML = dataTable({
      caption: 'Data pengujian tercatat',
      rows,
      columns: [
        { label: 'Tanggal', render: (r) => fmtDate(r.test_date) },
        { label: 'Eksperimen', className: 'cell-clip', render: (r) => esc(r.experiments?.title ?? '—') },
        { label: 'Modul', render: (r) => `<strong>${esc(r.modules?.module_code ?? '—')}</strong>` },
        { label: 'Siklus', num: true, render: (r) => String(r.cycle_number) },
        { label: 'Kering (g)', num: true, render: (r) => fmtNum(r.dry_mass_g) },
        { label: 'Minyak (g)', num: true, render: (r) => fmtNum(r.oil_retained_g) },
        { label: 'Air (g)', num: true, render: (r) => fmtNum(r.water_retained_g) },
        { label: 'Basah (g)', num: true, render: (r) => fmtNum(r.wet_mass_g) },
        {
          label: 'Q (g/g)',
          num: true,
          render: (r) => {
            const q = oilCapacity(r);
            if (q !== null) return `<strong>${fmtNum(q, 3)}</strong>`;
            const d = massChange(r);
            return d !== null ? `<span class="muted" title="Perubahan massa total, bukan kapasitas minyak">Δ ${fmtSigned(d, 2)} g</span>` : '<span class="muted">—</span>';
          },
        },
        { label: 'Metode', className: 'cell-clip', render: (r) => `<span title="${esc(r.measurement_method)}">${esc(truncate(r.measurement_method, 32))}</span>` },
        { label: 'Catatan', className: 'cell-clip', render: (r) => (notes.get(r.id) ? `<span title="${esc(notes.get(r.id))}">${esc(truncate(notes.get(r.id), 30))}</span>` : '<span class="muted">—</span>') },
        {
          label: 'Status',
          render: (r) => {
            if (!r.is_published) return '<span class="badge">Internal</span>';
            return r.experiments?.is_published
              ? '<span class="badge badge--public">Publik</span>'
              : '<span class="badge badge--warn" title="Data ditandai publik, tetapi eksperimennya belum dipublikasikan">Tertahan</span>';
          },
        },
        {
          label: 'Aksi',
          srOnly: true,
          render: (r) => `<span class="row-actions">
            <button type="button" class="icon-btn" data-edit="${esc(r.id)}" aria-label="Ubah data ${esc(r.modules?.module_code ?? '')} siklus ${r.cycle_number}" title="Ubah">${icon('edit', 18)}</button>
            <button type="button" class="icon-btn icon-btn--danger" data-delete="${esc(r.id)}" aria-label="Hapus data ${esc(r.modules?.module_code ?? '')} siklus ${r.cycle_number}" title="Hapus">${icon('trash', 18)}</button>
          </span>`,
        },
      ],
      emptyHtml: emptyState({
        title: records.length ? 'Tidak ada data untuk filter ini' : 'Belum ada data pengujian',
        text: records.length ? 'Ubah filter eksperimen atau modul.' : 'Isi formulir di atas untuk mencatat pengujian pertama.',
      }),
    });

    host.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        editing = records.find((r) => r.id === b.dataset.edit);
        drawForm();
        root.querySelector('#form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        root.querySelector('#f-dry_mass_g')?.focus({ preventScroll: true });
      }),
    );
    host.querySelectorAll('[data-delete]').forEach((b) =>
      b.addEventListener('click', async () => {
        const r = records.find((x) => x.id === b.dataset.delete);
        const yes = await confirmDialog({
          title: 'Hapus data pengujian ini?',
          message: `Data modul <strong>${esc(r.modules?.module_code ?? '')}</strong> siklus <strong>${r.cycle_number}</strong> tanggal ${esc(fmtDate(r.test_date))} akan dihapus beserta catatan internalnya. Tindakan ini tidak dapat dibatalkan.`,
          confirmLabel: 'Hapus data pengujian',
        });
        if (!yes) return;
        try {
          await deleteRecord(r.id);
          toast.success('Data pengujian dihapus.');
          if (editing?.id === r.id) editing = null;
          records = await listRecords();
          notes = await getNotes(records.map((x) => x.id));
          drawForm();
          drawTable();
        } catch (err) {
          toast.error(err.message);
        }
      }),
    );
  }

  await load();
}
