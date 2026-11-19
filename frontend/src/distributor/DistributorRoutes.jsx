import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import DmsLayout from './DmsLayout';

/* Access to /distributor is decided server-side by /api/dms/me (MASTER_ADMIN or an active DmsProfile),
   so no PanelGuard role list here — DmsLayout shows the server's refusal when access is denied. */
const HomePage = lazy(() => import('./pages/HomePage'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const M = () => import('./pages/MasterPages');
const MasterList = lazy(() => M().then((m) => ({ default: m.MasterList })));
const MasterForm = lazy(() => M().then((m) => ({ default: m.MasterForm })));
const U = () => import('./pages/UserPages');
const UserList = lazy(() => U().then((m) => ({ default: m.UserList })));
const UserForm = lazy(() => U().then((m) => ({ default: m.UserForm })));
const P = () => import('./pages/PoPages');
const PoList = lazy(() => P().then((m) => ({ default: m.PoList })));
const PoForm = lazy(() => P().then((m) => ({ default: m.PoForm })));
const PoView = lazy(() => P().then((m) => ({ default: m.PoView })));
const PoApprovalList = lazy(() => P().then((m) => ({ default: m.PoApprovalList })));
const PoApprove = lazy(() => P().then((m) => ({ default: m.PoApprove })));
const CorporateQueue = lazy(() => P().then((m) => ({ default: m.CorporateQueue })));
const InvoiceAgainstPo = lazy(() => P().then((m) => ({ default: m.InvoiceAgainstPo })));
const D = () => import('./pages/DocPages');
const DocList = lazy(() => D().then((m) => ({ default: m.DocList })));
const DocForm = lazy(() => D().then((m) => ({ default: m.DocForm })));
const DocView = lazy(() => D().then((m) => ({ default: m.DocView })));
const DispatchPage = lazy(() => D().then((m) => ({ default: m.DispatchPage })));
const ReceivePage = lazy(() => D().then((m) => ({ default: m.ReceivePage })));
const DocApprove = lazy(() => D().then((m) => ({ default: m.DocApprove })));
const UploadPage = lazy(() => D().then((m) => ({ default: m.UploadPage })));
const VendorPoReceive = lazy(() => D().then((m) => ({ default: m.VendorPoReceive })));
const Pay = () => import('./pages/PaymentPages');
const PaymentList = lazy(() => Pay().then((m) => ({ default: m.PaymentList })));
const PaymentForm = lazy(() => Pay().then((m) => ({ default: m.PaymentForm })));
const PaymentView = lazy(() => Pay().then((m) => ({ default: m.PaymentView })));
const PaymentApprove = lazy(() => Pay().then((m) => ({ default: m.PaymentApprove })));
const R = () => import('./pages/ReportPages');
const InventoryReport = lazy(() => R().then((m) => ({ default: m.InventoryReport })));
const AgingReport = lazy(() => R().then((m) => ({ default: m.AgingReport })));
const StockLedgerReport = lazy(() => R().then((m) => ({ default: m.StockLedgerReport })));
const PartyLedgerReport = lazy(() => R().then((m) => ({ default: m.PartyLedgerReport })));
const SaleReport = lazy(() => R().then((m) => ({ default: m.SaleReport })));
const ReturnReport = lazy(() => R().then((m) => ({ default: m.ReturnReport })));
const VendorPurchaseReport = lazy(() => R().then((m) => ({ default: m.VendorPurchaseReport })));
const PoReport = lazy(() => R().then((m) => ({ default: m.PoReport })));
const SerialTrack = lazy(() => R().then((m) => ({ default: m.SerialTrack })));
const SaleDashboard = lazy(() => R().then((m) => ({ default: m.SaleDashboard })));
const PR = () => import('./pages/PrintPages');
const PrintDoc = lazy(() => PR().then((m) => ({ default: m.PrintDoc })));
const PrintPo = lazy(() => PR().then((m) => ({ default: m.PrintPo })));
const PrintPayment = lazy(() => PR().then((m) => ({ default: m.PrintPayment })));

const DOC_LIST_PATHS = [
  'invoicing/invoices', 'invoicing/retail', 'invoicing/stock-transfer', 'invoicing/jobwork', 'invoicing/stock-transfer-approval',
  'purchase/local', 'purchase/opening', 'return/customer', 'return/purchase', 'return/approval', 'return/vendor',
  'logistic/dispatch', 'receive/location', 'receive/jobwork',
];

function PrintShell() {
  return <div style={{ background: '#fff', minHeight: '100vh', color: '#000' }}><Suspense fallback={null}><Outlet /></Suspense></div>;
}

export default function DistributorRoutes() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="print" element={<PrintShell />}>
          <Route path="doc/:id" element={<PrintDoc />} />
          <Route path="po/:id" element={<PrintPo />} />
          <Route path="payment/:id" element={<PrintPayment />} />
        </Route>
        <Route element={<DmsLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="change-password" element={<ChangePassword />} />

          <Route path="dashboard/inventory" element={<InventoryReport title="Inventory Dashboard" />} />
          <Route path="dashboard/purchase" element={<PoReport />} />
          <Route path="dashboard/sale" element={<SaleDashboard />} />

          <Route path="masters/users" element={<UserList />} />
          <Route path="masters/users/:id" element={<UserForm />} />
          <Route path="masters/:key" element={<MasterList />} />
          <Route path="masters/:key/:id" element={<MasterForm />} />

          <Route path="reports/inventory" element={<InventoryReport />} />
          <Route path="reports/aging" element={<AgingReport />} />
          <Route path="reports/stock-ledger" element={<StockLedgerReport />} />
          <Route path="reports/party-ledger" element={<PartyLedgerReport />} />
          <Route path="reports/sale" element={<SaleReport />} />
          <Route path="reports/return" element={<ReturnReport />} />
          <Route path="reports/vendor" element={<VendorPurchaseReport />} />
          <Route path="reports/purchase" element={<PoReport />} />

          {DOC_LIST_PATHS.map((p) => <Route key={p} path={p} element={<DocList listKey={p} />} />)}
          <Route path="new/:kind" element={<DocForm />} />
          <Route path="upload/:kind" element={<UploadPage />} />
          <Route path="invoicing/upload-billing" element={<Navigate to="/distributor/upload/UPLOAD_BILLING" replace />} />
          <Route path="doc/:id" element={<DocView />} />
          <Route path="doc/:id/dispatch" element={<DispatchPage />} />
          <Route path="doc/:id/receive" element={<ReceivePage />} />
          <Route path="doc/:id/approve" element={<DocApprove />} />

          <Route path="invoicing/corporate" element={<CorporateQueue />} />
          <Route path="invoicing/corporate/:poId" element={<InvoiceAgainstPo />} />
          <Route path="invoicing/serial-track" element={<SerialTrack />} />
          <Route path="invoicing/multi-serial-track" element={<SerialTrack multi />} />

          <Route path="purchase/po" element={<PoList />} />
          <Route path="purchase/po/new" element={<PoForm />} />
          <Route path="purchase/po/:id/edit" element={<PoForm />} />
          <Route path="purchase/po-approval" element={<PoApprovalList />} />
          <Route path="purchase/vendor" element={<PoList vendor />} />
          <Route path="purchase/vendor/new" element={<PoForm vendor />} />
          <Route path="purchase/vendor/:id/receive" element={<VendorPoReceive />} />
          <Route path="po/:id" element={<PoView />} />
          <Route path="po/:id/approve" element={<PoApprove />} />

          <Route path="payment/receive" element={<PaymentList kind="RECEIPT" />} />
          <Route path="payment/receive/new" element={<PaymentForm kind="RECEIPT" />} />
          <Route path="payment/adjustment" element={<PaymentList kind="ADJUSTMENT" />} />
          <Route path="payment/adjustment/new" element={<PaymentForm kind="ADJUSTMENT" />} />
          <Route path="payment/approval" element={<PaymentList kind="RECEIPT" approval />} />
          <Route path="payment/:id" element={<PaymentView />} />
          <Route path="payment/:id/approve" element={<PaymentApprove />} />

          <Route path="*" element={<Navigate to="home" replace />} />
        </Route>
      </Routes>
    </AuthGuard>
  );
}
