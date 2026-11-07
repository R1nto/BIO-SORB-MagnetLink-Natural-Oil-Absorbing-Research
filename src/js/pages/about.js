import { pageHeader } from '../components/navbar.js';
import { SITE } from '../config/site.js';
import { esc } from '../utils/formatters.js';

// Halaman ini hanya menjelaskan konsep dan tujuan. Tidak ada klaim hasil atau efektivitas.
export function render(root) {
  const { team } = SITE;
  const hasTeam = team.name || team.school || team.members.length;

  root.innerHTML = `
    ${pageHeader({ title: 'Tentang BIO-SORB MagnetLink', subtitle: `Proyek penelitian untuk ${SITE.event}.` })}
    <div class="stack" style="max-width:820px">
      <section class="card">
        <h2>Apa itu BIO-SORB MagnetLink?</h2>
        <p style="margin-top:12px">BIO-SORB MagnetLink adalah modul penyerap minyak berbahan dasar serat sabut kelapa (<em>coconut coir</em>). Serat ditempatkan dalam kantong berbahan mesh. Setiap modul memiliki konektor magnet pada dua sisi yang berlawanan sehingga beberapa modul dapat disambungkan menjadi satu rangkaian.</p>
        <p class="muted">Website ini adalah alat pendukung penelitian untuk mencatat, mengolah, membandingkan, dan menampilkan data eksperimen. Website ini bukan produk fisik BIO-SORB itu sendiri.</p>
      </section>

      <section class="card">
        <h2>Latar belakang masalah lingkungan</h2>
        <p style="margin-top:12px">Tumpahan minyak di perairan merusak ekosistem air dan sulit dibersihkan. Penelitian ini menelaah apakah bahan alami yang mudah didapat dapat dipakai sebagai penyerap minyak. Pertanyaan itu dijawab lewat pengukuran, bukan dugaan.</p>
      </section>

      <div class="grid-2">
        <section class="card">
          <h2>Serat sabut kelapa</h2>
          <p style="margin-top:12px">Serat sabut kelapa adalah <strong>material penyerap</strong> dalam modul. Kantong mesh menahan serat tetap pada tempatnya dan memudahkan modul diangkat kembali.</p>
        </section>
        <section class="card">
          <h2>Konektor magnet</h2>
          <p style="margin-top:12px">Magnet hanya berfungsi sebagai <strong>konektor antarmodul</strong>. Magnet bukan bahan penyerap dan tidak ikut dihitung sebagai penyerap minyak.</p>
        </section>
      </div>

      <section class="card">
        <h2>Tujuan penelitian</h2>
        <ul class="plain-list" style="margin-top:12px">
          <li>Mengukur kapasitas penyerapan minyak serat sabut kelapa pada modul BIO-SORB.</li>
          <li>Membandingkan modul dengan konektor magnet dan modul standar tanpa magnet.</li>
          <li>Mengamati perubahan hasil pada pengujian berulang (siklus).</li>
        </ul>
      </section>

      <section class="card">
        <h2>Cara data dihitung</h2>
        <p style="margin-top:12px"><strong>Q = massa minyak tertahan (g) ÷ massa kering material (g)</strong></p>
        <p class="muted">Q hanya dihitung bila massa minyak diukur terpisah. Jika minyak dan air belum dapat dipisahkan, website hanya menampilkan perubahan massa total dan tidak menyebutnya kapasitas minyak.</p>
        <div class="callout callout--warn" style="margin-top:12px"><strong>Catatan</strong>Hasil yang tampil di website berasal dari data eksperimen yang dimasukkan tim. Efektivitas produk baru dapat disimpulkan setelah data yang cukup dikumpulkan dan dianalisis.</div>
      </section>

      <section class="card">
        <h2>Tim peneliti</h2>
        ${
          hasTeam
            ? `<dl class="meta-list" style="margin-top:12px">
                ${team.name ? `<dt>Tim</dt><dd>${esc(team.name)}</dd>` : ''}
                ${team.school ? `<dt>Sekolah</dt><dd>${esc(team.school)}</dd>` : ''}
                ${team.members.length ? `<dt>Anggota</dt><dd>${team.members.map(esc).join(', ')}</dd>` : ''}
              </dl>`
            : '<p class="muted" style="margin-top:12px">Identitas tim akan ditambahkan. Ubah di <code>src/js/config/site.js</code>.</p>'
        }
      </section>
    </div>`;
}
