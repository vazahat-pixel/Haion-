/* Sidebar per role — labels, order and grouping follow the reference (CANCRM V6). */
import {
  Home, Gauge, Database, FileBarChart, ShieldCheck, ClipboardList, Search, Tag, MapPin, Smile, LifeBuoy, KeyRound,
  Wrench, Receipt, Package, Wallet, Warehouse, PackageCheck, Truck, Landmark,
} from 'lucide-react';

const B = '/distributor/service';
const L = (label, to) => ({ label, to: `${B}/${to}` });

const CHANGE_PW = { label: 'Change Password', icon: KeyRound, to: `${B}/change-password` };

export const CRM_MENUS = {
  Admin: [
    { label: 'Home', icon: Home, to: `${B}/home` },
    { label: 'Dashboard', icon: Gauge, items: [
      L('Job Status', 'dash/job-status'), L('Pending calls ageing', 'dash/pending-ageing'), L('Closed calls TAT', 'dash/closed-tat'),
      L('Brand ASP Mapping', 'dash/brand-asp'), L('ASP Parts Sales', 'dash/asp-parts-sales'), L('State Ageing With Model', 'dash/state-ageing'),
      L('ASP wise TAT', 'dash/asp-tat'), L('State wise TAT', 'dash/state-tat'), L('Faulty Model Details', 'dash/faulty-model'),
    ] },
    { label: 'Masters', icon: Database, items: [
      L('Admin Users', 'masters/admin-users'), L('City', 'masters/city'), L('Product', 'masters/product'), L('Brand', 'masters/brand'),
      L('Purchase From', 'masters/purchaseFrom'), L('Location', 'masters/location'), L('Model', 'masters/model'), L('Partcode', 'masters/partcode'),
      L('State', 'masters/state'), L('VOC', 'masters/voc'), L('Repair Action', 'masters/repairAction'), L('HSN Tax', 'masters/hsn'),
      L('Supplier', 'masters/supplier'), L('Add Software', 'masters/software'), L('Notice', 'masters/notice'), L('Job Search', 'jobs/search'),
      L('Claim', 'masters/claimRate'), L('Holiday', 'masters/holiday'), L('Create Pincode', 'masters/pincode'), L('Fault', 'masters/fault'),
      L('Feedback', 'masters/feedback'), L('Pending Reason', 'masters/pendingReason'), L('Account Head Master', 'masters/accountHead'),
      L('Account Section Master', 'masters/accountSection'), L('Voucher Master', 'masters/voucherMaster'), L('Bank Account Master', 'masters/bankAccount'),
    ] },
    { label: 'Reports', icon: FileBarChart, items: [
      L('All Job', 'rpt/all-job'), L('Part Consumption', 'rpt/part-consumption'), L('PO/PNA', 'rpt/po-pna'), L('Sales/Dispatch', 'rpt/sales'),
      L('Party Account Status', 'accounts'), L('Stock Details', 'rpt/stock-details'), L('Sales Return', 'rpt/sales-return'), L('Stock Movement', 'rpt/stock-move'),
      L('Profit and  Loss', 'rpt/pnl'), L('Part Price List', 'rpt/part-price'), L('ASC Location', 'find-asp'), L('Expense', 'rpt/expense'),
    ] },
    { label: 'Approvals', icon: ShieldCheck, items: [
      L('ASP Claim Approval', 'claims/approval'), L('Labour Claim Generate', 'claims/generate/Labour'), L('Travel Claim  Generate', 'claims/generate/Travel'),
      L('Partner Claim Generation', 'claims/generate/Partner'), L('ASP Claim Invoice', 'claims/invoices'), L('Vendor PO Approval', 'approvals/vendor-po'),
      L('Request Approval', 'jobs/request-approval'), L('Invoice cancel', 'approvals/invoice-cancel'), L('Job status change', 'jobs/status-change'),
      L('Pending PO Cancel', 'approvals/po-cancel'), L('Stock Adjustment', 'stock-adjustment'),
    ] },
  ],
  'Call Center': [
    { label: 'Home', icon: Home, to: `${B}/home` },
    { label: 'Dashboard', icon: Gauge, items: [L('Call Details', 'dash/call-details')] },
    { label: 'Registration', icon: ClipboardList, items: [
      L('Customer Regisration/Call Booking', 'call-booking'), L('Call Status', 'jobs/call-status'), L('Reassign Jobs', 'jobs/reassign'), L('AMC Search', 'amc'),
    ] },
    { label: 'Find Price', icon: Tag, items: [L('Part search', 'part-search')] },
    { label: 'Product Search', icon: Search, items: [L('Product search', 'product-search')] },
    { label: 'Find ASP', icon: MapPin, items: [L('Find ASP', 'find-asp')] },
    { label: 'Happy Calling', icon: Smile, items: [L('Happy Calling', 'jobs/happy')] },
    { label: 'Help', icon: LifeBuoy, items: [L('Notice', 'notice')] },
    { label: 'Masters', icon: Database, items: [L('Users Master', 'masters/users')] },
    CHANGE_PW,
  ],
  ASP: [
    { label: 'Home', icon: Home, to: `${B}/home` },
    { label: 'Dashboard', icon: Gauge, items: [L('Call Details', 'dash/asp')] },
    { label: 'Jobs', icon: Wrench, items: [
      L('Drop', 'jobs/drop'), L('Jobs/Call Status', 'jobs/asp'), L('Pickup/Drop Jobs', 'jobs/pickup'), L('Reschedule', 'jobs/reschedule'),
      L('OUT Warranty Invoice', 'jobs/out-warranty'), L('Reassign Calls', 'jobs/reassign-eng'), L('Job Details Edit', 'jobs/edit-list'),
    ] },
    { label: 'Sales Invoice', icon: Receipt, items: [L('Invoice', 'retail-invoice/new'), L('Invoice Status', 'retail-invoice')] },
    { label: 'Inventory', icon: Package, items: [
      L('Stock', 'stock'), L('Purchase Order', 'po'), L('PNA bucket', 'pna-bucket'), L('Stock In', 'stock-in'), L('Engineer Stock', 'engineer-stock'),
      L('Purchase Return', 'purchase-return'), L('Faulty/P2C Bin', 'faulty-bin'), L('Faulty Spare Dispatched', 'faulty-dispatched'),
      L('Stock Issue To Engineer', 'eng-issue'), L('Engineer Spare Demand', 'eng-demand'), L('Faulty Return From Engineer', 'eng-faulty'),
    ] },
    { label: 'My Account', icon: Wallet, items: [L('Expense', 'expenses'), L('Add Payment', 'payments'), L('Account Status', 'accounts'), L('Party Ledger', 'ledger')] },
    { label: 'Help', icon: LifeBuoy, items: [L('Notice', 'notice')] },
    { label: 'Reports', icon: FileBarChart, items: [
      L('All Job', 'rpt/all-job'), L('Part Consumption', 'rpt/part-consumption'), L('Sales/Dispatch', 'rpt/sales'), L('Sale Return', 'rpt/sales-return'),
      L('Item Ledger', 'rpt/stock-move'), L('Claim Invoice', 'claims/invoices'), L('Part Price List', 'part-search'), L('Engineer Attandence', 'attendance'),
      L('Profit and Loss', 'rpt/pnl'), L('Expense', 'rpt/expense'), L('Spares Daily Log Book', 'rpt/spares-log'),
    ] },
    { label: 'Masters', icon: Database, items: [L('My Profile', 'profile'), L('User List', 'masters/user-list'), L('Users Master', 'masters/users')] },
    CHANGE_PW,
  ],
  WH: [
    { label: 'Home', icon: Home, to: `${B}/home` },
    { label: 'GRN/Procurement', icon: Warehouse, items: [L('Local', 'grn/local'), L('PO To Vendor', 'vendor-po')] },
    { label: 'Stock In', icon: PackageCheck, items: [
      L('Faulty/Sales Return', 'wh/receive-return'), L('Pending for Gate Entry', 'grn/gate-entry'), L('GRN', 'grn/receive'), L('GRN Status', 'grn/status'),
    ] },
    { label: 'Dispatch', icon: Truck, items: [
      L('Against PNA/MSL PO', 'wh/po'), L('Direct Dispatch To ASP', 'wh/direct-dispatch'), L('STN', 'wh/stn'), L('Invoices/Challans', 'dispatches'),
      L('Dispatch Scrap/Fresh Out', 'wh/scrap-out'),
    ] },
    { label: 'Account', icon: Landmark, items: [
      L('Payment Receive', 'wh/payment-receive'), L('CN Generate', 'wh/cn'), L('Party Ledger', 'ledger'), L('Transfer to Security A/C', 'wh/transfer'),
      L('Account Adjustment', 'wh/adjustment'), L('Request For Reconciliation', 'wh/reconciliation'), L('Stock Adjustment', 'stock-adjustment'),
    ] },
    { label: 'Reports', icon: FileBarChart, items: [
      L('Stock', 'rpt/stock-details'), L('Sale', 'rpt/sales'), L('Pending PO/Indents', 'rpt/po-pna'), L('Sale Return', 'rpt/sales-return'),
      L('GRN Details', 'rpt/grn-details'), L('Tag No Details', 'rpt/tag-details'), L('Part Price List', 'rpt/part-price'), L('Faulty Pending List', 'rpt/faulty-pending'),
    ] },
    CHANGE_PW,
  ],
};

export function getCrmMenu(crmRole) {
  return CRM_MENUS[crmRole] || CRM_MENUS.Admin;
}

/** Every path a role may open (menu items + their detail pages). */
export function allowedPaths(crmRole) {
  return getCrmMenu(crmRole).flatMap((g) => (g.items ? g.items.map((i) => i.to) : [g.to]));
}
