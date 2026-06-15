import { SettingsSubnav } from '@/components/layout/SettingsSubnav';
import { RolesPermissionsPanel } from '@/modules/rbac/RolesPermissionsPanel';

export default function RolesPermissionsPage() {
  return (
    <SettingsSubnav title="Roles & Permissions" subtitle="Manage access control for each role">
      <RolesPermissionsPanel />
    </SettingsSubnav>
  );
}
