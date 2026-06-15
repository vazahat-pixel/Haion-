import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { NotificationSettingsForm } from '@/modules/settings';

export default function NotificationSettingsPage() {
  return (
    <SettingsSubnav title="Alert Preferences" subtitle="Email and SMS notification rules">
      <NotificationSettingsForm />
    </SettingsSubnav>
  );
}
