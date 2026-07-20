import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { usePermissionStore } from '@/store/permission.store';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { env } from '@/config/env';
import { syncPermissionsFromUser } from '@/utils/syncPermissions';
import { LoadingState } from '@/components/feedback/LoadingState';

export function PermissionGuard({
  children,
  require,
  requireAll,
  requireAny,
  fallback = null,
  redirectTo,
}) {
  const { user } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();
  const permissionCount = usePermissionStore((s) => {
    const perms = s.permissions;
    if (!perms) return 0;
    if (perms instanceof Set) return perms.size;
    if (Array.isArray(perms)) return perms.length;
    return 0;
  });

  useEffect(() => {
    if (user?.role && permissionCount === 0) {
      syncPermissionsFromUser();
    }
  }, [user?.role, permissionCount]);

  if (user?.role === ROLES.MASTER_ADMIN || (env.useMockApi && env.isDev)) {
    return children;
  }

  // Avoid blank screen while permissions rehydrate from localStorage.
  if (user?.role && permissionCount === 0) {
    return <LoadingState message="Checking permissions..." />;
  }

  let allowed = true;

  if (require) allowed = hasPermission(require);
  if (requireAll?.length) allowed = allowed && hasAllPermissions(requireAll);
  if (requireAny?.length) allowed = allowed && hasAnyPermission(requireAny);

  if (!allowed) {
    if (redirectTo) return <Navigate to={redirectTo || ROUTES.UNAUTHORIZED} replace />;
    return fallback;
  }

  return children;
}
