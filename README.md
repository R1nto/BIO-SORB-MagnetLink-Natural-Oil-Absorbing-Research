# BIO-SORB MagnetLink

Vanilla JavaScript + Vite + Supabase + Vercel. Landing page, public research dashboard, and team login in one domain.

The current UI uses a cream/leaf-green visual system, the Koko mascot, a connected modular-pad hero illustration, research cards, a dashboard preview, and responsive layouts. The generated dashboard image is explicitly labelled as a UI preview, not experimental data.

## Run locally

Use Node.js 20.19+ or 22.12+ (Node 22.16 is pinned in `.nvmrc`).

```bash
npm install
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

If Supabase is not configured, the public pages still render with empty states. No sample experiment values are presented as real results.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/001_initial_schema.sql` in SQL Editor.
3. Create exactly two team accounts under Authentication → Users.
4. For each created account, copy its UUID and add a membership row:

```sql
insert into public.team_members (user_id, display_name)
values
  ('UUID_ANGGOTA_1', 'Anggota 1'),
  ('UUID_ANGGOTA_2', 'Anggota 2');
```

5. Create at least one experiment from the Supabase dashboard before entering test records. Set `is_published = true` only after the team has reviewed the data. The web interface keeps new test records as draft by default.
6. Add the Supabase Project URL and anon/publishable key to `.env`.

The browser only uses the anon/publishable key. Never put a `service_role` or secret key in frontend environment variables. RLS is enabled on all API tables; public users can only read published records, while write access requires membership in `team_members`.

## Deploy to Vercel

- Push the project to GitHub.
- Import the repository in Vercel.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Vercel Environment Variables. The app also accepts the legacy `VITE_SUPABASE_ANON_KEY` variable name for older projects.
- Redeploy after changing environment variables.

`vercel.json` routes app paths back to `index.html` so `/app#/dashboard` and `/login` work on refresh.

## Research calculation note

Oil capacity is calculated only from an independently measured oil mass: `Q = oil_retained_g / dry_mass_g`. Do not infer oil mass from the total wet-mass increase when water may also be retained.

## Registrasi & data contoh
- Halaman `/register`: email + kata sandi. **Terbuka untuk umum**: siapa pun yang mendaftar/masuk otomatis jadi anggota tim (bisa menambah & mengubah data). Jalankan sekali `supabase/SETUP_REGISTRASI.sql` di SQL Editor.
- Dashboard menampilkan **data contoh** (`src/demo.js`) bila database kosong, dengan banner "bukan hasil penelitian". Otomatis hilang saat data asli ada; bisa disembunyikan lewat tombol di banner. Data contoh tidak pernah ditulis ke database.
