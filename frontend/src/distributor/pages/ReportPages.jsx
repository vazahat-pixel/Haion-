import { useState } from 'react';
import { FileBarChart, Search, Gauge } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { dms, useDmsQuery, useLookups, apiError, fmt } from '../api';
import { PageTitle, DataTable, Field, TextArea, Alert, Btn, Input, Status, exportCsv } from '../components/ui';
import { FilterBar, useOptions } from './MasterPages';
import { readList } from '../excel';

export { exportCsv };

/** Filter options for reports: the same resolver as the master pages (locations, products, categories → sub categories, brands, vendors, schemes …). */
export function useLocProdOpts() {
  const { data } = useLookups();
  return useOptions(data?.data);
}

/** Generic report: filter bar → GO → table (+ Excel/CSV export). */
export function Report({ title, icon = FileBarChart, url, filters, columns, pick = (d) => d, requireGo = true, name, footer, headersBeforeGo = false, groups }) {
  const opts = useLocProdOpts();
  const [params, setParams] = useState(requireGo ? null : {});
  const { data, isFetching, error } = useDmsQuery(`rep-${url}`, url, params, { enabled: params !== null });
  const rows = data ? pick(data.data) : [];
  return (
    <>
      <PageTitle icon={icon}>{title}</PageTitle>
      <FilterBar defs={filters} opts={opts} onGo={setParams} />
      {error && <Alert>{apiError(error).message}</Alert>}
      {params === null && headersBeforeGo && <DataTable columns={columns} rows={[]} rowKey="__k" />}
      {params !== null && !error && (
        <>
          <div style={{ textAlign: 'right', marginBottom: 6 }}><Btn size="sm" variant="default" onClick={() => exportCsv(name || title, columns.filter((c) => c.key !== '#').map((c) => (c.exportLabel ? { ...c, label: c.exportLabel } : c)), rows)}>Export to Excel</Btn></div>
          <DataTable columns={columns} rows={rows} loading={isFetching} rowKey="__k" groups={groups} />
          {footer?.(data?.data)}
        </>
      )}
    </>
  );
}

const loc = (required) => ({ name: 'location', label: 'Location', optionsFrom: 'locations', required });
const dates = [{ name: 'from', label: 'From Date', type: 'date', defaultToday: true }, { name: 'to', label: 'To Date', type: 'date', defaultToday: true }];
// reference report filters: Product Category → Product Sub Category, Brand, Product
const productFilters = [
  { name: 'category', label: 'Product Category', optionsFrom: 'categories' }, { name: 'subCategory', label: 'Product Sub Category', optionsFrom: 'subcategories', dependsOn: 'category' },
  { name: 'brand', label: 'Brand', optionsFrom: 'brands' }, { name: 'product', label: 'Product', optionsFrom: 'products' },
];

// Inventory report waits for GO; the Inventory Dashboard shows product-wise stock straight away (reference columns)
export const InventoryReport = ({ title = 'Inventory', icon, dashboard = false }) => (
  <Report title={title} icon={icon} url="/reports/inventory" requireGo={!dashboard}
    filters={[loc(false), { name: 'inventoryType', label: 'Inventory Type', options: ['IMEI INVENTORY', 'QTY INVENTORY'] }, ...productFilters]}
    columns={dashboard ? [{ key: '#', label: 'S.No.' }, { key: 'productName', label: 'Product', text: (r) => `${r.productName} | ${r.productCode}`, render: (r) => `${r.productName} | ${r.productCode}` }, { key: 'okQty', label: 'Ok Qty', align: 'r' }, { key: 'damageQty', label: 'Damage Qty', align: 'r' }, { key: 'missingQty', label: 'Missing Qty', align: 'r' }] : [{ key: '#', label: 'S.No.' }, { key: 'location', label: 'Location' }, { key: 'productCode', label: 'Product Code' }, { key: 'productName', label: 'Product' }, { key: 'color', label: 'Color' },
      { key: 'type', label: 'Inventory Type', text: (r) => (r.isSerialized ? 'IMEI INVENTORY' : 'QTY INVENTORY'), render: (r) => (r.isSerialized ? 'IMEI INVENTORY' : 'QTY INVENTORY') },
      { key: 'okQty', label: 'Ok Qty', align: 'r' }, { key: 'damageQty', label: 'Damage Qty', align: 'r' }, { key: 'missingQty', label: 'Missing Qty', align: 'r' }]} />
);

export const AgingReport = () => (
  <Report title="Inventory Aging" url="/reports/aging" filters={[...productFilters, loc(false)]} requireGo={false}
    groups={[{ label: '', span: 6 }, { label: '0 - 15 days', span: 3 }, { label: '16 - 30 days', span: 3 }, { label: 'Above 30 days', span: 3 }]}
    columns={[
      { key: '#', label: 'S.No' }, { key: 'location', label: 'Location Name' }, { key: 'locationType', label: 'Location Type' }, { key: 'productCode', label: 'Product Code' },
      { key: 'productName', label: 'Product Name' }, { key: 'nature', label: 'Product Nature' },
      ...[['b0', '0 - 15 days'], ['b16', '16 - 30 days'], ['b31', 'Above 30 days']].flatMap(([b, l]) => ['ok', 'dm', 'ms'].map((k) => ({ key: `${b}${k}`, label: k.toUpperCase(), exportLabel: `${l} ${k.toUpperCase()}`, align: 'r', text: (r) => r[b][k] || 0, render: (r) => r[b][k] || 0 }))),
    ]} />
);

export const StockLedgerReport = () => (
  <Report title="Stock Ledger" url="/reports/stock-ledger" headersBeforeGo filters={[...dates, loc(true), ...productFilters]}
    columns={[
      { key: '#', label: 'S.No' }, { key: 'createdAt', label: 'Date & Time', render: (r) => fmt.dt(r.createdAt), text: (r) => fmt.dt(r.createdAt) },
      { key: 'item', label: 'Item', text: (r) => `${r.product?.name} | ${r.product?.productCode}${r.bucket !== 'OK' ? ` (${r.bucket})` : ''}`, render: (r) => `${r.product?.name} | ${r.product?.productCode}${r.bucket !== 'OK' ? ` (${r.bucket})` : ''}` },
      { key: 'opening', label: 'Opening Stock', align: 'r' }, { key: 'inQty', label: 'In', align: 'r' }, { key: 'outQty', label: 'Out', align: 'r' },
      { key: 'closing', label: 'Closing Stock', align: 'r' }, { key: 'docNo', label: 'System Ref. No.' }, { key: 'docKind', label: 'Transfer Type', text: (r) => String(r.docKind || '').replace(/_/g, ' '), render: (r) => String(r.docKind || '').replace(/_/g, ' ') }, { key: 'counterparty', label: 'Stock Transfer' },
    ]} />
);

/* Column order, captions and number style follow the live reference Party Ledger (verified 19-Nov-2026). */
export const PartyLedgerReport = () => (
  <Report title="Party Ledger" url="/reports/party-ledger" headersBeforeGo filters={[{ name: 'counterparty', label: 'Party Name', optionsFrom: 'allLocations' }, { name: 'vendor', label: 'Vendor Name', optionsFrom: 'vendors' }, { ...loc(true), label: 'Location Name' }, ...dates]} pick={(d) => d.rows}
    footer={(d) => d && <p style={{ textAlign: 'right' }}><b>Total CR:</b> {fmt.amt(d.totalCr)} &nbsp; <b>Total DR:</b> {fmt.amt(d.totalDr)} &nbsp; <b>Opening:</b> {fmt.amt(d.opening)} &nbsp; <b>Closing (DR − CR):</b> {fmt.amt(d.closing)}</p>}
    columns={[
      { key: '#', label: 'SNo.' }, { key: 'locationName', label: 'Location Name' }, { key: 'counterpartyName', label: 'Party Name' }, { key: 'docNo', label: 'Document No.' }, { key: 'docTypeLabel', label: 'Document Type' },
      { key: 'txnDate', label: 'Transaction Date', render: (r) => fmt.dmy(r.txnDate), text: (r) => fmt.dmy(r.txnDate) }, { key: 'createdAt', label: 'Entry Date', render: (r) => fmt.dmy(r.createdAt), text: (r) => fmt.dmy(r.createdAt) },
      { key: 'paymentRemark', label: 'Payment Remark' }, { key: 'approvalRemark', label: 'Approval Remark' },
      { key: 'cr', label: 'Amount CR', align: 'r', render: (r) => fmt.amt(r.cr), text: (r) => fmt.amt(r.cr) }, { key: 'dr', label: 'Amount DR', align: 'r', render: (r) => fmt.amt(r.dr), text: (r) => fmt.amt(r.dr) },
    ]} />
);

const docCols = [
  { key: '#', label: 'S.No' }, { key: 'invoiceNo', label: 'Document No.' }, { key: 'invoiceDate', label: 'Date', render: (r) => fmt.date(r.invoiceDate), text: (r) => fmt.date(r.invoiceDate) },
  { key: 'docType', label: 'Doc Type' }, { key: 'from', label: 'From' }, { key: 'to', label: 'To' }, { key: 'poNo', label: 'PO No.' }, { key: 'productCode', label: 'Product Code' },
  { key: 'productName', label: 'Product' }, { key: 'hsnCode', label: 'HSN' }, { key: 'qty', label: 'Qty', align: 'r' }, { key: 'price', label: 'Price', align: 'r' },
  { key: 'discount', label: 'Discount', align: 'r' }, { key: 'taxable', label: 'Taxable', align: 'r' }, { key: 'tax', label: 'Tax', align: 'r' }, { key: 'total', label: 'Total', align: 'r' },
  { key: 'scheme', label: 'Scheme' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} />, text: (r) => r.status }, { key: 'serials', label: 'Serial No.' },
];
export const SaleReport = () => (
  <Report title="Invoice Report" url="/reports/documents" name="sale_report"
    filters={[...dates, { ...loc(false), label: 'From Location' }, { name: 'toLocation', label: 'To Location', optionsFrom: 'allLocations' }, ...productFilters, { name: 'docType', label: 'Document Type', options: ['INVOICE', 'DELIVERY CHALLAN'] }, { name: 'scheme', label: 'Scheme Name', optionsFrom: 'schemes' }, { name: 'kind', label: 'Sale Type', options: [{ value: 'CORPORATE,UPLOAD_BILLING,RETAIL_LOCATION,RETAIL_CUSTOMER', label: 'All' }, { value: 'CORPORATE,UPLOAD_BILLING', label: 'Corporate' }, { value: 'RETAIL_LOCATION,RETAIL_CUSTOMER', label: 'Retail' }, { value: 'STN,JOBWORK', label: 'Stock Transfer' }] }]}
    columns={docCols} />
);
export const ReturnReport = () => (
  <Report title="Return Report" url="/reports/documents" name="return_report"
    filters={[...dates, { name: 'kind', label: 'Return Type', required: true, options: [{ value: 'PRN', label: 'Purchase Return' }, { value: 'VENDOR_RETURN', label: 'Vendor Return' }, { value: 'CUSTOMER_RETURN', label: 'Customer Return' }] }, { name: 'vendor', label: 'From Vendor', optionsFrom: 'vendors' }, { ...loc(false), label: 'To Vendor' }]}
    columns={docCols} />
);
export const VendorPurchaseReport = () => (
  <Report title="Vendor Purchase" url="/reports/documents" name="vendor_purchase" filters={[...dates, { name: 'vendor', label: 'Select Vendor', optionsFrom: 'vendors' }, { ...loc(false), label: 'Select Location' }, ...productFilters, { name: 'kind', label: 'Type', options: [{ value: 'LOCAL_PURCHASE', label: 'Local / Vendor Purchase' }], placeholder: false }]}
    columns={docCols} />
);
export function PoReport({ dashboard = false }) {
  const opts = useLocProdOpts();
  const [p, setP] = useState(null);
  const { data, isFetching } = useDmsQuery('rep-po', '/po', { ...(p || {}), perPage: 200 }, { enabled: p !== null });
  const columns = [
    { key: '#', label: 'S.No' }, { key: 'poNo', label: 'PO No.' }, { key: 'poDate', label: 'PO Date', render: (r) => fmt.date(r.poDate), text: (r) => fmt.date(r.poDate) },
    { key: 'from', label: 'PO From', text: (r) => fmt.party(r.from), render: (r) => fmt.party(r.from) }, { key: 'to', label: 'PO To', text: (r) => fmt.party(r.to), render: (r) => fmt.party(r.to) },
    { key: 'totalQty', label: 'Qty', align: 'r' }, { key: 'grandTotal', label: 'Amount', align: 'r', render: (r) => fmt.money(r.grandTotal) }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} />, text: (r) => r.status },
  ];
  return (
    <>
      <PageTitle icon={FileBarChart}>{dashboard ? 'Purchase Order (PO) Dashboard' : 'Purchase Report'}</PageTitle>
      <FilterBar defs={dashboard
        ? [{ name: 'poTo', label: 'Purchase Order To', optionsFrom: 'allLocations', required: true }, { name: 'poFrom', label: 'Purchase Order From', optionsFrom: 'allLocations' }, ...dates, { name: 'status', label: 'Status', options: ['PFA', 'Approved', 'Rejected', 'Processed', 'Cancelled'] }]
        : [...dates, { name: 'poTo', label: 'Purchase Order To', optionsFrom: 'allLocations' }, { name: 'poFrom', label: 'Purchase Order From', optionsFrom: 'allLocations' }, { name: 'product', label: 'Product', optionsFrom: 'products' }, { name: 'status', label: 'Status', options: ['PFA', 'Approved', 'Rejected', 'Processed', 'Cancelled'] }]} opts={opts} onGo={setP} />
      {p !== null && <><div style={{ textAlign: 'right', marginBottom: 6 }}><Btn size="sm" variant="default" onClick={() => exportCsv('purchase_report', columns.slice(1), data?.data || [])}>Export to Excel</Btn></div><DataTable columns={columns} rows={data?.data} loading={isFetching} /></>}
    </>
  );
}

/* ── serial track ── */
function SerialTable({ rows }) {
  return (
    <DataTable rowKey="serialNo" rows={rows} columns={[
      { key: '#', label: 'S.No' }, { key: 'serialNo', label: 'Serial No.' },
      { key: 'p', label: 'Product', text: (r) => (r.notFound ? 'Not found' : `${r.product?.name} | ${r.product?.productCode}`), render: (r) => (r.notFound ? <span className="st-PFA">Not found</span> : `${r.product?.name} | ${r.product?.productCode}`) },
      { key: 'status', label: 'Status' }, { key: 'l', label: 'Current Location', text: (r) => r.location?.name || '', render: (r) => r.location?.name || '' },
      { key: 'h', label: 'History', sortable: false, render: (r) => (r.history || []).map((h, i) => <div key={i} style={{ fontSize: 11 }}>{fmt.dt(h.at)} — {h.docNo} ({h.docKind}) {h.from} → {h.to} [{h.status}]</div>) },
    ]} />
  );
}
export function SerialTrack({ multi }) {
  const [txt, setTxt] = useState('');
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState('');
  const go = async (list) => {
    setMsg('');
    try { setRows((await dms.post('/invoices/serials/track', { serials: list })).data); } catch (e) { setMsg(apiError(e).message); }
  };
  const onFile = async (f) => { if (f) setTxt((await readList(f)).join('\n')); };
  return (
    <>
      <PageTitle icon={Search}>{multi ? 'Check Serial No.' : 'Single Serial No. Track'}</PageTitle>
      <Alert>{msg}</Alert>
      <form className="dms-filter" onSubmit={(e) => { e.preventDefault(); go(txt.split(/[\s,;]+/).filter(Boolean)); }}>
        {multi ? (
          <>
            <div style={{ minWidth: 320 }}><Field label="Serial numbers (one per line) or upload a .csv/.txt"><TextArea rows={5} value={txt} onChange={(e) => setTxt(e.target.value)} /></Field></div>
            <div><Field label="Upload Serial No."><Input type="file" accept=".xlsx,.csv,.txt" onChange={(e) => onFile(e.target.files?.[0])} /></Field></div>
          </>
        ) : <div style={{ minWidth: 280 }}><Field label="Enter Serial Number" required><Input required type="search" value={txt} onChange={(e) => setTxt(e.target.value)} /></Field></div>}
        <div><button type="submit" className="dms-btn">{multi ? 'Show' : 'SHOW'}</button></div>
      </form>
      {rows && <SerialTable rows={rows} />}
    </>
  );
}

/* ── dashboards ── */
/**
 * Sale Dashboard as on the reference: Period Type (Year / Month), Year, Month, Location, Product.
 * Year → month-wise sale of that year (per location); Month → day-wise sale of that month.
 */
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = () => { const y = new Date().getFullYear(); return Array.from({ length: 6 }, (_, i) => String(y - i)); };
export function SaleDashboard() {
  const opts = useLocProdOpts();
  const [p, setP] = useState({ type: 'Year', year: String(new Date().getFullYear()) });
  const byYear = p.type !== 'Month';
  const { data, isFetching } = useDmsQuery(byYear ? 'sale-dash-y' : 'sale-dash-m', byYear ? '/x/dash-yearly' : '/x/dash-monthly',
    byYear ? { year: p.year, location: p.location, by: 'Location' } : { year: p.year, month: MONTH_NAMES.indexOf(p.month) + 1, location: p.location, product: p.product });
  const d = data?.data;
  const rows = byYear ? (d?.months || []).map((m, i) => ({ label: m, amount: (d?.series || []).reduce((n, x) => n + (x.amount[i] || 0), 0) })) : (d || []).map((x) => ({ label: String(x.day), amount: x.amount, qty: x.qty }));
  return (
    <>
      <PageTitle icon={Gauge}>Sale Dashboard</PageTitle>
      <FilterBar opts={opts} initial={{ type: 'Year', year: String(new Date().getFullYear()) }}
        onGo={(f) => setP({ type: f.type || 'Year', year: f.year || String(new Date().getFullYear()), month: f.month || MONTH_NAMES[new Date().getMonth()], location: f.location, product: f.product })}
        defs={[{ name: 'type', label: 'Period Type', options: ['Year', 'Month'], placeholder: false }, { name: 'year', label: 'Year', options: YEARS(), placeholder: false },
          { name: 'month', label: 'Month', options: MONTH_NAMES }, loc(false), { name: 'product', label: 'Product', optionsFrom: 'products' }]} />
      <div className="dms-chart"><h4>{byYear ? `Month-wise Sale ${p.year}` : `Day-wise Sale ${p.month || ''} ${p.year}`}{isFetching ? ' …' : ''}</h4>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis width={62} tickFormatter={fmt.short} /><Tooltip /><Legend />
            <Bar dataKey="amount" name="Amount (₹)" fill="#337ab7" />{!byYear && <Bar dataKey="qty" name="Qty (Pcs)" fill="#5cb85c" />}</BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
