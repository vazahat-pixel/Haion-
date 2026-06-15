import { usePermissionStore } from '@/store/permission.store';

export function usePermission() {
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission);
  const hasAllPermissions = usePermissionStore((s) => s.hasAllPermissions);
  const role = usePermissionStore((s) => s.role);

  return { hasPermission, hasAnyPermission, hasAllPermissions, role };
}
