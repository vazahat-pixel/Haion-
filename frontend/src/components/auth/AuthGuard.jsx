import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ROUTES } from '@/constants/routes';

export function AuthGuard({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState message="Restoring session..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH_LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
