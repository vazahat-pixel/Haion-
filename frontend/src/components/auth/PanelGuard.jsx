import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME_ROUTE, ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { env } from '@/config/env';

export function PanelGuard({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.AUTH_LOGIN} replace />;
  }

  const canAccess =
    user.role === ROLES.MASTER_ADMIN ||
    allowedRoles.includes(user.role) ||
    (env.useMockApi && env.isDev);

  if (!canAccess) {
    const home = ROLE_HOME_ROUTE[user.role] || ROUTES.UNAUTHORIZED;
    return <Navigate to={home} replace />;
  }

  return children;
}
