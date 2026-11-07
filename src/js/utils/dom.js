export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Preferensi ringan per-browser (aman terhadap localStorage yang diblokir). */
export const prefs = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`biosorb:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`biosorb:${key}`, JSON.stringify(value));
    } catch {
      /* diabaikan: preferensi hanyalah kenyamanan */
    }
  },
};
