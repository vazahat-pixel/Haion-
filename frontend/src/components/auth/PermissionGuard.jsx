import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { env } from '@/config/env';

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

  if (user?.role === ROLES.MASTER_ADMIN || (env.useMockApi && env.isDev)) {
    return children;
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
