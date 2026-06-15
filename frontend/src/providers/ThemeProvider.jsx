import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';

export function ThemeProvider({ children }) {
  const resolveSystemTheme = useThemeStore((s) => s.resolveSystemTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => resolveSystemTheme();
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [resolveSystemTheme]);

  return children;
}
