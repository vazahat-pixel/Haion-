import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ServiceLayout from '@/layouts/ServiceLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { ServicePanelSkeleton } from './ServicePanelSkeleton';

const ServiceDashboardPage = lazy(() => import('@/pages/service/ServiceDashboardPage'));
const ComplaintListPage = lazy(() => import('@/pages/service/complaints/ComplaintListPage'));
const ComplaintNewPage = lazy(() => import('@/pages/service/complaints/ComplaintNewPage'));
const ComplaintDetailPage = lazy(() => import('@/pages/service/complaints/ComplaintDetailPage'));
const SparePartsListPage = lazy(() => import('@/pages/service/spare-parts/SparePartsListPage'));
const SparePartsDetailPage = lazy(() => import('@/pages/service/spare-parts/SparePartsDetailPage'));
const DefectiveReturnsListPage = lazy(() => import('@/pages/service/defective-returns/DefectiveReturnsListPage'));
const DefectiveReturnsDetailPage = lazy(() => import('@/pages/service/defective-returns/DefectiveReturnsDetailPage'));

const PANEL_ROLES = [ROLES.CUSTOMER_SUPPORT, ROLES.SERVICE_CENTER];

export default function ServiceRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={PANEL_ROLES}>
        <Suspense fallback={<ServicePanelSkeleton />}>
          <Routes>
            <Route element={<ServiceLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PermissionGuard require={PERMISSIONS.SERVICE_DASHBOARD} redirectTo="/unauthorized"><ServiceDashboardPage /></PermissionGuard>} />
              <Route path="complaints" element={<ComplaintListPage />} />
              <Route path="complaints/new" element={<PermissionGuard require={PERMISSIONS.COMPLAINTS_CREATE} redirectTo="/unauthorized"><ComplaintNewPage /></PermissionGuard>} />
              <Route path="complaints/:ticketId" element={<ComplaintDetailPage />} />
              <Route path="spare-parts" element={<PermissionGuard require={PERMISSIONS.SPARES_READ} redirectTo="/unauthorized"><SparePartsListPage /></PermissionGuard>} />
              <Route path="spare-parts/:id" element={<PermissionGuard require={PERMISSIONS.SPARES_READ} redirectTo="/unauthorized"><SparePartsDetailPage /></PermissionGuard>} />
              <Route path="defective-returns" element={<PermissionGuard require={PERMISSIONS.RETURNS_READ} redirectTo="/unauthorized"><DefectiveReturnsListPage /></PermissionGuard>} />
              <Route path="defective-returns/:id" element={<PermissionGuard require={PERMISSIONS.RETURNS_READ} redirectTo="/unauthorized"><DefectiveReturnsDetailPage /></PermissionGuard>} />
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
