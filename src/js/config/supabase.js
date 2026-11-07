import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isMissing = (v) => !v || /x{6,}/i.test(v);

/** Mendeteksi key rahasia yang salah dipasang di frontend. */
function isSecretKey(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('sb_secret_')) return true;
  const part = value.split('.')[1];
  if (!part) return false;
  try {
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

export const hasSecretKey = isSecretKey(key);
export const isConfigured = !isMissing(url) && !isMissing(key) && !hasSecretKey;

/** null bila belum dikonfigurasi; halaman akan menampilkan petunjuk pengaturan. */
export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;

export function db() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  return supabase;
}
