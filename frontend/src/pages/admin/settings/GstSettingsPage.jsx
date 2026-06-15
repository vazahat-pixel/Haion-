import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { GstSettingsForm } from '@/modules/settings';

export default function GstSettingsPage() {
  return (
    <SettingsSubnav title="GST Configuration" subtitle="Tax rates and company GSTIN">
      <GstSettingsForm />
    </SettingsSubnav>
  );
}
