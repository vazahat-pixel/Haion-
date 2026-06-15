import { create } from 'zustand';
import { getStorageItem, setStorageItem } from '@/utils/storage';

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(resolved) {
  document.documentElement.setAttribute('data-theme', resolved);
}

const stored = getStorageItem('theme') || 'light';
const resolved = resolveTheme(stored);
applyTheme(resolved);

export const useThemeStore = create((set) => ({
  theme: stored,
  resolvedTheme: resolved,

  setTheme: (theme) => {
    const resolvedTheme = resolveTheme(theme);
    setStorageItem('theme', theme);
    applyTheme(resolvedTheme);
    set({ theme, resolvedTheme });
  },

  toggleTheme: () => {
    const current = useThemeStore.getState();
    const next = current.resolvedTheme === 'light' ? 'dark' : 'light';
    current.setTheme(next);
  },

  resolveSystemTheme: () => {
    const { theme } = useThemeStore.getState();
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    set({ resolvedTheme });
  },
}));
