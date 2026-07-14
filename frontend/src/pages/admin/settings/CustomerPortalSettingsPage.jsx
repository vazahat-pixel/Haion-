import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { CustomerPortalSettingsForm } from '@/modules/settings';

export default function CustomerPortalSettingsPage() {
  return (
    <SettingsSubnav title="Customer Portal" subtitle="Branding, features & live app experience">
      <CustomerPortalSettingsForm />
    </SettingsSubnav>
  );
}
