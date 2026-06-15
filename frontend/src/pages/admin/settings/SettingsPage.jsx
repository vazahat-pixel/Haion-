import { PageShell } from '@/components/layout/PageShell';
import { SettingsHub } from '@/modules/settings';

export default function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="System configuration">
      <SettingsHub />
    </PageShell>
  );
}
