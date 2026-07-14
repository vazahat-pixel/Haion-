import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { CustomerPanelSkeleton } from './CustomerPanelSkeleton';

const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'));
const CustomerProductsPage = lazy(() => import('@/pages/customer/products/CustomerProductsPage'));
const CustomerProductDetailPage = lazy(() => import('@/pages/customer/products/CustomerProductDetailPage'));
const OrderListPage = lazy(() => import('@/pages/customer/orders/OrderListPage'));
const OrderDetailPage = lazy(() => import('@/pages/customer/orders/OrderDetailPage'));
const CustomerWarrantyListPage = lazy(() => import('@/pages/customer/warranty/CustomerWarrantyListPage'));
const CustomerWarrantyLookupPage = lazy(() => import('@/pages/customer/warranty/CustomerWarrantyLookupPage'));
const CustomerWarrantyDetailPage = lazy(() => import('@/pages/customer/warranty/CustomerWarrantyDetailPage'));
const ServiceRequestListPage = lazy(() => import('@/pages/customer/service-requests/ServiceRequestListPage'));
const ServiceRequestNewPage = lazy(() => import('@/pages/customer/service-requests/ServiceRequestNewPage'));
const ServiceRequestDetailPage = lazy(() => import('@/pages/customer/service-requests/ServiceRequestDetailPage'));
const CustomerNotificationsPage = lazy(() => import('@/pages/customer/CustomerNotificationsPage'));

const PANEL_ROLES = [ROLES.CUSTOMER];

export default function CustomerRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={PANEL_ROLES}>
        <Suspense fallback={<CustomerPanelSkeleton />}>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="products" element={<CustomerProductsPage />} />
              <Route path="products/:id" element={<CustomerProductDetailPage />} />
              <Route path="orders" element={<OrderListPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="warranty" element={<CustomerWarrantyListPage />} />
              <Route path="warranty/lookup" element={<CustomerWarrantyLookupPage />} />
              <Route path="warranty/:id" element={<CustomerWarrantyDetailPage />} />
              <Route path="service-requests" element={<ServiceRequestListPage />} />
              <Route path="service-requests/new" element={<PermissionGuard require={PERMISSIONS.SERVICE_REQUESTS_CREATE} redirectTo="/unauthorized"><ServiceRequestNewPage /></PermissionGuard>} />
              <Route path="service-requests/:id" element={<ServiceRequestDetailPage />} />
              <Route path="notifications" element={<CustomerNotificationsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
