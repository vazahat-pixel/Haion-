import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { GeneralSettingsForm } from '@/modules/settings';

export default function GeneralSettingsPage() {
  return (
    <SettingsSubnav title="General Settings" subtitle="Company profile and branding">
      <GeneralSettingsForm />
    </SettingsSubnav>
  );
}
