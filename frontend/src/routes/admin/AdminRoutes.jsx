import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { AdminPanelSkeleton } from './AdminPanelSkeleton';

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const ProductListPage = lazy(() => import('@/pages/admin/products/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/pages/admin/products/ProductDetailPage'));
const CategoryListPage = lazy(() => import('@/pages/admin/categories/CategoryListPage'));
const CategoryDetailPage = lazy(() => import('@/pages/admin/categories/CategoryDetailPage'));
const BrandListPage = lazy(() => import('@/pages/admin/brands/BrandListPage'));
const BrandDetailPage = lazy(() => import('@/pages/admin/brands/BrandDetailPage'));
const ProductTierListPage = lazy(() => import('@/pages/admin/product-tiers/ProductTierListPage'));
const ProductTierDetailPage = lazy(() => import('@/pages/admin/product-tiers/ProductTierDetailPage'));
const PricingListPage = lazy(() => import('@/pages/admin/pricing/PricingListPage'));
const PricingDetailPage = lazy(() => import('@/pages/admin/pricing/PricingDetailPage'));
const WarehouseListPage = lazy(() => import('@/pages/admin/warehouses/WarehouseListPage'));
const WarehouseDetailPage = lazy(() => import('@/pages/admin/warehouses/WarehouseDetailPage'));
const GRNPage = lazy(() => import('@/pages/admin/warehouses/GRNPage'));
const GRNMonitoringPage = lazy(() => import('@/pages/admin/grn/GRNMonitoringPage'));
const GRNDetailPage = lazy(() => import('@/pages/admin/grn/GRNDetailPage'));
const DispatchListPage = lazy(() => import('@/pages/admin/dispatch/DispatchListPage'));
const DispatchDetailPage = lazy(() => import('@/pages/admin/dispatch/DispatchDetailPage'));
const InventoryListPage = lazy(() => import('@/pages/admin/inventory/InventoryListPage'));
const InventoryDetailPage = lazy(() => import('@/pages/admin/inventory/InventoryDetailPage'));
const DealerListPage = lazy(() => import('@/pages/admin/dealers/DealerListPage'));
const DealerDetailPage = lazy(() => import('@/pages/admin/dealers/DealerDetailPage'));
const DealerOnboardingPage = lazy(() => import('@/pages/admin/dealers/DealerOnboardingPage'));
const EmployeeListPage = lazy(() => import('@/pages/admin/employees/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('@/pages/admin/employees/EmployeeDetailPage'));
const ExpenseListPage = lazy(() => import('@/pages/admin/expenses/ExpenseListPage'));
const ExpenseDetailPage = lazy(() => import('@/pages/admin/expenses/ExpenseDetailPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/reports/AdminReportsPage'));
const ReportDetailPage = lazy(() => import('@/pages/admin/reports/ReportDetailPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/settings/SettingsPage'));
const GeneralSettingsPage = lazy(() => import('@/pages/admin/settings/GeneralSettingsPage'));
const GstSettingsPage = lazy(() => import('@/pages/admin/settings/GstSettingsPage'));
const NotificationSettingsPage = lazy(() => import('@/pages/admin/settings/NotificationSettingsPage'));
const RolesPermissionsPage = lazy(() => import('@/pages/admin/settings/RolesPermissionsPage'));
const AuditLogPage = lazy(() => import('@/pages/admin/audit-logs/AuditLogPage'));
const ApprovalListPage = lazy(() => import('@/pages/admin/approvals/ApprovalListPage'));
const ApprovalDetailPage = lazy(() => import('@/pages/admin/approvals/ApprovalDetailPage'));

const ADMIN_ROLES = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER];

export default function AdminRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={ADMIN_ROLES}>
        <Suspense fallback={<AdminPanelSkeleton />}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PermissionGuard require={PERMISSIONS.ANALYTICS_READ} redirectTo="/unauthorized"><AdminDashboardPage /></PermissionGuard>} />
              <Route path="products" element={<PermissionGuard require={PERMISSIONS.PRODUCTS_READ} redirectTo="/unauthorized"><ProductListPage /></PermissionGuard>} />
              <Route path="products/:id" element={<PermissionGuard require={PERMISSIONS.PRODUCTS_READ} redirectTo="/unauthorized"><ProductDetailPage /></PermissionGuard>} />
              <Route path="categories" element={<PermissionGuard require={PERMISSIONS.CATEGORIES_READ} redirectTo="/unauthorized"><CategoryListPage /></PermissionGuard>} />
              <Route path="categories/:id" element={<PermissionGuard require={PERMISSIONS.CATEGORIES_READ} redirectTo="/unauthorized"><CategoryDetailPage /></PermissionGuard>} />
              <Route path="brands" element={<PermissionGuard require={PERMISSIONS.BRANDS_READ} redirectTo="/unauthorized"><BrandListPage /></PermissionGuard>} />
              <Route path="brands/:id" element={<PermissionGuard require={PERMISSIONS.BRANDS_READ} redirectTo="/unauthorized"><BrandDetailPage /></PermissionGuard>} />
              <Route path="product-tiers" element={<PermissionGuard require={PERMISSIONS.PRICING_READ} redirectTo="/unauthorized"><ProductTierListPage /></PermissionGuard>} />
              <Route path="product-tiers/:id" element={<PermissionGuard require={PERMISSIONS.PRICING_READ} redirectTo="/unauthorized"><ProductTierDetailPage /></PermissionGuard>} />
              <Route path="pricing" element={<PermissionGuard require={PERMISSIONS.PRICING_READ} redirectTo="/unauthorized"><PricingListPage /></PermissionGuard>} />
              <Route path="pricing/:id" element={<PermissionGuard require={PERMISSIONS.PRICING_READ} redirectTo="/unauthorized"><PricingDetailPage /></PermissionGuard>} />
              <Route path="warehouses" element={<PermissionGuard require={PERMISSIONS.WAREHOUSES_READ} redirectTo="/unauthorized"><WarehouseListPage /></PermissionGuard>} />
              <Route path="warehouses/:id" element={<PermissionGuard require={PERMISSIONS.WAREHOUSES_READ} redirectTo="/unauthorized"><WarehouseDetailPage /></PermissionGuard>} />
              <Route path="warehouses/:id/grn" element={
                <PermissionGuard require={PERMISSIONS.GRN_READ} redirectTo="/unauthorized">
                  <GRNPage />
                </PermissionGuard>
              } />
              <Route path="grn" element={<PermissionGuard require={PERMISSIONS.GRN_READ} redirectTo="/unauthorized"><GRNMonitoringPage /></PermissionGuard>} />
              <Route path="grn/:id" element={<PermissionGuard require={PERMISSIONS.GRN_READ} redirectTo="/unauthorized"><GRNDetailPage /></PermissionGuard>} />
              <Route path="dispatch" element={<PermissionGuard require={PERMISSIONS.DISPATCH_READ} redirectTo="/unauthorized"><DispatchListPage /></PermissionGuard>} />
              <Route path="dispatch/:id" element={<PermissionGuard require={PERMISSIONS.DISPATCH_READ} redirectTo="/unauthorized"><DispatchDetailPage /></PermissionGuard>} />
              <Route path="inventory" element={<PermissionGuard require={PERMISSIONS.INVENTORY_READ} redirectTo="/unauthorized"><InventoryListPage /></PermissionGuard>} />
              <Route path="inventory/:id" element={<PermissionGuard require={PERMISSIONS.INVENTORY_READ} redirectTo="/unauthorized"><InventoryDetailPage /></PermissionGuard>} />
              <Route path="dealers" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerListPage />
                </PermissionGuard>
              } />
              <Route path="dealers/onboarding" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_CREATE} redirectTo="/unauthorized">
                  <DealerOnboardingPage />
                </PermissionGuard>
              } />
              <Route path="dealers/:id" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerDetailPage />
                </PermissionGuard>
              } />
              <Route path="employees" element={
                <PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized">
                  <EmployeeListPage />
                </PermissionGuard>
              } />
              <Route path="employees/:id" element={
                <PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized">
                  <EmployeeDetailPage />
                </PermissionGuard>
              } />
              <Route path="approvals" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalListPage /></PermissionGuard>} />
              <Route path="approvals/:id" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalDetailPage /></PermissionGuard>} />
              <Route path="expenses" element={<PermissionGuard require={PERMISSIONS.EXPENSES_READ} redirectTo="/unauthorized"><ExpenseListPage /></PermissionGuard>} />
              <Route path="expenses/:id" element={<PermissionGuard require={PERMISSIONS.EXPENSES_READ} redirectTo="/unauthorized"><ExpenseDetailPage /></PermissionGuard>} />
              <Route path="reports" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><AdminReportsPage /></PermissionGuard>} />
              <Route path="reports/:id" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><ReportDetailPage /></PermissionGuard>} />
              <Route path="notifications" element={<PermissionGuard require={PERMISSIONS.NOTIFICATIONS_READ} redirectTo="/unauthorized"><NotificationsPage /></PermissionGuard>} />
              <Route path="settings" element={
                <PermissionGuard require={PERMISSIONS.SETTINGS_READ} redirectTo="/unauthorized">
                  <SettingsPage />
                </PermissionGuard>
              } />
              <Route path="settings/general" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><GeneralSettingsPage /></PermissionGuard>} />
              <Route path="settings/gst" element={<PermissionGuard require={PERMISSIONS.GST_CONFIG} redirectTo="/unauthorized"><GstSettingsPage /></PermissionGuard>} />
              <Route path="settings/notifications" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><NotificationSettingsPage /></PermissionGuard>} />
              <Route path="settings/roles" element={
                <PermissionGuard require={PERMISSIONS.RBAC_READ} redirectTo="/unauthorized">
                  <RolesPermissionsPage />
                </PermissionGuard>
              } />
              <Route path="audit-logs" element={
                <PermissionGuard require={PERMISSIONS.AUDIT_READ} redirectTo="/unauthorized">
                  <AuditLogPage />
                </PermissionGuard>
              } />
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
