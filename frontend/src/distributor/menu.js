import {
  Home, Gauge, Database, FileBarChart, Truck, Monitor, ShoppingCart, Undo2, Briefcase, PackageCheck, KeyRound,
} from 'lucide-react';

/**
 * Sidebar, in the reference's group order. `page` = server page-right key.
 * Sale Force, General Query, App Transaction and HRMS groups from the reference are
 * not part of this build yet (pending client scope sign-off) and are therefore not shown.
 */
export const MENU = [
  { label: 'Home', icon: Home, color: '#f0ad4e', to: '/distributor/home', page: 'home' },
  {
    label: 'Dashboard', icon: Gauge, color: '#5bc0de', items: [
      { label: 'Inventory', to: '/distributor/dashboard/inventory', page: 'dash_inventory' },
      { label: 'Purchase', to: '/distributor/dashboard/purchase', page: 'dash_po' },
      { label: 'Sale', to: '/distributor/dashboard/sale', page: 'dash_sale' },
    ],
  },
  {
    label: 'Master Management', icon: Database, color: '#5bc0de', items: [
      { label: 'Admin/Users', to: '/distributor/masters/users', page: 'm_users' },
      { label: 'Brand Master', to: '/distributor/masters/brand', page: 'm_brand' },
      { label: 'City Master', to: '/distributor/masters/city', page: 'm_city' },
      { label: 'Color Master', to: '/distributor/masters/color', page: 'm_color' },
      { label: 'Courier Master', to: '/distributor/masters/courier', page: 'm_courier' },
      { label: 'Customer Master', to: '/distributor/masters/customers', page: 'm_customer' },
      { label: 'Location Master', to: '/distributor/masters/locations', page: 'm_location' },
      { label: 'Price Master', to: '/distributor/masters/prices', page: 'm_price' },
      { label: 'Product Category', to: '/distributor/masters/category', page: 'm_category' },
      { label: 'Product Master', to: '/distributor/masters/products', page: 'm_product' },
      { label: 'Product Sub Category', to: '/distributor/masters/subcategory', page: 'm_subcategory' },
      { label: 'Scheme Master', to: '/distributor/masters/schemes', page: 'm_scheme' },
      { label: 'State Master', to: '/distributor/masters/state', page: 'm_state' },
      { label: 'Tax Master', to: '/distributor/masters/hsn', page: 'm_tax' },
      { label: 'Vendor Master', to: '/distributor/masters/vendors', page: 'm_vendor' },
    ],
  },
  {
    label: 'Report Master', icon: FileBarChart, color: '#5bc0de', items: [
      { label: 'Inventory', to: '/distributor/reports/inventory', page: 'r_inventory' },
      { label: 'Inventory Aging', to: '/distributor/reports/aging', page: 'r_aging' },
      { label: 'Party Ledger', to: '/distributor/reports/party-ledger', page: 'r_ledger' },
      { label: 'Purchase Order', to: '/distributor/reports/purchase', page: 'r_po' },
      { label: 'Return', to: '/distributor/reports/return', page: 'r_return' },
      { label: 'Sale Report', to: '/distributor/reports/sale', page: 'r_sale' },
      { label: 'Stock Ledger List', to: '/distributor/reports/stock-ledger', page: 'r_stock_ledger' },
      { label: 'Vendor Purchase', to: '/distributor/reports/vendor', page: 'r_vendor' },
    ],
  },
  {
    label: 'Logistic', icon: Truck, color: '#5bc0de', items: [
      { label: 'Update Dispatch', to: '/distributor/logistic/dispatch', page: 'dispatch' },
    ],
  },
  {
    label: 'Invoicing', icon: Monitor, color: '#5bc0de', items: [
      { label: 'Corporate', to: '/distributor/invoicing/corporate', page: 'corporate' },
      { label: 'Multiple Serial No. Track', to: '/distributor/invoicing/multi-serial-track', page: 'serial_track_multi' },
      { label: 'Retail', to: '/distributor/invoicing/retail', page: 'retail' },
      { label: 'Single Serial No. Track', to: '/distributor/invoicing/serial-track', page: 'serial_track' },
      { label: 'Stock Transfer', to: '/distributor/invoicing/stock-transfer', page: 'stock_transfer' },
      { label: 'Stock Transfer Approval', to: '/distributor/invoicing/stock-transfer-approval', page: 'stock_transfer_approval' },
      { label: 'Stock Transfer for Job work', to: '/distributor/invoicing/jobwork', page: 'jobwork' },
    ],
  },
  {
    label: 'Purchase', icon: ShoppingCart, color: '#5bc0de', items: [
      { label: 'Local Purchase', to: '/distributor/purchase/local', page: 'local_purchase' },
      { label: 'Opening', to: '/distributor/purchase/opening', page: 'opening' },
      { label: 'PO', to: '/distributor/purchase/po', page: 'po' },
      { label: 'PO Approval', to: '/distributor/purchase/po-approval', page: 'po_approval' },
      { label: 'Vendor', to: '/distributor/purchase/vendor', page: 'vendor_po' },
    ],
  },
  {
    label: 'Return', icon: Undo2, color: '#5bc0de', items: [
      { label: 'Customer Return', to: '/distributor/return/customer', page: 'customer_return' },
      { label: 'Purchase', to: '/distributor/return/purchase', page: 'purchase_return' },
      { label: 'Return Approval', to: '/distributor/return/approval', page: 'return_approval' },
      { label: 'Vendor', to: '/distributor/return/vendor', page: 'vendor_return' },
    ],
  },
  {
    label: 'Payment', icon: Briefcase, color: '#5bc0de', items: [
      { label: 'Account Adjustment', to: '/distributor/payment/adjustment', page: 'acc_adjust' },
      { label: 'Payment Approval', to: '/distributor/payment/approval', page: 'payment_approval' },
      { label: 'Payment Receive', to: '/distributor/payment/receive', page: 'payment_receive' },
    ],
  },
  {
    label: 'Receive Stock', icon: PackageCheck, color: '#5bc0de', items: [
      { label: 'From Location', to: '/distributor/receive/location', page: 'receive' },
      { label: 'Received from Jobwork', to: '/distributor/receive/jobwork', page: 'receive_jobwork' },
    ],
  },
  { label: 'Change Password', icon: KeyRound, color: '#5bc0de', to: '/distributor/change-password', page: null },
];

export function filterMenu(pages = [], isAdmin = false) {
  const can = (p) => isAdmin || p === null || pages.includes(p);
  return MENU.map((g) => (g.items ? { ...g, items: g.items.filter((i) => can(i.page)) } : g))
    .filter((g) => (g.items ? g.items.length > 0 : can(g.page)));
}
