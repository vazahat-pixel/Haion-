import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { LoadingState } from '@/components/feedback/LoadingState';
import AuthLayout from '@/layouts/AuthLayout';
import PublicLayout from '@/layouts/PublicLayout';

const AdminRoutes = lazy(() => import('@/routes/admin/AdminRoutes'));
const DealerRoutes = lazy(() => import('@/routes/dealer/DealerRoutes'));
const EmployeeRoutes = lazy(() => import('@/routes/employee/EmployeeRoutes'));
const ServiceRoutes = lazy(() => import('@/routes/service/ServiceRoutes'));
const CustomerRoutes = lazy(() => import('@/routes/customer/CustomerRoutes'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const SessionExpiredPage = lazy(() => import('@/pages/auth/SessionExpiredPage'));
const UnauthorizedPage = lazy(() => import('@/pages/shared/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('@/pages/shared/NotFoundPage'));
const MaintenancePage = lazy(() => import('@/pages/shared/MaintenancePage'));
const ServerErrorPage = lazy(() => import('@/pages/shared/ServerErrorPage'));

function RootRedirect() {
  const { isAuthenticated, user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingState message="Loading..." fullPage />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH_LOGIN} replace />;
  }

  return <Navigate to={ROLE_HOME_ROUTE[user?.role] || ROUTES.ADMIN_DASHBOARD} replace />;
}

function PanelFallback() {
  return <LoadingState message="Loading panel..." fullPage />;
}

export function Router() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/session-expired" element={<SessionExpiredPage />} />
        </Route>

        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/dealer/*" element={<DealerRoutes />} />
        <Route path="/employee/*" element={<EmployeeRoutes />} />
        <Route path="/service/*" element={<ServiceRoutes />} />
        <Route path="/customer/*" element={<CustomerRoutes />} />

        <Route element={<PublicLayout />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/server-error" element={<ServerErrorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Suspense>
  );
}
