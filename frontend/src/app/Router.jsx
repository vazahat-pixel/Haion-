import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { LoadingState } from '@/components/feedback/LoadingState';
import AuthLayout from '@/layouts/AuthLayout';
import PublicLayout from '@/layouts/PublicLayout';
import PublicCustomerLayout from '@/layouts/PublicCustomerLayout';
import LandingLayout from '@/layouts/LandingLayout';

const AdminRoutes = lazy(() => import('@/routes/admin/AdminRoutes'));
const DealerRoutes = lazy(() => import('@/routes/dealer/DealerRoutes'));
const EmployeeRoutes = lazy(() => import('@/routes/employee/EmployeeRoutes'));
const ServiceRoutes = lazy(() => import('@/routes/service/ServiceRoutes'));
const CustomerRoutes = lazy(() => import('@/routes/customer/CustomerRoutes'));

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const PublicComplaintPage = lazy(() => import('@/pages/public/PublicComplaintPage'));
const PublicWarrantyCheckPage = lazy(() => import('@/pages/public/PublicWarrantyCheckPage'));
const CustomerAccessPage = lazy(() => import('@/pages/public/CustomerAccessPage'));
const CustomerAccessHubPage = lazy(() => import('@/pages/public/CustomerAccessHubPage'));
const PublicCustomerProductsPage = lazy(() => import('@/pages/public/PublicCustomerProductsPage'));
const SessionExpiredPage = lazy(() => import('@/pages/auth/SessionExpiredPage'));
const UnauthorizedPage = lazy(() => import('@/pages/shared/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('@/pages/shared/NotFoundPage'));
const MaintenancePage = lazy(() => import('@/pages/shared/MaintenancePage'));
const ServerErrorPage = lazy(() => import('@/pages/shared/ServerErrorPage'));

function PublicHome() {
  const { isAuthenticated, user, isInitializing } = useAuth();

  if (isInitializing) return <LoadingState message="Loading..." fullPage />;

  if (isAuthenticated) {
    return <Navigate to={ROLE_HOME_ROUTE[user?.role] || ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return <LandingPage />;
}

function PanelFallback() {
  return <LoadingState message="Loading panel..." fullPage />;
}

export function Router() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<PublicHome />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
        </Route>

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

        <Route element={<PublicLayout />}>
          <Route path="/customer/access" element={<CustomerAccessPage />} />
        </Route>

        <Route element={<PublicCustomerLayout />}>
          <Route path="/customer/access/hub" element={<CustomerAccessHubPage />} />
          <Route path="/customer/access/products" element={<PublicCustomerProductsPage />} />
        </Route>

        <Route path="/customer/*" element={<CustomerRoutes />} />

        <Route element={<PublicLayout />}>
          <Route path="/support/complaint" element={<PublicComplaintPage />} />
          <Route path="/warranty/check" element={<PublicWarrantyCheckPage />} />
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
