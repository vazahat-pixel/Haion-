import { Monitor, ShoppingCart, Undo2, Truck, PackageCheck } from 'lucide-react';

/**
 * List pages for invoice-type documents, keyed by route path under /distributor.
 * actions: print | view | cancel | dispatch | receive | approve | serials
 */
export const DOC_LISTS = {
  'invoicing/invoices': {
    title: 'Invoice List', icon: Monitor, params: { kind: 'CORPORATE,UPLOAD_BILLING' },
    buttons: [{ label: 'Back to invoicing', to: '/distributor/invoicing/corporate' }],
    cols: ['to', 'from', 'no', 'date', 'po', 'status', 'serials'], actions: ['print', 'view', 'cancel'],
  },
  'invoicing/retail': {
    title: 'Retail Billing List', icon: Monitor, params: { kind: 'RETAIL_LOCATION,RETAIL_CUSTOMER' },
    buttons: [{ label: 'Add Retail Billing To Location', to: '/distributor/new/RETAIL_LOCATION' }, { label: 'Add Retail Billing To Customer', to: '/distributor/new/RETAIL_CUSTOMER' }],
    cols: ['from', 'to', 'no', 'date', 'status', 'serials'], actions: ['print', 'view', 'cancel'], fromFirst: true, labels: { from: 'Billing From', to: 'Billing To' }, order: ['#', 'from', 'to', 'invoiceNo', 'invoiceDate', 'status', 'pr', 'serials', 'vw', 'cn'],
  },
  'invoicing/stn-distribution': {
    title: 'STN Distribution List', icon: Monitor, params: { kind: 'STN', distribution: '1' },
    buttons: [{ label: 'Add STN Distribution', to: '/distributor/invoicing/stn-distribution/new' }],
    cols: ['to', 'from', 'no', 'date', 'entry', 'status'], actions: ['print', 'view'], labels: { to: 'Stock Transfer To', from: 'Stock Transfer From', no: 'Document No.', date: 'Document Date' },
  },
  'invoicing/stock-transfer': {
    title: 'Stock Transfer List', icon: Monitor, params: { kind: 'STN' },
    buttons: [{ label: 'Add Stock Transfer', to: '/distributor/new/STN' }],
    cols: ['to', 'from', 'no', 'date', 'entry', 'status'], actions: ['print', 'view', 'cancel'], labels: { to: 'Stock Transfer To', from: 'Stock Transfer From', no: 'Document No.', date: 'Document Date' },
  },
  'invoicing/jobwork': {
    title: 'Stock Transfer for Job work', icon: Monitor, params: { kind: 'JOBWORK' },
    buttons: [{ label: 'Add Stock Transfer', to: '/distributor/new/JOBWORK' }],
    cols: ['to', 'from', 'no', 'date', 'entry', 'status'], actions: ['print', 'view', 'cancel'], labels: { to: 'Stock Transfer To', from: 'Stock Transfer From', no: 'Document No.', date: 'Document Date' },
  },
  'invoicing/stock-transfer-approval': {
    title: 'Stock Transfer Approval', icon: Monitor, params: { queue: 'approval', kind: 'STN,JOBWORK', status: 'PFA' },
    cols: ['to', 'from', 'no', 'date', 'entry', 'status'], actions: ['approve'], labels: { to: 'Stock Transfer To', from: 'Stock Transfer From', no: 'Document No.', date: 'Document Date' },
  },
  'purchase/local': {
    title: 'Local Purchase', icon: ShoppingCart, params: { kind: 'LOCAL_PURCHASE' },
    buttons: [{ label: 'Add New Local Purchase', to: '/distributor/new/LOCAL_PURCHASE' }],
    cols: ['from', 'to', 'no', 'date', 'entry', 'status', 'serials'], actions: ['print', 'view', 'receive', 'cancel'], fromFirst: true, labels: { from: 'PO From', to: 'PO To', no: 'PO No.', date: 'PO Date', serials: 'Scan Serial No.' },
  },
  'purchase/opening': {
    title: 'Opening Stock List', icon: ShoppingCart, params: { kind: 'OPENING' },
    buttons: [{ label: 'Upload Opening Stock', to: '/distributor/upload/OPENING' }, { label: 'Add New Opening', to: '/distributor/new/OPENING' }],
    cols: ['from', 'no', 'date', 'entry', 'status', 'serials'], actions: ['print', 'view'], labels: { from: 'Location Name', no: 'Doc. No.', date: 'Opening Date', serials: 'Scan Serial No.' },
  },
  'return/customer': {
    title: 'Retail Customer Return List', icon: Undo2, params: { kind: 'CUSTOMER_RETURN' },
    buttons: [{ label: 'Add New Retail Return', to: '/distributor/new/CUSTOMER_RETURN' }],
    cols: ['to', 'from', 'no', 'date', 'status', 'entry'], actions: ['print', 'view', 'cancel'], labels: { to: 'Retail Return To', from: 'Retail Return From', no: 'Invoice No.', date: 'Date' },
  },
  'return/purchase': {
    title: 'Purchase Return List', icon: Undo2, params: { kind: 'PRN' },
    buttons: [{ label: 'Add New Purchase Return', to: '/distributor/new/PRN' }],
    cols: ['to', 'from', 'no', 'date', 'entry', 'serials'], actions: ['print', 'viewedit'], labels: { to: 'Purchase Return To', from: 'Purchase Return From', no: 'Invoice No.', date: 'Date', serials: 'Upload Serial No.' },
  },
  'return/approval': {
    title: 'Return Approval', icon: Undo2, params: { queue: 'approval', kind: 'PRN', status: 'PFA' },
    cols: ['to', 'from', 'no', 'date', 'status'], actions: ['approve'], labels: { to: 'Purchase Return To', from: 'Purchase Return From', no: 'Invoice No.', date: 'Date', approve: 'View/Edit' },
  },
  'return/vendor': {
    title: 'Purchase Return List', icon: Undo2, params: { kind: 'VENDOR_RETURN' },
    buttons: [{ label: 'Add New Purchase Return', to: '/distributor/new/VENDOR_RETURN' }],
    cols: ['to', 'from', 'no', 'date', 'entry', 'serials'], actions: ['view'], labels: { to: 'Purchase Return To', from: 'Purchase Return From', no: 'Ref. No.', date: 'Date', serials: 'Upload Serial No.' },
  },
  'logistic/dispatch': {
    title: 'Update Dispatch', icon: Truck, params: { queue: 'dispatch' },
    cols: ['to', 'from', 'no', 'date', 'po', 'entry', 'status'], actions: ['view', 'dispatch'],
  },
  'receive/location': {
    title: 'Receive Invoice List', icon: PackageCheck, params: { queue: 'receive', kind: 'CORPORATE,UPLOAD_BILLING,RETAIL_LOCATION,STN,PRN' },
    cols: ['from', 'to', 'no', 'date', 'type', 'entry', 'status'], actions: ['print', 'view', 'receive', 'scan'], fromFirst: true, labels: { from: 'Billing From', to: 'Billing To' },
  },
  'receive/jobwork': {
    title: 'Receive Invoice List', icon: PackageCheck, params: { queue: 'receive', kind: 'JOBWORK' },
    cols: ['from', 'to', 'no', 'date', 'type', 'entry', 'status'], actions: ['print', 'view', 'receive'], fromFirst: true, labels: { from: 'Billing From', to: 'Billing To' },
  },
};

export const KIND_LABEL = {
  CORPORATE: 'CORPORATE INVOICE', UPLOAD_BILLING: 'UPLOADED INVOICE', RETAIL_LOCATION: 'RETAIL INVOICE', RETAIL_CUSTOMER: 'RETAIL INVOICE',
  STN: 'STOCK TRANSFER', JOBWORK: 'STOCK TRANSFER (JOB WORK)', PRN: 'PURCHASE RETURN PRN', CUSTOMER_RETURN: 'CUSTOMER RETURN',
  LOCAL_PURCHASE: 'LOCAL PURCHASE', VENDOR_RETURN: 'VENDOR RETURN', OPENING: 'OPENING STOCK',
};

/**
 * Create forms per document kind.
 * from/to: 'loc' (caller's locations), 'anyloc' (all active locations), 'vendor', 'customer', 'none'
 */
export const DOC_FORMS = {
  RETAIL_LOCATION: { title: 'Retail Billing', from: 'loc', to: 'anyloc', fromLabel: 'Billing From', toLabel: 'Billing To', cols: ['discount', 'tax', 'stock', 'serials'], colLabels: { qty: 'Bill Qty', after: 'Value After Discount' }, taxType: true, back: '/distributor/invoicing/retail', submit: 'Process' },
  RETAIL_CUSTOMER: { title: 'Retail Billing', from: 'loc', to: 'customer', fromLabel: 'Billing From', toLabel: 'Customer Name', cols: ['discount', 'tax', 'stock', 'scheme', 'serials'], roundOff: true, back: '/distributor/invoicing/retail', submit: 'Process' },
  STN: { title: 'Add Stock Transfer', from: 'loc', to: 'anyloc', fromLabel: 'Stock Transfer From', toLabel: 'Stock Transfer To', cols: ['discount', 'stock', 'serials'], docType: true, back: '/distributor/invoicing/stock-transfer', submit: 'Save', noTax: true },
  JOBWORK: { title: 'Add Stock Transfer for Job work', from: 'loc', to: 'anyloc', fromLabel: 'Stock Transfer From', toLabel: 'Stock Transfer To', cols: ['discount', 'stock', 'serials'], docType: true, back: '/distributor/invoicing/jobwork', submit: 'Save', noTax: true },
  PRN: { title: 'Add New Purchase Return', from: 'loc', to: 'anyloc', fromLabel: 'Purhase Return From', toLabel: 'Purhase Return To', cols: ['discount', 'tax', 'stock', 'serials'], back: '/distributor/return/purchase', submit: 'Process', toParent: true },
  CUSTOMER_RETURN: { title: 'Add New Retail Return', from: 'customer', to: 'loc', fromLabel: 'Retail Return From', toLabel: 'Retail Return To', cols: ['discount', 'tax', 'serials'], back: '/distributor/return/customer', submit: 'Process', sourceInvoice: true },
  LOCAL_PURCHASE: { title: 'Add New Local Purchase', from: 'vendor', to: 'loc', fromLabel: 'Purchase From', toLabel: 'Purchase To', cols: ['tax', 'serials'], colLabels: { price: 'Price ()' }, ref: true, currency: true, back: '/distributor/purchase/local', submit: 'Save' },
  VENDOR_RETURN: { title: 'Add New Purchase Return', from: 'loc', to: 'vendor', fromLabel: 'Purhase Return From', toLabel: 'Purhase Return To', cols: ['tax', 'stock', 'serials'], ref: true, back: '/distributor/return/vendor', submit: 'Save' },
  OPENING: { title: 'Add Opening Stock', from: 'loc', to: 'none', fromLabel: 'Location Name', cols: ['okdm', 'serials'], ref: true, date: true, back: '/distributor/purchase/opening', submit: 'Save', noTax: true },
  UPLOAD_BILLING: { title: 'Upload Billing', from: 'loc', to: 'anyloc', fromLabel: 'Billing From', toLabel: 'Billing To', cols: ['discount', 'tax', 'stock', 'serials'], back: '/distributor/invoicing/invoices', submit: 'Upload' },
};
