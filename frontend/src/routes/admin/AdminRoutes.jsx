import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import ProductListPage from '@/pages/admin/products/ProductListPage';
import ProductDetailPage from '@/pages/admin/products/ProductDetailPage';
import CategoryListPage from '@/pages/admin/categories/CategoryListPage';
import CategoryDetailPage from '@/pages/admin/categories/CategoryDetailPage';
import BrandListPage from '@/pages/admin/brands/BrandListPage';
import BrandDetailPage from '@/pages/admin/brands/BrandDetailPage';
import ProductTierListPage from '@/pages/admin/product-tiers/ProductTierListPage';
import ProductTierDetailPage from '@/pages/admin/product-tiers/ProductTierDetailPage';
import PricingListPage from '@/pages/admin/pricing/PricingListPage';
import PricingDetailPage from '@/pages/admin/pricing/PricingDetailPage';
import WarehouseListPage from '@/pages/admin/warehouses/WarehouseListPage';
import WarehouseDetailPage from '@/pages/admin/warehouses/WarehouseDetailPage';
import GRNPage from '@/pages/admin/warehouses/GRNPage';
import GRNMonitoringPage from '@/pages/admin/grn/GRNMonitoringPage';
import GRNDetailPage from '@/pages/admin/grn/GRNDetailPage';
import DispatchListPage from '@/pages/admin/dispatch/DispatchListPage';
import DispatchDetailPage from '@/pages/admin/dispatch/DispatchDetailPage';
import InventoryListPage from '@/pages/admin/inventory/InventoryListPage';
import InventoryDetailPage from '@/pages/admin/inventory/InventoryDetailPage';
import StockMovementListPage from '@/pages/admin/stock-movements/StockMovementListPage';
import DealerListPage from '@/pages/admin/dealers/DealerListPage';
import DealerDetailPage from '@/pages/admin/dealers/DealerDetailPage';
import DealerOnboardingPage from '@/pages/admin/dealers/DealerOnboardingPage';
import EmployeeListPage from '@/pages/admin/employees/EmployeeListPage';
import EmployeeDetailPage from '@/pages/admin/employees/EmployeeDetailPage';
import HrmsHubPage from '@/pages/admin/hrms/HrmsHubPage';
import HrmsEmployeesPage from '@/pages/admin/hrms/HrmsEmployeesPage';
import HrmsAttendancePage from '@/pages/admin/hrms/HrmsAttendancePage';
import HrmsLeavesPage from '@/pages/admin/hrms/HrmsLeavesPage';
import HrmsPayrollPage from '@/pages/admin/hrms/HrmsPayrollPage';
import HrmsDepartmentsPage from '@/pages/admin/hrms/HrmsDepartmentsPage';
import ExpenseListPage from '@/pages/admin/expenses/ExpenseListPage';
import ExpenseDetailPage from '@/pages/admin/expenses/ExpenseDetailPage';
import AdminReportsPage from '@/pages/admin/reports/AdminReportsPage';
import ReportDetailPage from '@/pages/admin/reports/ReportDetailPage';
import NotificationsPage from '@/pages/admin/notifications/NotificationsPage';
import SettingsPage from '@/pages/admin/settings/SettingsPage';
import GeneralSettingsPage from '@/pages/admin/settings/GeneralSettingsPage';
import GstSettingsPage from '@/pages/admin/settings/GstSettingsPage';
import NotificationSettingsPage from '@/pages/admin/settings/NotificationSettingsPage';
import CustomerPortalSettingsPage from '@/pages/admin/settings/CustomerPortalSettingsPage';
import CaReportsSharingPage from '@/pages/admin/settings/CaReportsSharingPage';
import AuditLogPage from '@/pages/admin/audit-logs/AuditLogPage';
import ApprovalListPage from '@/pages/admin/approvals/ApprovalListPage';
import ApprovalDetailPage from '@/pages/admin/approvals/ApprovalDetailPage';
import CmsHubPage from '@/pages/admin/cms/CmsHubPage';
import CmsSettingsPage from '@/pages/admin/cms/CmsSettingsPage';
import CmsPageManagerPage from '@/pages/admin/cms/CmsPageManagerPage';
import CmsCollectionsHubPage from '@/pages/admin/cms/CmsCollectionsHubPage';
import CmsCollectionPage from '@/pages/admin/cms/CmsCollectionPage';
import StoreOrdersPage from '@/pages/admin/store-orders/StoreOrdersPage';
import RolesPermissionsPage from '@/pages/admin/settings/RolesPermissionsPage';
import PartyListPage from '@/pages/admin/parties/PartyListPage';
import PartyNewPage from '@/pages/admin/parties/PartyNewPage';
import PartyEditPage from '@/pages/admin/parties/PartyEditPage';
import PartyDetailPage from '@/pages/admin/parties/PartyDetailPage';
import PurchaseListPage from '@/pages/admin/purchases/PurchaseListPage';
import PurchaseNewPage from '@/pages/admin/purchases/PurchaseNewPage';
import PurchaseDetailPage from '@/pages/admin/purchases/PurchaseDetailPage';
import ManufactureListPage from '@/pages/admin/manufacture/ManufactureListPage';
import ManufactureNewPage from '@/pages/admin/manufacture/ManufactureNewPage';
import ManufactureDetailPage from '@/pages/admin/manufacture/ManufactureDetailPage';
import FinishedGoodsPage from '@/pages/admin/manufacture/FinishedGoodsPage';
import ManageBusinessPage from '@/pages/admin/business/ManageBusinessPage';
import InvoiceSettingsPage from '@/pages/admin/business/InvoiceSettingsPage';
import PrintSettingsPage from '@/pages/admin/business/PrintSettingsPage';

// Sales Invoices B2B
import SalesInvoiceListPage from '@/pages/admin/sales-invoices/SalesInvoiceListPage';
import SalesInvoiceNewPage from '@/pages/admin/sales-invoices/SalesInvoiceNewPage';
import SalesInvoiceDetailPage from '@/pages/admin/sales-invoices/SalesInvoiceDetailPage';
import SalesInvoiceEditPage from '@/pages/admin/sales-invoices/SalesInvoiceEditPage';

// Sale PO (Dealer Orders)
import SalePOListPage from '@/pages/admin/purchases/SalePOListPage';
import SalePODetailPage from '@/pages/admin/purchases/SalePODetailPage';

// Dealer Retail Invoices (Dealer -> Customer)
import DealerInvoiceListPage from '@/pages/admin/dealers/DealerInvoiceListPage';
import DealerInvoiceDetailPage from '@/pages/admin/dealers/DealerInvoiceDetailPage';

// Payment In
import PaymentInListPage from '@/pages/admin/sales/PaymentInListPage';
import PaymentInNewPage from '@/pages/admin/sales/PaymentInNewPage';
import PaymentInDetailPage from '@/pages/admin/sales/PaymentInDetailPage';

// Payment Out
import PaymentOutListPage from '@/pages/admin/purchases/PaymentOutListPage';
import PaymentOutNewPage from '@/pages/admin/purchases/PaymentOutNewPage';
import PaymentOutDetailPage from '@/pages/admin/purchases/PaymentOutDetailPage';

// Party Ledger
import LedgerPage from '@/pages/admin/reports/LedgerPage';

// Service Management Admin
import AdminComplaintsPage from '@/pages/admin/complaints/AdminComplaintsPage';
import AdminServiceCenterListPage from '@/pages/admin/service-centers/AdminServiceCenterListPage';
import JobCardListPage from '@/pages/service/job-cards/JobCardListPage';

// Insurance & Warranty
import AdminInsurancePage from '@/pages/admin/insurance/AdminInsurancePage';
import AdminInsuranceClaimDetailPage from '@/pages/admin/insurance/AdminInsuranceClaimDetailPage';
import AdminWarrantyPage from '@/pages/admin/warranty/AdminWarrantyPage';
import AdminWarrantyDetailPage from '@/pages/admin/warranty/AdminWarrantyDetailPage';

// Dealer Sale Returns / Purchase Returns
import AdminSaleReturnListPage from '@/pages/admin/sale-returns/AdminSaleReturnListPage';
import AdminSaleReturnDetailPage from '@/pages/admin/sale-returns/AdminSaleReturnDetailPage';
import AdminPurchaseReturnListPage from '@/pages/admin/purchase-returns/AdminPurchaseReturnListPage';
import AdminPurchaseReturnDetailPage from '@/pages/admin/purchase-returns/AdminPurchaseReturnDetailPage';

// Referrals
import AdminReferralsPage from '@/pages/admin/referrals/AdminReferralsPage';

// Company Ledger
import CompanyLedgerPageWrapper from '@/pages/admin/ledger/CompanyLedgerPageWrapper';

const ADMIN_ROLES = [ROLES.MASTER_ADMIN, ROLES.WAREHOUSE_MANAGER];

export default function AdminRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={ADMIN_ROLES}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PermissionGuard require={PERMISSIONS.ANALYTICS_READ} redirectTo="/unauthorized"><AdminDashboardPage /></PermissionGuard>} />
              <Route path="products" element={<PermissionGuard require={PERMISSIONS.PRODUCTS_READ} redirectTo="/unauthorized"><ProductListPage /></PermissionGuard>} />
              <Route path="products/:id" element={<PermissionGuard require={PERMISSIONS.PRODUCTS_READ} redirectTo="/unauthorized"><ProductDetailPage /></PermissionGuard>} />
              <Route path="parties" element={<PermissionGuard require={PERMISSIONS.PARTIES_READ} redirectTo="/unauthorized"><PartyListPage /></PermissionGuard>} />
              <Route path="parties/new" element={<PermissionGuard require={PERMISSIONS.PARTIES_CREATE} redirectTo="/unauthorized"><PartyNewPage /></PermissionGuard>} />
              <Route path="parties/:id/edit" element={<PermissionGuard require={PERMISSIONS.PARTIES_UPDATE} redirectTo="/unauthorized"><PartyEditPage /></PermissionGuard>} />
              <Route path="parties/:id" element={<PermissionGuard require={PERMISSIONS.PARTIES_READ} redirectTo="/unauthorized"><PartyDetailPage /></PermissionGuard>} />
              <Route path="purchases" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PurchaseListPage /></PermissionGuard>} />
              <Route path="purchases/new" element={<PermissionGuard require={PERMISSIONS.PURCHASES_CREATE} redirectTo="/unauthorized"><PurchaseNewPage /></PermissionGuard>} />
              <Route path="purchases/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PurchaseDetailPage /></PermissionGuard>} />
              
              {/* Sales Invoices B2B */}
              <Route path="sales-invoices" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><SalesInvoiceListPage /></PermissionGuard>} />
              <Route path="sales-invoices/new" element={<PermissionGuard require={PERMISSIONS.PURCHASES_CREATE} redirectTo="/unauthorized"><SalesInvoiceNewPage /></PermissionGuard>} />
              <Route path="sales-invoices/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><SalesInvoiceDetailPage /></PermissionGuard>} />
              <Route path="sales-invoices/:id/edit" element={<PermissionGuard require={PERMISSIONS.PURCHASES_CREATE} redirectTo="/unauthorized"><SalesInvoiceEditPage /></PermissionGuard>} />

              {/* Sale PO (Dealer orders) */}
              <Route path="sale-po" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><SalePOListPage /></PermissionGuard>} />
              <Route path="sale-po/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><SalePODetailPage /></PermissionGuard>} />

              <Route path="manufacture" element={<PermissionGuard require={PERMISSIONS.MANUFACTURE_READ} redirectTo="/unauthorized"><ManufactureListPage /></PermissionGuard>} />
              <Route path="manufacture/new" element={<PermissionGuard require={PERMISSIONS.MANUFACTURE_CREATE} redirectTo="/unauthorized"><ManufactureNewPage /></PermissionGuard>} />
              <Route path="manufacture/:id" element={<PermissionGuard require={PERMISSIONS.MANUFACTURE_READ} redirectTo="/unauthorized"><ManufactureDetailPage /></PermissionGuard>} />
              <Route path="finished-goods" element={<PermissionGuard require={PERMISSIONS.INVENTORY_READ} redirectTo="/unauthorized"><FinishedGoodsPage /></PermissionGuard>} />
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
              <Route path="stock-movements" element={<PermissionGuard require={PERMISSIONS.INVENTORY_READ} redirectTo="/unauthorized"><StockMovementListPage /></PermissionGuard>} />
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
              <Route path="dealer-invoices" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerInvoiceListPage />
                </PermissionGuard>
              } />
              <Route path="dealer-invoices/:id" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerInvoiceDetailPage />
                </PermissionGuard>
              } />
              <Route path="customer-invoices" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerInvoiceListPage />
                </PermissionGuard>
              } />
              <Route path="customer-invoices/:id" element={
                <PermissionGuard require={PERMISSIONS.DEALERS_READ} redirectTo="/unauthorized">
                  <DealerInvoiceDetailPage />
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

              {/* Complete HRMS Module */}
              <Route path="hrms" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsHubPage /></PermissionGuard>} />
              <Route path="hrms/employees" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsEmployeesPage /></PermissionGuard>} />
              <Route path="hrms/attendance" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsAttendancePage /></PermissionGuard>} />
              <Route path="hrms/leaves" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsLeavesPage /></PermissionGuard>} />
              <Route path="hrms/payroll" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsPayrollPage /></PermissionGuard>} />
              <Route path="hrms/departments" element={<PermissionGuard require={PERMISSIONS.EMPLOYEES_READ} redirectTo="/unauthorized"><HrmsDepartmentsPage /></PermissionGuard>} />
              <Route path="approvals" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalListPage /></PermissionGuard>} />
              <Route path="approvals/:id" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalDetailPage /></PermissionGuard>} />
              <Route path="expenses" element={<PermissionGuard require={PERMISSIONS.EXPENSES_READ} redirectTo="/unauthorized"><ExpenseListPage /></PermissionGuard>} />
              <Route path="expenses/:id" element={<PermissionGuard require={PERMISSIONS.EXPENSES_READ} redirectTo="/unauthorized"><ExpenseDetailPage /></PermissionGuard>} />
              <Route path="reports" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><AdminReportsPage /></PermissionGuard>} />
              <Route path="reports/:id" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><ReportDetailPage /></PermissionGuard>} />
              <Route path="business" element={<Navigate to="manage" replace />} />
              <Route path="business/manage" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><ManageBusinessPage /></PermissionGuard>} />
              <Route path="business/invoice" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><InvoiceSettingsPage /></PermissionGuard>} />
              <Route path="business/print" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><PrintSettingsPage /></PermissionGuard>} />
              <Route path="notifications" element={<PermissionGuard require={PERMISSIONS.NOTIFICATIONS_READ} redirectTo="/unauthorized"><NotificationsPage /></PermissionGuard>} />
              <Route path="settings" element={
                <PermissionGuard require={PERMISSIONS.SETTINGS_READ} redirectTo="/unauthorized">
                  <SettingsPage />
                </PermissionGuard>
              } />
              <Route path="settings/general" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><GeneralSettingsPage /></PermissionGuard>} />
              <Route path="settings/gst" element={<PermissionGuard require={PERMISSIONS.GST_CONFIG} redirectTo="/unauthorized"><GstSettingsPage /></PermissionGuard>} />
              <Route path="settings/notifications" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><NotificationSettingsPage /></PermissionGuard>} />
              <Route path="settings/customer-portal" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><CustomerPortalSettingsPage /></PermissionGuard>} />
              <Route path="settings/ca-reports" element={<PermissionGuard require={PERMISSIONS.SETTINGS_UPDATE} redirectTo="/unauthorized"><CaReportsSharingPage /></PermissionGuard>} />
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
              <Route path="cms" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsHubPage /></PermissionGuard>} />
              <Route path="cms/settings" element={<PermissionGuard require={PERMISSIONS.CMS_UPDATE} redirectTo="/unauthorized"><CmsSettingsPage /></PermissionGuard>} />
              <Route path="cms/pages/home" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsPageManagerPage page="home" title="Home" /></PermissionGuard>} />
              <Route path="cms/pages/store" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsPageManagerPage page="store" title="Store" /></PermissionGuard>} />
              <Route path="cms/pages/about" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsPageManagerPage page="about" title="About" /></PermissionGuard>} />
              <Route path="cms/pages/appliances" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsPageManagerPage page="appliances" title="Appliances" /></PermissionGuard>} />
              <Route path="cms/pages/inverter" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsPageManagerPage page="inverter" title="Inverter" /></PermissionGuard>} />
              <Route path="cms/collections" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsCollectionsHubPage /></PermissionGuard>} />
              <Route path="cms/collections/:collection" element={<PermissionGuard require={PERMISSIONS.CMS_READ} redirectTo="/unauthorized"><CmsCollectionPage /></PermissionGuard>} />
              <Route path="store-orders" element={<PermissionGuard require={PERMISSIONS.STORE_ORDERS_READ} redirectTo="/unauthorized"><StoreOrdersPage /></PermissionGuard>} />

              {/* Payment In */}
              <Route path="sales/payment-in" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PaymentInListPage /></PermissionGuard>} />
              <Route path="sales/payment-in/new" element={<PermissionGuard require={PERMISSIONS.PURCHASES_CREATE} redirectTo="/unauthorized"><PaymentInNewPage /></PermissionGuard>} />
              <Route path="sales/payment-in/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PaymentInDetailPage /></PermissionGuard>} />

              {/* Payment Out */}
              <Route path="purchases/payment-out" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PaymentOutListPage /></PermissionGuard>} />
              <Route path="purchases/payment-out/new" element={<PermissionGuard require={PERMISSIONS.PURCHASES_CREATE} redirectTo="/unauthorized"><PaymentOutNewPage /></PermissionGuard>} />
              <Route path="purchases/payment-out/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASES_READ} redirectTo="/unauthorized"><PaymentOutDetailPage /></PermissionGuard>} />

              {/* Service Management Admin */}
              <Route path="complaints" element={<PermissionGuard require={PERMISSIONS.COMPLAINTS_READ} redirectTo="/unauthorized"><AdminComplaintsPage /></PermissionGuard>} />
              <Route path="service-centers" element={<PermissionGuard require={PERMISSIONS.COMPLAINTS_READ} redirectTo="/unauthorized"><AdminServiceCenterListPage /></PermissionGuard>} />
              <Route path="job-cards" element={<PermissionGuard require={PERMISSIONS.COMPLAINTS_READ} redirectTo="/unauthorized"><JobCardListPage /></PermissionGuard>} />

              {/* Insurance & Warranty */}
              <Route path="insurance" element={<PermissionGuard require={PERMISSIONS.INSURANCE_CLAIMS_READ} redirectTo="/unauthorized"><AdminInsurancePage /></PermissionGuard>} />
              <Route path="insurance/claims/:id" element={<PermissionGuard require={PERMISSIONS.INSURANCE_CLAIMS_READ} redirectTo="/unauthorized"><AdminInsuranceClaimDetailPage /></PermissionGuard>} />
              <Route path="warranty" element={<PermissionGuard require={PERMISSIONS.WARRANTY_READ} redirectTo="/unauthorized"><AdminWarrantyPage /></PermissionGuard>} />
              <Route path="warranty/:id" element={<PermissionGuard require={PERMISSIONS.WARRANTY_READ} redirectTo="/unauthorized"><AdminWarrantyDetailPage /></PermissionGuard>} />

              {/* Dealer Sale Returns */}
              <Route path="dealer-sale-returns" element={<PermissionGuard require={PERMISSIONS.SALE_RETURNS_READ} redirectTo="/unauthorized"><AdminSaleReturnListPage /></PermissionGuard>} />
              <Route path="dealer-sale-returns/:id" element={<PermissionGuard require={PERMISSIONS.SALE_RETURNS_READ} redirectTo="/unauthorized"><AdminSaleReturnDetailPage /></PermissionGuard>} />

              {/* Dealer Purchase Returns */}
              <Route path="dealer-purchase-returns" element={<PermissionGuard require={PERMISSIONS.PURCHASE_RETURNS_READ} redirectTo="/unauthorized"><AdminPurchaseReturnListPage /></PermissionGuard>} />
              <Route path="dealer-purchase-returns/:id" element={<PermissionGuard require={PERMISSIONS.PURCHASE_RETURNS_READ} redirectTo="/unauthorized"><AdminPurchaseReturnDetailPage /></PermissionGuard>} />

              {/* Party Ledger */}
              <Route path="reports/ledger" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><LedgerPage /></PermissionGuard>} />

              {/* Referral Rewards */}
              <Route path="referrals" element={<AdminReferralsPage />} />

              {/* Company Ledger */}
              <Route path="company-ledger" element={<PermissionGuard require={PERMISSIONS.REPORTS_READ} redirectTo="/unauthorized"><CompanyLedgerPageWrapper /></PermissionGuard>} />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
      </PanelGuard>
    </AuthGuard>
  );
}
