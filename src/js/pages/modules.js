import { listModules, searchModules, createModule, updateModule, deleteModule } from '../services/module.service.js';
import { pageHeader } from '../components/navbar.js';
import { dataTable } from '../components/data-table.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { emptyState, errorState, loadingBlock } from '../components/states.js';
import { icon } from '../../assets/icons/icons.js';
import { validateModule } from '../utils/validators.js';
import { debounce } from '../utils/dom.js';
import { esc, fmtDate, connectorLabel, truncate } from '../utils/formatters.js';

const FIELDS = ['module_code', 'design_type', 'connector_type', 'made_on', 'notes'];

function openModuleForm(existing, onSaved) {
  const m = existing ?? { module_code: '', design_type: '', connector_type: 'standard', made_on: '', notes: '' };
  const dlg = openModal({
    title: existing ? 'Ubah modul' : 'Tambah modul',
    body: `
      <form id="mod-form" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="m-code">Kode modul</label>
            <input class="input" id="m-code" name="module_code" maxlength="30" value="${esc(m.module_code)}" aria-describedby="err-module_code hint-code" />
            <p class="field__hint" id="hint-code">Contoh: M-01. Kode harus unik.</p>
            <p class="field__error" id="err-module_code" role="alert"></p>
          </div>
          <div class="field">
            <label for="m-conn">Jenis konektor</label>
            <select class="select" id="m-conn" name="connector_type" aria-describedby="err-connector_type">
              <option value="magnet" ${m.connector_type === 'magnet' ? 'selected' : ''}>Magnet</option>
              <option value="standard" ${m.connector_type === 'standard' ? 'selected' : ''}>Standard (tanpa magnet)</option>
            </select>
            <p class="field__error" id="err-connector_type" role="alert"></p>
          </div>
          <div class="field">
            <label for="m-design">Jenis desain <span class="field__opt">(opsional)</span></label>
            <input class="input" id="m-design" name="design_type" maxlength="100" value="${esc(m.design_type ?? '')}" aria-describedby="err-design_type" />
            <p class="field__error" id="err-design_type" role="alert"></p>
          </div>
          <div class="field">
            <label for="m-made">Tanggal pembuatan <span class="field__opt">(opsional)</span></label>
            <input class="input" id="m-made" name="made_on" type="date" value="${esc(m.made_on ?? '')}" aria-describedby="err-made_on" />
            <p class="field__error" id="err-made_on" role="alert"></p>
          </div>
          <div class="field field--wide">
            <label for="m-notes">Catatan modul <span class="field__opt">(opsional)</span></label>
            <textarea class="textarea" id="m-notes" name="notes" maxlength="1000" aria-describedby="err-notes">${esc(m.notes ?? '')}</textarea>
            <p class="field__hint">Misalnya massa serat awal, ukuran kantong, atau kondisi modul.</p>
            <p class="field__error" id="err-notes" role="alert"></p>
          </div>
        </div>
      </form>`,
    footer: `<button type="button" class="btn" data-close>Batal</button>
             <button type="submit" form="mod-form" class="btn btn--primary" data-save>${existing ? 'Simpan perubahan' : 'Simpan modul'}</button>`,
  });
  const form = dlg.querySelector('#mod-form');
  const saveBtn = dlg.querySelector('[data-save]');
  const readInput = () => Object.fromEntries(FIELDS.map((f) => [f, form.elements[f].value]));
  const showErrors = (errors, only) => {
    for (const f of FIELDS) {
      if (only && f !== only) continue;
      dlg.querySelector(`#err-${f}`).textContent = errors[f] ?? '';
      form.elements[f].setAttribute('aria-invalid', errors[f] ? 'true' : 'false');
    }
  };
  // Validasi saat meninggalkan kolom (blur); pesan hilang segera saat pengguna mulai memperbaiki.
  form.addEventListener('focusout', (ev) => {
    const f = ev.target.name;
    if (FIELDS.includes(f)) showErrors(validateModule(readInput()).errors, f);
  });
  form.addEventListener('input', (ev) => {
    if (FIELDS.includes(ev.target.name)) showErrors({}, ev.target.name);
  });
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const { ok, errors, values } = validateModule(readInput());
    showErrors(errors);
    if (!ok) return dlg.querySelector('[aria-invalid="true"]')?.focus();
    saveBtn.disabled = true;
    saveBtn.setAttribute('aria-busy', 'true');
    try {
      if (existing) await updateModule(existing.id, values);
      else await createModule(values);
      toast.success(existing ? 'Perubahan modul tersimpan.' : `Modul ${values.module_code} berhasil ditambahkan.`);
      dlg.close();
      onSaved();
    } catch (err) {
      toast.error(err.message);
      saveBtn.disabled = false;
      saveBtn.removeAttribute('aria-busy');
    }
  });
  form.elements.module_code.focus();
}

export async function render(root, { auth }) {
  let modules = [];
  let term = '';

  async function load() {
    root.innerHTML = pageHeader({ title: 'Modul' }) + loadingBlock('Memuat modul…');
    try {
      modules = await listModules();
    } catch (err) {
      root.innerHTML = pageHeader({ title: 'Modul' }) + errorState(err.message);
      root.querySelector('[data-retry]')?.addEventListener('click', load);
      return;
    }
    drawShell();
  }

  function drawShell() {
    root.innerHTML = `
      ${pageHeader({
        title: 'Modul',
        subtitle: auth.isTeam ? 'Daftar modul BIO-SORB yang diuji.' : 'Modul yang datanya telah dipublikasikan.',
        actionsHtml: auth.isTeam ? `<button type="button" class="btn btn--primary" data-add>${icon('plus', 18)}Tambah modul</button>` : '',
      })}
      <div class="filters no-print">
        <div class="search">
          ${icon('search', 18)}
          <label class="sr-only" for="mod-search">Cari modul</label>
          <input class="input" id="mod-search" type="search" placeholder="Cari kode, desain, atau konektor" value="${esc(term)}" autocomplete="off" />
        </div>
      </div>
      <div class="card card--flush" id="mod-table"></div>`;
    root.querySelector('[data-add]')?.addEventListener('click', () => openModuleForm(null, load));
    root.querySelector('#mod-search').addEventListener(
      'input',
      debounce((e) => {
        term = e.target.value;
        drawTable();
      }, 150),
    );
    drawTable();
  }

  function drawTable() {
    const rows = searchModules(modules, term);
    const host = root.querySelector('#mod-table');
    host.innerHTML = dataTable({
      caption: 'Daftar modul BIO-SORB',
      rows,
      columns: [
        { label: 'Kode', render: (m) => `<strong>${esc(m.module_code)}</strong>` },
        { label: 'Jenis desain', render: (m) => (m.design_type ? esc(m.design_type) : '<span class="muted">—</span>') },
        {
          label: 'Konektor',
          render: (m) =>
            `<span class="badge ${m.connector_type === 'magnet' ? 'badge--info' : ''}">${esc(connectorLabel(m.connector_type))}</span>`,
        },
        { label: 'Dibuat', render: (m) => fmtDate(m.made_on ?? m.created_at) },
        { label: 'Data', num: true, render: (m) => String(m.record_count) },
        ...(auth.isTeam
          ? [
              { label: 'Catatan', className: 'cell-clip', render: (m) => (m.notes ? `<span title="${esc(m.notes)}">${esc(truncate(m.notes, 40))}</span>` : '<span class="muted">—</span>') },
              {
                label: 'Aksi',
                srOnly: true,
                render: (m) => `<span class="row-actions">
                  <button type="button" class="icon-btn" data-edit="${esc(m.id)}" aria-label="Ubah modul ${esc(m.module_code)}" title="Ubah">${icon('edit', 18)}</button>
                  <button type="button" class="icon-btn icon-btn--danger" data-delete="${esc(m.id)}" aria-label="Hapus modul ${esc(m.module_code)}" title="Hapus">${icon('trash', 18)}</button>
                </span>`,
              },
            ]
          : []),
      ],
      emptyHtml: term
        ? emptyState({
            title: `Tidak ada modul yang cocok dengan “${term}”`,
            text: 'Coba kata kunci lain atau hapus pencarian.',
            actionsHtml: '<button type="button" class="btn" data-clear>Hapus pencarian</button>',
          })
        : emptyState({
            title: auth.isTeam ? 'Belum ada modul' : 'Belum ada modul yang datanya dipublikasikan',
            text: auth.isTeam ? 'Daftarkan modul terlebih dahulu agar bisa dipilih saat mencatat data pengujian.' : '',
            actionsHtml: auth.isTeam ? `<button type="button" class="btn btn--primary" data-add>${icon('plus', 18)}Tambah modul</button>` : '',
          }),
    });
    host.querySelector('[data-clear]')?.addEventListener('click', () => {
      term = '';
      drawShell();
    });
    host.querySelector('[data-add]')?.addEventListener('click', () => openModuleForm(null, load));
    host.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openModuleForm(modules.find((m) => m.id === b.dataset.edit), load)),
    );
    host.querySelectorAll('[data-delete]').forEach((b) =>
      b.addEventListener('click', async () => {
        const m = modules.find((x) => x.id === b.dataset.delete);
        if (m.record_count > 0) {
          toast.error(`Modul ${m.module_code} sudah punya ${m.record_count} data pengujian, jadi tidak bisa dihapus. Hapus data pengujiannya dulu.`);
          return;
        }
        const yes = await confirmDialog({
          title: 'Hapus modul ini?',
          message: `Modul <strong>${esc(m.module_code)}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
          confirmLabel: 'Hapus modul',
        });
        if (!yes) return;
        try {
          await deleteModule(m.id);
          toast.success(`Modul ${m.module_code} dihapus.`);
          load();
        } catch (err) {
          toast.error(err.message);
        }
      }),
    );
  }

  await load();
}
