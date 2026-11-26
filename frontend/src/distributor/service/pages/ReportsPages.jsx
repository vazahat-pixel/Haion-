/* Dashboards and reports — filters and columns follow the reference report pages. */
import { useParams } from 'react-router-dom';
import { FileBarChart, Gauge, MapPin, Search, Tag, ShieldCheck, UserCheck } from 'lucide-react';
import { ListPage, o, MONTHS, YEARS, B, useLk } from '../kit';

const DATE = { t: 'daterange', label: 'Date Range' };
const REGION = { n: 'region', label: 'Region', o: ['EAST', 'WEST', 'NORTH', 'SOUTH', 'CENTRAL'] };
const STATE = { n: 'state', label: 'State', o: (lk) => o.text(lk.states) };
const ASP = { n: 'location', label: 'Location', o: (lk) => o.loc(lk.asps) };
const ANYLOC = { n: 'location', label: 'Location', o: (lk) => o.loc(lk.locations) };
const BRAND = { n: 'brand', label: 'Brand', o: (lk) => o.named(lk.brands) };
const PRODUCT = { n: 'product', label: 'Product', o: (lk) => o.named(lk.products) };
const MODEL = { n: 'model', label: 'Model', o: (lk, v) => o.model((lk.models || []).filter((m) => (!v.brand || String(m.brand?._id) === v.brand) && (!v.product || String(m.product?._id) === v.product))) };
const PFROM = { n: 'purchaseFrom', label: 'Purchase From', o: (lk) => o.text(lk.purchaseFrom) };
const WARR = { n: 'warranty', label: 'Guarantee Type', o: ['IN', 'OUT'] };
const PBM = [PRODUCT, BRAND, MODEL];
const ageCols = [{ key: 'a0', label: 'Age 0-24' }, { key: 'a1', label: 'Age 25-48' }, { key: 'a2', label: 'Age 49-72' }, { key: 'a3', label: 'Age 73-96' }, { key: 'a4', label: 'Age 96>' }];
const JOB_STATUS = ['Open', 'Asigned', 'PNA', 'SFR', 'EP', 'Repair Done', 'WIP', 'Replacement', 'DOA', 'Handover', 'RWR', 'Cancel', 'BER', 'Received', 'Dispatched', 'QC', 'Installation Done', 'Demo Done', 'Request For Approval', 'Part Demand', 'Acknowledged', 'Appointment', 'Pending For Pickup'];
const SUB_STATUS = ['PNA PO Raised', 'PNA PO Processed', 'PNA PO Partial Processed', 'PNA Part Received', 'SFR Dispatched By ASP', 'Assigned to Engineer', 'PNA at L3/L4', 'Repair Done', 'Estimation Accept', 'Estimation Refused', 'Other Approval', 'Request Approved', 'Request Rejected', 'Pickup Received', 'Call Assigned to pickup Boy', 'Pending For Delivery', 'Issue to Delivery Boy', 'Registered', 'Set Delivered', 'Closed Without Repair', 'Pending'];

const JOB_COLS = [
  { key: 'jobNo', label: 'Job No.' }, { key: 'customerId', label: 'Customer Id.' }, { key: 'customerName', label: 'Customer Name' }, { key: 'contactNo', label: 'Contact No.' },
  { key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product' }, { key: 'model', label: 'Model' }, { key: 'areaType', label: 'Area Type' }, { key: 'serialNo', label: 'Serial No' },
  { key: 'callType', label: 'Call Type' }, { key: 'callSource', label: 'Call Source' }, { key: 'warrantyStatus', label: 'Warranty' }, { key: 'openDate', label: 'Open Date', t: 'date' },
  { key: 'closeDate', label: 'Close Date', t: 'date' }, { key: 'ageing', label: 'Ageing (Days)' }, { key: 'status', label: 'Status' }, { key: 'subStatus', label: 'Sub Status' },
  { key: 'location', label: 'Assign location' }, { key: 'state', label: 'State' }, { key: 'engineer', label: 'Engineer' }, { key: 'pendingReason', label: 'Pending Reason' },
];
const DISP_COLS = [
  { key: 'docNo', label: 'Document No.' }, { key: 'docDate', label: 'Document Date', t: 'date' }, { key: 'docType', label: 'Document Type' }, { key: 'from', label: 'From Location' }, { key: 'fromState', label: 'From State' },
  { key: 'to', label: 'To Location' }, { key: 'toState', label: 'To State' }, { key: 'product', label: 'Product' }, { key: 'brand', label: 'Brand' }, { key: 'partcode', label: 'Partcode' },
  { key: 'partName', label: 'Part Name' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Price', t: 'money' }, { key: 'total', label: 'Total', t: 'money' }, { key: 'status', label: 'Status' },
];
const TAT = (first) => [...first, { key: 'total', label: 'Complaint Upto Month' }, { key: 'completed', label: 'Completed Upto Month' }, { key: 'cancel', label: 'Cancel' }, { key: 'open', label: 'Open' }, { key: 'assign', label: 'Assign' }, { key: 'pending', label: 'Pending' }, ...ageCols, { key: 'tat', label: 'Tat %' }];

export const REPORT_CFG = {
  /* Admin dashboards */
  'job-status': { title: 'Job Summary', icon: Gauge, report: 'job-summary', filters: [REGION, STATE, DATE, ASP],
    columns: [{ key: 'location', label: 'Location' }, { key: 'code', label: 'Code' }, { key: 'state', label: 'State' }, ...['Registered', 'Assigned', 'Pending', 'PNA', 'Repair Done', 'Set Delivered', 'Cancel'].map((k) => ({ key: k, label: k })), { key: 'total', label: 'Total' }] },
  'pending-ageing': { title: 'Pending calls with ageing', icon: Gauge, report: 'pending-ageing', filters: [DATE, STATE, ASP, BRAND, PFROM, PRODUCT, MODEL, WARR],
    columns: [{ key: 'state', label: 'State' }, { key: 'location', label: 'ASP Name' }, { key: 'code', label: 'ASP Code' }, { key: 'open', label: 'Open' }, { key: 'assign', label: 'Assign' }, { key: 'pending', label: 'Pending' }, ...ageCols, { key: 'total', label: 'Total' }] },
  'closed-tat': { title: 'Closed calls TAT', icon: Gauge, report: 'closed-tat', filters: [DATE, STATE, ASP, BRAND, PFROM, PRODUCT, MODEL, WARR],
    columns: [{ key: 'state', label: 'State' }, { key: 'location', label: 'ASP Name' }, { key: 'code', label: 'ASP Code' }, { key: 'completed', label: 'Completed' }, { key: 'in48', label: '0 to 48 (Hr)' }, { key: 'tat', label: 'Tat %' }] },
  'brand-asp': { title: 'Brand ASP Mapping', icon: Gauge, report: 'brand-asp',
    columns: [{ key: 'location', label: 'ASP Name' }, { key: 'code', label: 'ASP Code' }, { key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'brands', label: 'Brands' }, { key: 'products', label: 'Products' }, { key: 'jobs', label: 'Jobs' }] },
  'asp-parts-sales': { title: 'ASP Parts Sales', icon: Gauge, report: 'asp-parts-sales', filters: [STATE, ASP, BRAND, PFROM, PRODUCT, DATE], columns: DISP_COLS },
  'state-ageing': { title: 'Daily Active Pending Complaints State Product Wise', icon: Gauge, report: 'state-ageing-model', filters: [DATE, PRODUCT, BRAND, MODEL],
    columnsFrom: (rows) => [{ key: 'model', label: 'Model' }, { key: 'product', label: 'Product' }, ...[...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => !['model', 'product', 'total'].includes(k))))].map((k) => ({ key: k, label: k })), { key: 'total', label: 'Total' }] },
  'asp-tat': { title: 'Daily All Complaints Aging Wise', icon: Gauge, report: 'asp-tat', filters: [DATE, STATE], columns: TAT([{ key: 'state', label: 'State' }, { key: 'location', label: 'ASP Name' }, { key: 'code', label: 'ASP Code' }]) },
  'state-tat': { title: 'Daily TAT% State Wise', icon: Gauge, report: 'state-tat', filters: [DATE, STATE],
    columns: [{ key: 'state', label: 'State' }, { key: 'completed', label: 'Completed' }, { key: 'open', label: 'Open' }, { key: 'assign', label: 'Assign' }, { key: 'pending', label: 'Pending' }, { key: 'cancel', label: 'cancel' }, { key: 'replacement', label: 'Replacement' }, { key: 'in48', label: '0 to 48 (Hr)' }, { key: 'total', label: 'Grand Total' }, { key: 'tat', label: 'Tat %' }] },
  'faulty-model': { title: 'Defect Model Report', icon: Gauge, report: 'faulty-model', filters: [STATE, ASP, BRAND, PRODUCT, MODEL, DATE],
    columns: [{ key: 'model', label: 'Model' }, { key: 'product', label: 'Product' }, { key: 'brand', label: 'Brand' }, { key: 'fault', label: 'Defect' }, { key: 'count', label: 'Count' }] },
  /* Call centre / ASP dashboards */
  'call-details': { title: 'Call Details', icon: Gauge, report: 'call-details', filters: [DATE],
    columns: [{ key: 'name', label: 'Call Details' }, { key: 'total', label: 'Total Call Login' }, { key: 'self', label: 'Total Self Call' }, { key: 'share', label: 'Total Share Call %' }] },
  asp: { title: 'Call Details', icon: Gauge, report: 'asp-dashboard', filters: [DATE, BRAND, PRODUCT, MODEL],
    columns: [{ key: 'engineer', label: 'Engineer Name' }, { key: 'assigned', label: 'Assigned Call' }, { key: 'pna', label: 'PNA Call' }, { key: 'demo', label: 'Demo Call' }, { key: 'installation', label: 'Installation Call' }, { key: 'repairDone', label: 'Repair Done' }, { key: 'confirmation', label: 'Confimation Done' }] },
  /* Reports */
  'all-job': { title: 'All Call', icon: FileBarChart, report: 'all-job', auto: false,
    filters: [DATE, { n: 'pending', label: 'All pending:', t: 'check' }, REGION, STATE, ASP, PRODUCT, BRAND, MODEL, { n: 'status', label: 'Status', o: JOB_STATUS }, { n: 'subStatus', label: 'Sub Status', o: SUB_STATUS }], columns: JOB_COLS },
  'part-consumption': { title: 'Part Consume', icon: FileBarChart, report: 'part-consumption', auto: false, filters: [DATE, STATE, ASP, PRODUCT, BRAND, MODEL],
    columns: [{ key: 'jobNo', label: 'Job No.' }, { key: 'location', label: 'Location' }, { key: 'state', label: 'State' }, { key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product' }, { key: 'model', label: 'Model' }, { key: 'serialNo', label: 'Serial No' }, { key: 'faultCode', label: 'Fault' }, { key: 'repairCode', label: 'Repair' }, { key: 'partcode', label: 'Partcode' }, { key: 'partName', label: 'Part Name' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Price', t: 'money' }, { key: 'warrantyStatus', label: 'Warranty' }, { key: 'engineer', label: 'Engineer' }, { key: 'closeDate', label: 'Close Date', t: 'date' }, { key: 'handoverDate', label: 'Handover Date', t: 'date' }] },
  'po-pna': { title: 'Pending PO', icon: FileBarChart, report: 'po-pna', filters: [DATE, { n: 'poStatus', label: 'Status', o: [{ value: 'Pending,Partial Processed', label: 'Pending' }, { value: 'Dispatched,Received', label: 'Dispatch' }] }, ASP, { n: 'type', label: 'Type', o: [{ value: 'PNA', label: 'PNA' }, { value: 'MSL', label: 'MSL' }] }],
    columns: [{ key: 'poNo', label: 'PO No.' }, { key: 'poDate', label: 'PO Date', t: 'date' }, { key: 'poType', label: 'PO Type' }, { key: 'location', label: 'Location Name' }, { key: 'code', label: 'Location Code' }, { key: 'cityState', label: 'City/State' }, { key: 'to', label: 'To Location' }, { key: 'jobNo', label: 'Job No.' }, { key: 'partcode', label: 'Partcode' }, { key: 'partName', label: 'Part Name' }, { key: 'reqQty', label: 'Req Qty' }, { key: 'dispQty', label: 'Dispatch Qty' }, { key: 'pendingQty', label: 'Pending Qty' }, { key: 'ageing', label: 'Ageing' }, { key: 'status', label: 'Status' }] },
  sales: { title: 'Sale Report', icon: FileBarChart, report: 'sales', filters: [DATE, { n: 'fromLocation', label: 'From Location', o: (lk) => o.loc(lk.locations) }, { n: 'toLocation', label: 'To Location', o: (lk) => o.loc(lk.locations) }, PRODUCT, BRAND], columns: DISP_COLS },
  'sales-return': { title: 'Sale Return', icon: FileBarChart, report: 'sales-return', filters: [DATE, { n: 'fromLocation', label: 'From Location', o: (lk) => o.loc(lk.locations) }, { n: 'toLocation', label: 'To Location', o: (lk) => o.loc(lk.locations) }, PRODUCT, BRAND], columns: DISP_COLS },
  'stock-details': { title: 'Stock Status', icon: FileBarChart, report: 'stock-details', filters: [PRODUCT, BRAND, ANYLOC],
    columns: [{ key: 'partcode', label: 'Partcode' }, { key: 'description', label: 'Description' }, { key: 'product', label: 'Product' }, { key: 'brand', label: 'Brand' }, { key: 'model', label: 'Mapped Model' }, { key: 'customerPrice', label: 'Customer Price', t: 'money' }, { key: 'mount', label: 'Mount' }, { key: 'fresh', label: 'Fresh' }, { key: 'defective', label: 'Defective' }, { key: 'damage', label: 'Damage' }, { key: 'missing', label: 'Missing' }, { key: 'msl', label: 'MSL' }, { key: 'freshInTransit', label: 'Fresh In-transit' }, { key: 'defectiveInTransit', label: 'Defective In-Transit' }, { key: 'engStock', label: 'Engineer Stock' }, { key: 'total', label: 'Total' }, { key: 'location', label: 'Location' }] },
  'stock-move': { title: 'Stock Movement', icon: FileBarChart, report: 'stock-move', filters: [DATE, ANYLOC],
    columns: [{ key: 'partcode', label: 'Partcode' }, { key: 'description', label: 'Description' }, { key: 'product', label: 'Product' }, { key: 'brand', label: 'Brand' }, { key: 'location', label: 'Location' }, { key: 'ledger', label: 'Ledger' }, { key: 'opening', label: 'Opening' }, { key: 'stockIn', label: 'Stock In' }, { key: 'poDispatch', label: 'PO Dispatch' }, { key: 'srnIn', label: 'SRN IN' }, { key: 'srnOut', label: 'SRN OUT' }, { key: 'adjPlus', label: 'Adjustment Plus' }, { key: 'adjMinus', label: 'Adjustment Minus' }, { key: 'toEng', label: 'Stock Issue To ENG' }, { key: 'fromEng', label: 'Receive From ENG' }, { key: 'consumed', label: 'Consumed' }, { key: 'close', label: 'Close' }] },
  pnl: { title: 'Profit & Loss Account', icon: FileBarChart, report: 'pnl', auto: false,
    filters: [{ n: 'month', label: 'Month', o: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })), req: true }, { n: 'year', label: 'Year', o: YEARS, req: true }],
    columns: [{ key: 'head', label: 'Account Head' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount', t: 'money' }] },
  'part-price': { title: 'Partcode Search', icon: Tag, report: 'part-price', filters: [PRODUCT, BRAND, MODEL],
    columns: [{ key: 'partcode', label: 'Partcode' }, { key: 'hsn', label: 'HSN Code' }, { key: 'model', label: 'Model Name' }, { key: 'partName', label: 'Part Name' }, { key: 'vendorPartcode', label: 'Vendor Partcode' }, { key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product' }, { key: 'category', label: 'Part Category' }, { key: 'customerPrice', label: 'Customer Price', t: 'money' }, { key: 'locationPrice', label: 'Distributor Price', t: 'money' }] },
  expense: { title: 'Expense Report', icon: FileBarChart, url: '/expenses',
    columns: [{ key: 'refNo', label: 'System Ref No.' }, { key: 'payeeName', label: 'Payee Name' }, { key: 'voucherType', label: 'Voucher Type/Account Head' }, { key: 'expenseDate', label: 'Expense Date', t: 'date' }, { key: 'amount', label: 'Amount', t: 'money' }, { key: 'status', label: 'Status' }, { key: 'loc', label: 'Location', render: (r) => r.location?.name, text: (r) => r.location?.name }] },
  'spares-log': { title: 'Spares Log Book', icon: FileBarChart, report: 'spares-log', filters: [DATE],
    columns: [{ key: 'date', label: 'Date', t: 'dt' }, { key: 'partcode', label: 'Partcode' }, { key: 'partName', label: 'Part Name' }, { key: 'txnType', label: 'Transaction' }, { key: 'refNo', label: 'Ref No.' }, { key: 'opening', label: 'Opening' }, { key: 'qty', label: 'Qty' }, { key: 'closing', label: 'Closing' }, { key: 'by', label: 'By' }] },
  'grn-details': { title: 'GRN Report', icon: FileBarChart, report: 'grn-details', filters: [DATE],
    columns: [{ key: 'grnNo', label: 'GRN No.' }, { key: 'grnDate', label: 'GRN Date', t: 'date' }, { key: 'poNo', label: 'PO No.' }, { key: 'supplier', label: 'Supplier' }, { key: 'shipTo', label: 'Location' }, { key: 'invoiceNo', label: 'Invoice No' }, { key: 'partcode', label: 'Partcode' }, { key: 'partName', label: 'Part Name' }, { key: 'qty', label: 'Qty' }, { key: 'okQty', label: 'OK' }, { key: 'damageQty', label: 'Damage' }, { key: 'missingQty', label: 'Missing' }, { key: 'total', label: 'Amount', t: 'money' }] },
  'tag-details': { title: 'TAG/ Serial No Details', icon: FileBarChart, report: 'tag-details', filters: [{ n: 'tagStatus', label: 'Status', o: ['All', 'Available', 'Dispatch'], ph: false }],
    columns: [{ key: 'serial', label: 'TAG/Serial No' }, { key: 'partcode', label: 'Partcode' }, { key: 'model', label: 'Model' }, { key: 'grnNo', label: 'Grn No.' }, { key: 'history', label: 'History' }] },
  'faulty-pending': { title: 'Faulty Pending List', icon: FileBarChart, report: 'faulty-pending', filters: [ASP],
    columns: [{ key: 'location', label: 'Location Name' }, { key: 'jobNo', label: 'Job No' }, { key: 'imei', label: 'IMEI' }, { key: 'model', label: 'Model' }, { key: 'part', label: 'Part' }, { key: 'status', label: 'Status' }] },
};

export function ReportPage({ rkey }) {
  const { key: pk } = useParams();
  const key = rkey || pk;
  const cfg = REPORT_CFG[key];
  if (!cfg) return <div className="dms-loading">Unknown report</div>;
  return <ReportView key={key} cfg={cfg} />;
}

function ReportView({ cfg }) {
  return <ListPage title={cfg.title} icon={cfg.icon} filters={cfg.filters} report={cfg.report} url={cfg.url} auto={cfg.auto !== false} columns={cfg.columnsFrom || cfg.columns} />;
}

/* Search pages */
export const FindAspPage = () => (
  <ListPage title="Find ASC" icon={MapPin} url="/reports/asc-locations" filters={[{ n: 'state', label: 'State', o: (lk) => o.text(lk.states) }, { n: 'city', label: 'City', o: (lk) => o.text(lk.cities) }, { n: 'pincode', label: 'Search By Pin Code:', t: 'text' }]}
    columns={[{ key: 'name', label: 'Name' }, { key: 'billingAddress', label: 'Address' }, { key: 'contact', label: 'Contact Info', render: (r) => `${r.contactPerson || ''} ${r.phone || ''} ${r.email || ''}`, text: (r) => `${r.contactPerson || ''} ${r.phone || ''} ${r.email || ''}` },
      { key: 'pincode', label: 'Mapped Pin Code' }, { key: 'brands', label: 'Brands', render: () => 'All' }, { key: 'product', label: 'Product', render: () => 'All' }, { key: 'holiday', label: 'Additional Holiday', render: () => 'Sunday' }, { key: 'time', label: 'Woking Time', render: () => '10:00 AM TO 7:00 PM' }]} />
);

export const PartSearchPage = () => (
  <ListPage title="Part Search" icon={Tag} report="part-price" auto={false} filters={[{ ...PRODUCT, label: 'Product Name', req: true, ph: '--Please Select--' }, { ...BRAND, req: true, ph: '--Select Brand--' }, MODEL]}
    columns={[{ key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product Category' }, { key: 'model', label: 'Model Name' }, { key: 'partName', label: 'Part Name' }, { key: 'partcode', label: 'Partcode' }, { key: 'hsn', label: 'HSN Code' }, { key: 'vendorPartcode', label: 'Vendor Partcode' }, { key: 'customerPrice', label: 'Customer Price', t: 'money' }, { key: 'warrantyDays', label: 'Customer Warranty Days' }, { key: 'dealerWarrantyDays', label: 'Dealar Warranty Days' }, { key: 'availability', label: 'Availability' }]} />
);

export const ProductSearchPage = () => (
  <ListPage title="Product Search" icon={Search} report="product-search" auto={false} filters={[{ ...PRODUCT, label: 'Product Name', req: true, ph: '--Please Select--' }, { ...BRAND, req: true, ph: '--Select Brand--' }, MODEL]}
    columns={[{ key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product Category' }, { key: 'model', label: 'Model Name' }, { key: 'warrantyDays', label: 'Warranty Days(IN Days)' }, { key: 'terms', label: 'Terms And Condition' }]} />
);

export function AmcSearchPage() {
  useLk();
  return (
    <ListPage title="AMC Status" icon={ShieldCheck} url="/amc"
      rowsOf={(rows) => rows.map((r) => ({ ...r, productName: r.product?.name, brandName: r.brand?.name, modelName: r.model?.modelName, customerName: r.customer?.name, phone: r.customer?.phone }))}
      columns={[{ key: 'amcNo', label: 'AMC No.' }, { key: 'serialNo', label: 'IMEI/Serial No.' }, { key: 'productName', label: 'Product' }, { key: 'brandName', label: 'Brand' }, { key: 'modelName', label: 'Model' }, { key: 'amcStartDate', label: 'AMC Effective Date', t: 'date' }, { key: 'amcExpiryDate', label: 'AMC Expiry Date', t: 'date' }, { key: 'customerName', label: 'Customer Name' }, { key: 'phone', label: 'Mobile Number' }, { key: 'amcType', label: 'AMC Type' }, { key: 'amcAmount', label: 'AMC Amount', t: 'money' }, { key: 'amcStatus', label: 'Approval' }]} />
  );
}

export const AttendancePage = () => (
  <ListPage title="Enigeer Attandence" icon={UserCheck} url="/attendance" rowsOf={(rows) => rows.map((r) => ({ ...r, name: r.engineer ? `${r.engineer.displayName} (${r.engineer.loginId})` : '' }))}
    columns={[{ key: 'name', label: 'Engineer Name' }, { key: 'inAt', label: 'IN Date', t: 'dt' }, { key: 'inAddress', label: 'In Address' }, { key: 'outAt', label: 'Out Date', t: 'dt' }, { key: 'outAddress', label: 'Out Address' }]} empty="No attendance marked yet (engineers mark IN/OUT from the engineer app)" />
);

export const reportLink = (k) => `${B}/rpt/${k}`;
