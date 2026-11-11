// src/lib/theme.js
// Light / dark theme. The choice is saved on this device; until the user picks
// one, SeaScan follows the device setting. index.html applies it before the
// page paints, so there is no flash of the wrong theme.
import { useSyncExternalStore } from 'react';

const KEY = 'seascan-theme';
const listeners = new Set();

const systemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

function savedTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f1f5f9' : '#020617');
  listeners.forEach((fn) => fn());
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme); } catch { /* not saved, still applied */ }
  apply(theme);
}

export function toggleTheme() {
  setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

// Follow the device setting while the user has not chosen a theme.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (!savedTheme()) apply(systemTheme());
  });
}

export function useTheme() {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getTheme,
    () => 'dark',
  );
}
