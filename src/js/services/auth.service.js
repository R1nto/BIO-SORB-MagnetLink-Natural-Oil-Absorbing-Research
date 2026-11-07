import { supabase, isConfigured } from '../config/supabase.js';
import { AppError } from '../utils/errors.js';

/** Status login global. `isTeam` hanya untuk mengatur tampilan; keamanan sebenarnya ada di RLS. */
export const authState = { ready: false, session: null, user: null, isTeam: false };

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(authState));

export function onAuthChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function checkTeam(userId) {
  if (!supabase || !userId) return false;
  const { data, error } = await supabase.from('team_members').select('user_id').eq('user_id', userId).maybeSingle();
  return !error && Boolean(data);
}

async function applySession(session) {
  authState.session = session;
  authState.user = session?.user ?? null;
  authState.isTeam = session ? await checkTeam(session.user.id) : false;
  authState.ready = true;
  notify();
}

let initPromise = null;

/** Aman dipanggil berkali-kali (landing, login, dan dashboard berbagi satu inisialisasi). */
export function initAuth() {
  return (initPromise ??= doInit());
}

async function doInit() {
  if (!isConfigured) {
    authState.ready = true;
    return;
  }
  const { data } = await supabase.auth.getSession();
  await applySession(data.session);

  // Jangan memanggil Supabase langsung di dalam callback ini (bisa deadlock); tunda dengan setTimeout.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') return;
    setTimeout(() => applySession(session), 0);
  });
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new AppError('Email atau kata sandi tidak cocok. Periksa lagi, atau minta anggota tim lain mengatur ulang akun Anda di Supabase.');
    }
    if (/email not confirmed/i.test(error.message)) {
      throw new AppError('Email akun ini belum dikonfirmasi. Konfirmasi akun di Supabase (Authentication > Users).');
    }
    throw new AppError('Tidak dapat masuk saat ini. Periksa koneksi internet lalu coba lagi.', error);
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Membuat akun baru. Akun baru BELUM punya akses data sampai diaktifkan dengan kode undangan. */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      throw new AppError('Email ini sudah terdaftar. Silakan masuk, atau pakai email lain.');
    }
    if (/signups? not allowed|signup is disabled|signups are disabled/i.test(error.message)) {
      throw new AppError('Pendaftaran belum diaktifkan di Supabase. Aktifkan "Allow new users to sign up" di Authentication → Sign In / Providers.');
    }
    if (/password/i.test(error.message)) throw new AppError('Kata sandi ditolak oleh server: terlalu lemah atau terlalu pendek. Gunakan minimal 10 karakter.');
    if (/rate limit|too many/i.test(error.message)) throw new AppError('Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.');
    throw new AppError('Pendaftaran gagal. Periksa koneksi internet lalu coba lagi.', error);
  }
  // Supabase mengembalikan user tanpa identities bila email sudah terdaftar (anti-enumerasi).
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new AppError('Email ini sudah terdaftar. Silakan masuk, atau pakai email lain.');
  }
  return { needsEmailConfirmation: !data.session };
}

const ACTIVATION_MESSAGES = {
  invalid: 'Kode undangan salah. Periksa lagi kode dari anggota tim.',
  full: 'Kuota anggota tim (2 akun) sudah penuh.',
  locked: 'Pendaftaran terkunci karena terlalu banyak kode salah. Minta anggota tim membukanya lewat SQL Editor.',
  not_configured: 'Kode undangan belum diatur. Jalankan 003_team_registration.sql lalu set_team_invite_code di Supabase.',
};

/** Menukar kode undangan menjadi keanggotaan tim, lalu memuat ulang status login. */
export async function activateTeam(code) {
  const { data, error } = await supabase.rpc('register_team_member', { invite_code: code.trim() });
  if (error) {
    if (/does not exist|could not find the function|PGRST202/i.test(`${error.message} ${error.code}`)) {
      throw new AppError('Fitur pendaftaran belum dipasang di database. Jalankan 003_team_registration.sql di Supabase.');
    }
    throw new AppError('Aktivasi gagal. Periksa koneksi internet lalu coba lagi.', error);
  }
  if (data !== 'ok') throw new AppError(ACTIVATION_MESSAGES[data] ?? 'Aktivasi gagal. Coba lagi.');
  const { data: s } = await supabase.auth.getSession();
  await applySession(s.session);
}
