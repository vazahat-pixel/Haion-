import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DealerLayout from '@/layouts/DealerLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { DealerPanelSkeleton } from './DealerPanelSkeleton';

const DealerDashboardPage = lazy(() => import('@/pages/dealer/DealerDashboardPage'));
const DealerInventoryListPage = lazy(() => import('@/pages/dealer/inventory/DealerInventoryListPage'));
const DealerInventoryDetailPage = lazy(() => import('@/pages/dealer/inventory/DealerInventoryDetailPage'));
const DispatchInboxPage = lazy(() => import('@/pages/dealer/dispatches/DispatchInboxPage'));
const DispatchInboxDetailPage = lazy(() => import('@/pages/dealer/dispatches/DispatchInboxDetailPage'));
const DealerGRNListPage = lazy(() => import('@/pages/dealer/grn/DealerGRNListPage'));
const DealerGRNDetailPage = lazy(() => import('@/pages/dealer/grn/DealerGRNDetailPage'));
const CustomerListPage = lazy(() => import('@/pages/dealer/customers/CustomerListPage'));
const CustomerDetailPage = lazy(() => import('@/pages/dealer/customers/CustomerDetailPage'));
const BillingListPage = lazy(() => import('@/pages/dealer/billing/BillingListPage'));
const BillingNewPage = lazy(() => import('@/pages/dealer/billing/BillingNewPage'));
const DealerQuickSalePage = lazy(() => import('@/pages/dealer/sales/DealerQuickSalePage'));
const BillingDetailPage = lazy(() => import('@/pages/dealer/billing/BillingDetailPage'));
const InvoiceListPage = lazy(() => import('@/pages/dealer/invoices/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/dealer/invoices/InvoiceDetailPage'));
const WarrantyListPage = lazy(() => import('@/pages/dealer/warranty/WarrantyListPage'));
const WarrantyDetailPage = lazy(() => import('@/pages/dealer/warranty/WarrantyDetailPage'));
const DealerReportsPage = lazy(() => import('@/pages/dealer/reports/DealerReportsPage'));
const DealerReportDetailPage = lazy(() => import('@/pages/dealer/reports/DealerReportDetailPage'));
const TeamListPage = lazy(() => import('@/pages/dealer/team/TeamListPage'));
const TeamMemberDetailPage = lazy(() => import('@/pages/dealer/team/TeamMemberDetailPage'));
const TeamPerformancePage = lazy(() => import('@/pages/dealer/team/TeamPerformancePage'));

const PANEL_ROLES = [ROLES.DEALER_ADMIN, ROLES.DEALER_SALES];

export default function DealerRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={PANEL_ROLES}>
        <Suspense fallback={<DealerPanelSkeleton />}>
          <Routes>
            <Route element={<DealerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PermissionGuard require={PERMISSIONS.DEALER_DASHBOARD} redirectTo="/unauthorized"><DealerDashboardPage /></PermissionGuard>} />
              <Route path="dispatches" element={<PermissionGuard require={PERMISSIONS.DEALER_DISPATCH_READ} redirectTo="/unauthorized"><DispatchInboxPage /></PermissionGuard>} />
              <Route path="dispatches/:id" element={<PermissionGuard require={PERMISSIONS.DEALER_DISPATCH_READ} redirectTo="/unauthorized"><DispatchInboxDetailPage /></PermissionGuard>} />
              <Route path="grn" element={<PermissionGuard require={PERMISSIONS.DEALER_GRN_READ} redirectTo="/unauthorized"><DealerGRNListPage /></PermissionGuard>} />
              <Route path="grn/:id" element={<PermissionGuard require={PERMISSIONS.DEALER_GRN_READ} redirectTo="/unauthorized"><DealerGRNDetailPage /></PermissionGuard>} />
              <Route path="inventory" element={<DealerInventoryListPage />} />
              <Route path="inventory/:id" element={<DealerInventoryDetailPage />} />
              <Route path="customers" element={<PermissionGuard require={PERMISSIONS.DEALER_CUSTOMERS_READ} redirectTo="/unauthorized"><CustomerListPage /></PermissionGuard>} />
              <Route path="customers/:id" element={<PermissionGuard require={PERMISSIONS.DEALER_CUSTOMERS_READ} redirectTo="/unauthorized"><CustomerDetailPage /></PermissionGuard>} />
              <Route path="billing" element={<BillingListPage />} />
              <Route path="billing/new" element={<PermissionGuard require={PERMISSIONS.BILLING_CREATE} redirectTo="/unauthorized"><BillingNewPage /></PermissionGuard>} />
              <Route path="sales/quick" element={<PermissionGuard require={PERMISSIONS.BILLING_CREATE} redirectTo="/unauthorized"><DealerQuickSalePage /></PermissionGuard>} />
              <Route path="billing/:billId" element={<BillingDetailPage />} />
              <Route path="invoices" element={<InvoiceListPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="warranty" element={<WarrantyListPage />} />
              <Route path="warranty/:id" element={<WarrantyDetailPage />} />
              <Route path="reports" element={<PermissionGuard require={PERMISSIONS.DEALER_REPORTS_READ} redirectTo="/unauthorized"><DealerReportsPage /></PermissionGuard>} />
              <Route path="reports/:id" element={<PermissionGuard require={PERMISSIONS.DEALER_REPORTS_READ} redirectTo="/unauthorized"><DealerReportDetailPage /></PermissionGuard>} />
              <Route path="team" element={<PermissionGuard require={PERMISSIONS.DEALER_TEAM_READ} redirectTo="/unauthorized"><TeamListPage /></PermissionGuard>} />
              <Route path="team/performance" element={<PermissionGuard require={PERMISSIONS.DEALER_TEAM_READ} redirectTo="/unauthorized"><TeamPerformancePage /></PermissionGuard>} />
              <Route path="team/:id" element={<PermissionGuard require={PERMISSIONS.DEALER_TEAM_READ} redirectTo="/unauthorized"><TeamMemberDetailPage /></PermissionGuard>} />
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
