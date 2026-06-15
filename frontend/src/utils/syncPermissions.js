import { useAuthStore } from '@/store/auth.store';
import { usePermissionStore } from '@/store/permission.store';
import { ROLE_PERMISSIONS } from '@/config/permissions.config';

export function syncPermissionsFromUser() {
  const user = useAuthStore.getState().user;
  const { setPermissions, clearPermissions } = usePermissionStore.getState();

  if (!user) {
    clearPermissions();
    return;
  }

  const permissions = user.permissions?.length
    ? user.permissions
    : ROLE_PERMISSIONS[user.role] || [];

  setPermissions(permissions, user.role);
}
