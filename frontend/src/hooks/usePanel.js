import { useAuthStore, selectPanel } from '@/store/auth.store';
import { PANELS } from '@/config/panels.config';

export function usePanel() {
  const panel = useAuthStore(selectPanel);
  const config = panel ? PANELS[panel] : null;

  return { panel, config };
}
