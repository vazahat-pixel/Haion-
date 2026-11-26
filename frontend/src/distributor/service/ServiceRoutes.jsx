import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ServiceLayout from './ServiceLayout';
import ServiceLogin from './ServiceLogin';

function ServiceAuthGuard({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) return <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/distributor/service/login" state={{ from: location }} replace />;
  return children;
}

const pick = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const Home = () => import('./pages/HomePage');
const Jobs = () => import('./pages/JobsPages');
const Mas = () => import('./pages/MastersPages');
const Rep = () => import('./pages/ReportsPages');
const Inv = () => import('./pages/InventoryPages');
const Fin = () => import('./pages/FinancePages');

const HomePage = lazy(Home);
const ChangePasswordPage = pick(Home, 'ChangePasswordPage');
const CallBookingPage = lazy(() => import('./pages/CallBookingPage'));

const P = {};
for (const n of ['JobListPage', 'JobViewPage', 'JobAckPage', 'JobAssignPage', 'JobRepairPage', 'JobHandoverPage', 'JobEditPage', 'JobPrintPage']) P[n] = pick(Jobs, n);
for (const n of ['CrmMasterPage', 'MyProfilePage', 'NoticePage']) P[n] = pick(Mas, n);
for (const n of ['ReportPage', 'FindAspPage', 'PartSearchPage', 'ProductSearchPage', 'AmcSearchPage', 'AttendancePage']) P[n] = pick(Rep, n);
for (const n of ['AspPoPage', 'AspPoAddPage', 'PnaBucketPage', 'StockInPage', 'WhReceiveReturnPage', 'EngineerStockPage', 'RetailInvoiceAddPage', 'RetailInvoiceListPage', 'PurchaseReturnPage', 'PurchaseReturnAddPage',
  'FaultyBinPage', 'FaultyDispatchedPage', 'WhInvoicesPage', 'InvoiceCancelPage', 'EngIssueListPage', 'EngIssueAddPage', 'EngDemandPage', 'EngFaultyReturnPage', 'LocalGrnPage', 'LocalGrnAddPage',
  'VendorPoPage', 'VendorPoAddPage', 'GateEntryPage', 'ReceiveGrnPage', 'WhPoPage', 'DirectDispatchPage', 'StnPage', 'ScrapOutPage', 'PoCancelPage', 'StockAdjustmentPage', 'DocPrintPage']) P[n] = pick(Inv, n);
for (const n of ['ExpensePage', 'ExpenseAddPage', 'AddPaymentPage', 'PaymentReceivePage', 'AccountStatusPage', 'LedgerPage', 'TransferPage', 'AdjustmentPage', 'CnPage', 'ReconciliationPage',
  'ClaimGeneratePage', 'ClaimApprovalPage', 'ClaimInvoicePage', 'ClaimPrintPage']) P[n] = pick(Fin, n);

function PrintShell() {
  return <div style={{ background: '#fff', minHeight: '100vh', color: '#000' }}><Suspense fallback={null}><Outlet /></Suspense></div>;
}

export default function ServiceRoutes() {
  return (
    <Routes>
      <Route path="login" element={<ServiceLogin />} />
      <Route path="*" element={<ServiceAuthGuard><GuardedServiceRoutes /></ServiceAuthGuard>} />
    </Routes>
  );
}

function GuardedServiceRoutes() {
  return (
    <Routes>
      <Route path="print" element={<PrintShell />}>
        <Route path="job/:id" element={<P.JobPrintPage />} />
        <Route path="doc/:id" element={<P.DocPrintPage />} />
        <Route path="po/:id" element={<P.DocPrintPage po />} />
        <Route path="claim/:id" element={<P.ClaimPrintPage />} />
      </Route>
      <Route element={<ServiceLayout />}>
        <Route index element={<Navigate to="/distributor/service/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="call-booking" element={<CallBookingPage />} />

        <Route path="jobs/view/:id" element={<P.JobViewPage />} />
        <Route path="jobs/ack/:id" element={<P.JobAckPage />} />
        <Route path="jobs/assign/:id" element={<P.JobAssignPage />} />
        <Route path="jobs/repair/:id" element={<P.JobRepairPage />} />
        <Route path="jobs/handover/:id" element={<P.JobHandoverPage />} />
        <Route path="jobs/edit/:id" element={<P.JobEditPage />} />
        <Route path="jobs/:mode" element={<P.JobListPage />} />

        <Route path="dash/:key" element={<P.ReportPage />} />
        <Route path="rpt/:key" element={<P.ReportPage />} />
        <Route path="find-asp" element={<P.FindAspPage />} />
        <Route path="part-search" element={<P.PartSearchPage />} />
        <Route path="product-search" element={<P.ProductSearchPage />} />
        <Route path="amc" element={<P.AmcSearchPage />} />
        <Route path="attendance" element={<P.AttendancePage />} />
        <Route path="notice" element={<P.NoticePage />} />
        <Route path="profile" element={<P.MyProfilePage />} />
        <Route path="masters/:type" element={<P.CrmMasterPage />} />

        <Route path="stock" element={<P.ReportPage rkey="stock-details" />} />
        <Route path="po" element={<P.AspPoPage />} />
        <Route path="po/new" element={<P.AspPoAddPage />} />
        <Route path="pna-bucket" element={<P.PnaBucketPage />} />
        <Route path="stock-in" element={<P.StockInPage />} />
        <Route path="engineer-stock" element={<P.EngineerStockPage />} />
        <Route path="retail-invoice" element={<P.RetailInvoiceListPage />} />
        <Route path="retail-invoice/new" element={<P.RetailInvoiceAddPage />} />
        <Route path="purchase-return" element={<P.PurchaseReturnPage />} />
        <Route path="purchase-return/new" element={<P.PurchaseReturnAddPage />} />
        <Route path="faulty-bin" element={<P.FaultyBinPage />} />
        <Route path="faulty-dispatched" element={<P.FaultyDispatchedPage />} />
        <Route path="eng-issue" element={<P.EngIssueListPage />} />
        <Route path="eng-issue/new" element={<P.EngIssueAddPage />} />
        <Route path="eng-demand" element={<P.EngDemandPage />} />
        <Route path="eng-faulty" element={<P.EngFaultyReturnPage />} />

        <Route path="grn/local" element={<P.LocalGrnPage />} />
        <Route path="grn/local/new" element={<P.LocalGrnAddPage />} />
        <Route path="vendor-po" element={<P.VendorPoPage />} />
        <Route path="vendor-po/new" element={<P.VendorPoAddPage />} />
        <Route path="grn/gate-entry" element={<P.GateEntryPage />} />
        <Route path="grn/receive" element={<P.ReceiveGrnPage />} />
        <Route path="grn/status" element={<P.ReceiveGrnPage status="Received" />} />
        <Route path="wh/receive-return" element={<P.WhReceiveReturnPage />} />
        <Route path="wh/po" element={<P.WhPoPage />} />
        <Route path="wh/direct-dispatch" element={<P.DirectDispatchPage />} />
        <Route path="wh/stn" element={<P.StnPage />} />
        <Route path="dispatches" element={<P.WhInvoicesPage />} />
        <Route path="wh/scrap-out" element={<P.ScrapOutPage />} />
        <Route path="wh/payment-receive" element={<P.PaymentReceivePage />} />
        <Route path="wh/cn" element={<P.CnPage />} />
        <Route path="wh/transfer" element={<P.TransferPage />} />
        <Route path="wh/adjustment" element={<P.AdjustmentPage />} />
        <Route path="wh/reconciliation" element={<P.ReconciliationPage />} />
        <Route path="stock-adjustment" element={<P.StockAdjustmentPage />} />

        <Route path="expenses" element={<P.ExpensePage />} />
        <Route path="expenses/new" element={<P.ExpenseAddPage />} />
        <Route path="payments" element={<P.AddPaymentPage />} />
        <Route path="accounts" element={<P.AccountStatusPage />} />
        <Route path="ledger" element={<P.LedgerPage />} />

        <Route path="claims/approval" element={<P.ClaimApprovalPage />} />
        <Route path="claims/generate/:type" element={<P.ClaimGeneratePage />} />
        <Route path="claims/invoices" element={<P.ClaimInvoicePage />} />
        <Route path="approvals/vendor-po" element={<P.VendorPoPage approval />} />
        <Route path="approvals/invoice-cancel" element={<P.InvoiceCancelPage />} />
        <Route path="approvals/po-cancel" element={<P.PoCancelPage />} />

        <Route path="*" element={<Navigate to="/distributor/service/home" replace />} />
      </Route>
    </Routes>
  );
}
