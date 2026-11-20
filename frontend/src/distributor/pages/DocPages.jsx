import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { FileText, Truck, PackageCheck, ShoppingCart } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, apiError, fmt } from '../api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, Alert, Panel, KV, Status,
  ViewLink, PrintLink, CancelBtn, Modal, locOpt,
} from '../components/ui';
import { LineItems, TotalsBox, emptyLine, previewTotals, toPayloadLines, splitSerials } from '../components/LineItems';
import { useFormCtx, ActionLog } from './PoPages';
import { readSheet, downloadTemplate } from '../excel';
import { DOC_LISTS, DOC_FORMS, KIND_LABEL } from './doc.config';

/* ───────────── list ───────────── */
export function DocList({ listKey }) {
  const { pathname } = useLocation();
  const key = listKey || pathname.replace('/distributor/', '');
  const cfg = DOC_LISTS[key];
  const list = useListState();
  const { data, isFetching } = useDmsQuery(`doc-${key}`, '/invoices', { ...list.params, ...(cfg?.params || {}) }, { enabled: Boolean(cfg) });
  const [conf, setConf] = useState(null);
  const cancel = useDmsMutation((b) => dms.post(`/invoices/${b.id}/cancel`, { remark: b.remark }));
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const L = { to: 'Invoice To', from: 'Invoice From', no: 'Invoice No.', date: 'Invoice Date', ...(cfg.labels || {}) };
  const C = {
    to: { key: 'to', label: L.to, text: (r) => fmt.party(r.to), render: (r) => fmt.party(r.to) },
    from: { key: 'from', label: L.from, text: (r) => fmt.party(r.from), render: (r) => fmt.party(r.from) },
    no: { key: 'invoiceNo', label: L.no },
    ref: { key: 'refNo', label: L.ref || 'Vendor Inv. No.' },
    src: { key: 'sourceInvoiceNo', label: 'Invoice No.' },
    date: { key: 'invoiceDate', label: L.date, render: (r) => fmt.date(r.invoiceDate) },
    po: { key: 'poNo', label: 'PO No.' },
    entry: { key: 'entryBy', label: 'Entry By' },
    type: { key: 'kind', label: 'Invoice Type', render: (r) => KIND_LABEL[r.kind] },
    status: { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
    // Reference "IMEI Attached" column: a print icon that opens the serial list (print_imei.php).
    serials: { key: 'serialsAttached', label: L.serials || 'IMEI Attached', align: 'c', sortable: false, text: (r) => r.serialsAttached || 0, render: (r) => (r.serialsAttached ? <PrintLink to={`/distributor/print/imei/${r._id}`} /> : null) },
  };
  const A = {
    print: { key: 'pr', label: 'Print', sortable: false, align: 'c', render: (r) => <PrintLink to={`/distributor/print/doc/${r._id}`} /> },
    view: { key: 'vw', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/doc/${r._id}`} /> },
    cancel: { key: 'cn', label: 'Cancel', sortable: false, align: 'c', render: (r) => (['PFA', 'Pending'].includes(r.status) && !(r.paidAmount > 0) ? <CancelBtn onClick={() => setConf({ id: r._id, no: r.invoiceNo, remark: '' })} /> : null) },
    dispatch: { key: 'up', label: 'Update', sortable: false, align: 'c', render: (r) => (['Pending', 'Dispatched'].includes(r.status) ? <Btn size="sm" to={`/distributor/doc/${r._id}/dispatch`}>Update</Btn> : null) },
    receive: { key: 'rc', label: 'Receive', sortable: false, align: 'c', render: (r) => (['Pending', 'Dispatched'].includes(r.status) ? <Btn size="sm" to={`/distributor/doc/${r._id}/receive`}>Receive</Btn> : null) },
    approve: { key: 'ap', label: L.approve || 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/doc/${r._id}/approve`} /> },
    viewedit: { key: 've', label: 'View/Edit', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/doc/${r._id}`} /> },
    scan: { key: 'sc', label: 'Receive Stock By Scanning', sortable: false, align: 'c', render: (r) => (['Pending', 'Dispatched'].includes(r.status) ? <Btn size="sm" to={`/distributor/doc/${r._id}/receive?scan=1`}>Scan</Btn> : null) },
  };
  const unordered = [{ key: '#', label: 'S.No' }, ...cfg.cols.map((c) => C[c]), ...cfg.actions.map((a) => A[a])];
  const columns = cfg.order ? cfg.order.map((k) => unordered.find((c) => c.key === k || (k === 'serials' && c.key === 'serialsAttached'))).filter(Boolean) : unordered;
  const Icon = cfg.icon;
  return (
    <>
      <PageTitle icon={Icon}>{cfg.title}</PageTitle>
      {cfg.buttons && <Toolbar>{cfg.buttons.map((b) => <Btn key={b.to} to={b.to}>{b.label}</Btn>)}</Toolbar>}
      <DataTable loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps} columns={columns} />
      <Modal open={Boolean(conf)} title={`Cancel ${conf?.no}`} onClose={() => setConf(null)}
        footer={<><Btn variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(conf, { onSuccess: () => setConf(null) })}>Yes, Cancel</Btn><Btn variant="default" onClick={() => setConf(null)}>Close</Btn></>}>
        <p>Cancelling returns the stock to the source location and reverses the ledger entry. This cannot be undone.</p>
        <Field label="Remark"><TextArea value={conf?.remark || ''} onChange={(e) => setConf({ ...conf, remark: e.target.value })} /></Field>
      </Modal>
    </>
  );
}

/* ───────────── create form ───────────── */
function useCustomers(location) {
  return useDmsQuery('cust', '/customers', { location, status: 'Active', perPage: 100 }, { enabled: Boolean(location) });
}

export function DocForm() {
  const { kind } = useParams();
  const cfg = DOC_FORMS[kind];
  const nav = useNavigate();
  const [v, setV] = useState({ from: '', to: '', docType: 'INVOICE', taxType: 'Productwise Tax', discountType: 'Productwise Discount', billDiscount: '', currency: 'INR', refNo: '', refDate: '', invoiceDate: '', deliveryAddress: '', remark: '', sourceInvoice: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const stockLoc = cfg?.from === 'loc' ? v.from : null;
  const ctx = useFormCtx(stockLoc);
  const { lk } = ctx;
  const custLoc = cfg?.to === 'customer' ? v.from : cfg?.from === 'customer' ? v.to : null;
  const { data: customers } = useCustomers(custLoc);
  const { data: srcInvoices } = useDmsQuery('src-inv', '/invoices', { kind: 'RETAIL_CUSTOMER', customer: v.from, perPage: 100 }, { enabled: Boolean(cfg?.sourceInvoice && v.from) });
  const { data: srcDoc } = useDmsQuery('doc-one', `/invoices/${v.sourceInvoice}`, undefined, { enabled: Boolean(v.sourceInvoice) });
  useEffect(() => {
    const d = srcDoc?.data;
    if (d) setLines(d.lines.map((l) => ({ product: l.product, qty: String(l.qty), price: String(l.price), discountPerUnit: String(l.discountPerUnit || ''), serialsText: (l.serials || []).join('\n') })));
  }, [srcDoc]);
  useEffect(() => { if (kind === 'OPENING') setLines([{ ...emptyLine(), okQty: '', damageQty: '', missingQty: '' }]); }, [kind]);

  const fromLoc = ctx.locById.get(v.from);
  const toLoc = ctx.locById.get(v.to);
  const custList = customers?.data || [];
  const partyState = (side) => {
    const t = cfg?.[side];
    if (t === 'loc' || t === 'anyloc') return ctx.locById.get(v[side])?.stateCode;
    if (t === 'vendor') return lk?.vendors?.find((x) => x._id === v[side])?.stateCode;
    if (t === 'customer') return custList.find((x) => x._id === v[side])?.stateCode;
    return partyState('from');
  };
  const fs = partyState('from'); const ts = cfg?.to === 'none' ? fs : partyState('to');
  const applyTax = !cfg?.noTax && v.taxType !== 'NONE';
  // Total Discount: spread the bill discount over the lines by value (stored as discount per unit, so the server keeps computing tax)
  const spreadDiscount = (amount) => {
    setV((x) => ({ ...x, billDiscount: amount }));
    const amt = Number(amount) || 0;
    const value = lines.reduce((n, l) => n + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    setLines((ls) => ls.map((l) => {
      const q = Number(l.qty) || 0; const lineValue = q * (Number(l.price) || 0);
      if (!q || !value) return { ...l, discountPerUnit: '' };
      return { ...l, discountPerUnit: String(Math.round(((amt * lineValue) / value / q) * 100) / 100) };
    }));
  };
  const preview = previewTotals(lines, { ...ctx, interState: Boolean(fs && ts && fs !== ts), applyTax, roundOff: cfg?.roundOff });
  const save = useDmsMutation((b) => dms.post('/invoices', b), { onSuccess: (res) => nav(`/distributor/doc/${res.data._id}`) });
  if (!cfg) return <Navigate to="/distributor/home" replace />;

  const partySelect = (side) => {
    const t = cfg[side];
    const label = side === 'from' ? cfg.fromLabel : cfg.toLabel;
    let options = [];
    if (t === 'loc') options = (lk?.locations || []).map(locOpt);
    if (t === 'anyloc') options = (lk?.allLocations || []).filter((l) => l._id !== v.from).map(locOpt);
    if (t === 'vendor') options = (lk?.vendors || []).map((x) => ({ value: x._id, label: `${x.name} | ${x.city} | ${x.country} | ${x.code}` }));
    if (t === 'customer') options = custList.map((c) => ({ value: c._id, label: `${c.name} | ${c.phone} | ${c.customerId}` }));
    return (
      <Field label={label} required error={errors[side]}>
        <Select required value={v[side]} options={options} onChange={(e) => {
          const val = e.target.value;
          const upd = { ...v, [side]: val };
          if (side === 'to' && (t === 'loc' || t === 'anyloc')) { const l = ctx.locById.get(val); upd.deliveryAddress = l?.billingAddress || ''; }
          if (side === 'to' && t === 'customer') upd.deliveryAddress = custList.find((c) => c._id === val)?.address || '';
          if (side === 'from' && cfg.sourceInvoice) upd.sourceInvoice = '';
          setV(upd);
        }} />
        {t === 'customer' && side === 'to' && v.from && <a href="/distributor/masters/customers/new" target="_blank" rel="noreferrer" className="dms-muted">+ Add New Customer</a>}
        {cfg.toParent && side === 'to' && fromLoc?.parent && !v.to && <button type="button" className="dms-btn sm default" style={{ marginTop: 4 }} onClick={() => setV({ ...v, to: fromLoc.parent })}>Use parent location</button>}
      </Field>
    );
  };

  const submit = (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    const body = {
      kind, from: v.from, to: cfg.to === 'none' ? undefined : v.to, remark: v.remark, deliveryAddress: v.deliveryAddress,
      ...(cfg.docType ? { docType: v.docType } : {}), ...(cfg.taxType ? { taxType: v.taxType } : {}),
      ...(cfg.currency ? { currency: v.currency } : {}), ...(cfg.ref ? { refNo: v.refNo, refDate: v.refDate || undefined } : {}),
      ...(cfg.date && v.invoiceDate ? { invoiceDate: v.invoiceDate } : {}), ...(cfg.sourceInvoice ? { sourceInvoice: v.sourceInvoice } : {}),
      lines: toPayloadLines(lines),
    };
    // customer return: "from" is the customer, "to" is the location
    save.mutate(body, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message + (Object.keys(a.fieldErrors).length ? ` — ${Object.values(a.fieldErrors).map((x) => x[0]).join('; ')}` : '')); } });
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  // customer-return picks the location first, then customer
  const order = cfg.from === 'customer' ? ['to', 'from'] : ['from', 'to'];
  return (
    <>
      {cfg.listLink && <Toolbar><Btn variant="default" to={cfg.listLink.to}>{cfg.listLink.label}</Btn></Toolbar>}
      <PageTitle icon={FileText}>{cfg.title}</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          {order.filter((s) => cfg[s] !== 'none').map((s) => <div key={s}>{partySelect(s)}</div>)}
          {cfg.sourceInvoice && (
            <Field label="Original Invoice No." required error={errors.sourceInvoice}>
              <Select required value={v.sourceInvoice} options={(srcInvoices?.data || []).filter((i) => i.status !== 'Cancelled').map((i) => ({ value: i._id, label: `${i.invoiceNo} | ${fmt.date(i.invoiceDate)} | ${fmt.money(i.grandTotal)}` }))} onChange={set('sourceInvoice')} />
            </Field>
          )}
          {cfg.docType && <Field label="Document Type"><Select placeholder={false} value={v.docType} options={[{ value: 'DELIVERY CHALLAN', label: 'Delivery Challan' }, { value: 'INVOICE', label: 'Invoice' }]} onChange={set('docType')} /></Field>}
          {cfg.discountType && <Field label="Discount Type"><Select placeholder={false} value={v.discountType} options={['Productwise Discount', 'Total Discount']} onChange={(e) => setV({ ...v, discountType: e.target.value })} /></Field>}
          {cfg.discountType && v.discountType === 'Total Discount' && <Field label="Discount"><Input type="number" min="0" step="any" value={v.billDiscount} onChange={(e) => spreadDiscount(e.target.value)} /></Field>}
          {cfg.taxType && <Field label="Tax Type"><Select placeholder={false} value={v.taxType} options={[{ value: 'NONE', label: 'NONE' }, { value: 'Productwise Tax', label: 'Productwise Tax' }]} onChange={set('taxType')} /></Field>}
          {cfg.currency && <Field label="Currency Type"><Select placeholder={false} value={v.currency} options={['INR', 'USD']} onChange={set('currency')} /></Field>}
          {cfg.ref && <Field label={kind === 'OPENING' ? 'Ref. No.' : 'Invoice No. (vendor / ref)'} required={kind === 'LOCAL_PURCHASE'}><Input required={kind === 'LOCAL_PURCHASE'} value={v.refNo} onChange={set('refNo')} /></Field>}
          {cfg.ref && kind !== 'OPENING' && <Field label="Invoice Date"><Input type="date" value={v.refDate} onChange={set('refDate')} /></Field>}
          {cfg.date && <Field label="Opening Date"><Input type="date" value={v.invoiceDate} onChange={set('invoiceDate')} /></Field>}
        </div>
        <LineItems lines={lines} setLines={setLines} products={lk?.products || []} cols={cfg.cols} colLabels={cfg.colLabels} preview={preview} schemes={lk?.schemes || []} stockOf={ctx.stockOf} errors={errors} />
        <TotalsBox totals={preview.totals} showTax={applyTax} roundOff={cfg.roundOff} />
        <div className="dms-form" style={{ marginTop: 12 }}>
          {cfg.to !== 'none' && <Field label="Delivery Address" required={cfg.to !== 'vendor'}><TextArea required={cfg.to !== 'vendor'} value={v.deliveryAddress} onChange={set('deliveryAddress')} /></Field>}
          <Field label="Remark"><TextArea value={v.remark} onChange={set('remark')} /></Field>
        </div>
        <p className="dms-muted" style={{ textAlign: 'center' }}>Totals and tax shown here are a preview; the server recalculates them from the HSN Tax Master when you save.</p>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : cfg.submit}</button>
          <BackBtn to={cfg.back} />
        </div>
      </form>
    </>
  );
}

/* ───────────── CSV upload (Upload Billing / Upload Opening Stock) ───────────── */
const TEMPLATES = {
  UPLOAD_BILLING: [['productCode', 'qty', 'price', 'discountPerUnit', 'serials'], [['PH-X1', 2, 13499, 0, 'IMEI1|IMEI2'], ['CH-20W', 10, 539, 5, '']]],
  OPENING: [['productCode', 'okQty', 'damageQty', 'missingQty', 'price', 'serials'], [['CH-20W', 10, 0, 0, 431, ''], ['PH-X1', 2, 0, 0, 10799, 'IMEI1|IMEI2']]],
};
const NUM = (v) => (v === '' || v === undefined ? 0 : Number(v));
/** Row-level validation: returns [{ row, message }] (row numbers as in Excel, header = row 1). */
export function validateUploadRows(rows, kind, byCode) {
  const errs = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const n = i + 2;
    const p = byCode.get(String(r.productCode || '').trim().toUpperCase());
    if (!p) { errs.push({ row: n, message: `Unknown product code "${r.productCode || ''}"` }); return; }
    const qtyFields = kind === 'OPENING' ? ['okQty', 'damageQty', 'missingQty'] : ['qty'];
    for (const f of [...qtyFields, 'price', ...(kind === 'OPENING' ? [] : ['discountPerUnit'])]) {
      if (r[f] !== undefined && r[f] !== '' && !(Number(r[f]) >= 0)) errs.push({ row: n, message: `${f} must be a number 0 or more` });
    }
    const qty = qtyFields.reduce((s, f) => s + NUM(r[f]), 0);
    if (!(qty > 0)) errs.push({ row: n, message: 'Quantity must be greater than 0' });
    const serials = r.serials ? String(r.serials).split('|').map((s) => s.trim()).filter(Boolean) : [];
    if (p.isSerialized && serials.length !== qty) errs.push({ row: n, message: `${p.productCode} is serial-tracked: give ${qty} serial(s) separated by |` });
    for (const s of serials) { if (seen.has(s.toUpperCase())) errs.push({ row: n, message: `Serial ${s} repeated in the file` }); seen.add(s.toUpperCase()); }
  });
  return errs;
}
export function UploadPage() {
  const { kind } = useParams();
  const isOpening = kind === 'OPENING';
  const nav = useNavigate();
  const ctx = useFormCtx(null);
  const { lk } = ctx;
  const [v, setV] = useState({ from: '', to: '', date: '' });
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [rowErrs, setRowErrs] = useState([]);
  const [parsing, setParsing] = useState(false);
  const save = useDmsMutation((b) => dms.post('/invoices', b), { onSuccess: (res) => nav(`/distributor/doc/${res.data._id}`) });
  const byCode = useMemo(() => new Map((lk?.products || []).map((p) => [p.productCode, p])), [lk]);
  if (!['OPENING', 'UPLOAD_BILLING'].includes(kind)) return <Navigate to="/distributor/home" replace />;
  const onFile = async (f) => {
    setMsg('');
    setRows([]); setRowErrs([]); // clear both together so stale rows are never turned into lines
    if (!f) return;
    setParsing(true); // Upload stays disabled until the file has been read and checked
    try {
      let parsed;
      try { parsed = await readSheet(f); } catch (e) { setMsg(e.message); return; }
      const errs = validateUploadRows(parsed, kind, byCode);
      setRowErrs(errs);
      setMsg(errs.length ? `${errs.length} problem(s) found. Fix the file and upload again; nothing is saved until every row is valid.` : '');
      setRows(parsed);
    } finally {
      setParsing(false);
    }
  };
  const lines = rowErrs.length ? [] : rows.flatMap((r) => {
    const p = byCode.get(String(r.productCode ?? '').trim().toUpperCase());
    if (!p) return [];
    const serials = r.serials ? r.serials.split('|').map((s) => s.trim()).filter(Boolean) : undefined;
    if (isOpening) {
      const ok = Number(r.okQty || 0); const dm = Number(r.damageQty || 0); const ms = Number(r.missingQty || 0);
      return { product: p._id, qty: ok + dm + ms, okQty: ok, damageQty: dm, missingQty: ms, price: Number(r.price || 0), serials };
    }
    return { product: p._id, qty: Number(r.qty), price: Number(r.price), discountPerUnit: Number(r.discountPerUnit || 0), serials };
  });
  const submit = (e) => {
    e.preventDefault(); setMsg('');
    if (rowErrs.length) { setMsg('The file has errors; nothing was saved.'); return; }
    if (!lines.length) { setMsg('No rows in file'); return; }
    save.mutate({ kind, from: v.from, to: isOpening ? undefined : v.to, invoiceDate: v.date || undefined, lines }, { onError: (err) => setMsg(apiError(err).message) });
  };
  const template = () => downloadTemplate(`${kind.toLowerCase()}_template`, TEMPLATES[kind][0], TEMPLATES[kind][1], ['productCode must exist in Product Master.', 'serials: only for serial-tracked products, separated by | and equal in number to the quantity.', 'The whole file is rejected if any row is invalid (nothing is saved partially).']);
  return (
    <>
      <PageTitle icon={ShoppingCart}>{isOpening ? 'Upload Opening Stock' : 'Upload Billing'}</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          <Field label={isOpening ? 'Location' : 'Billing From'} required><Select required value={v.from} options={(lk?.locations || []).map(locOpt)} onChange={(e) => setV({ ...v, from: e.target.value })} /></Field>
          {!isOpening && <Field label="Billing To" required><Select required value={v.to} options={(lk?.allLocations || []).filter((l) => l._id !== v.from).map(locOpt)} onChange={(e) => setV({ ...v, to: e.target.value })} /></Field>}
          <Field label={isOpening ? 'Opening Date' : 'Bill Date'}><Input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} /></Field>
          <Field label="Attach File (.xlsx / .csv)" required>
            <Input type="file" accept=".xlsx,.csv" required onChange={(e) => onFile(e.target.files?.[0])} />
            <button type="button" className="dms-btn sm default" style={{ marginTop: 4 }} onClick={template}>Download template</button>
          </Field>
        </div>
        {rowErrs.length > 0 && <Alert>{rowErrs.slice(0, 30).map((e, i) => <div key={i}>Row {e.row}: {e.message}</div>)}</Alert>}
        {lines.length > 0 && <p style={{ textAlign: 'center' }}>{lines.length} valid row(s), total qty {lines.reduce((n, l) => n + l.qty, 0)}</p>}
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending || parsing}>{parsing ? 'Reading file…' : 'Upload'}</button><BackBtn /></div>
      </form>
    </>
  );
}

/* ───────────── detail view ───────────── */
function DocItems({ doc, receiving }) {
  const hasTax = doc.lines.some((l) => l.sgstAmt || l.cgstAmt || l.igstAmt);
  return (
    <div className="dms-table-wrap"><table className="dms-table">
      <thead><tr>
        <th>#</th><th>Product</th><th>{receiving ? 'Disp. Qty' : 'Bill Qty'}</th>
        {doc.status === 'Received' || doc.kind === 'OPENING' ? <><th>Ok Qty</th><th>Damage Qty</th><th>Missing Qty</th></> : null}
        <th>Price</th><th>Value</th><th>Discount/Unit</th><th>After Discount Value</th>
        {hasTax && <><th>SGST (%)</th><th>SGST Amt</th><th>CGST (%)</th><th>CGST Amt</th><th>IGST (%)</th><th>IGST Amt</th></>}
        <th>Total</th><th>Scheme</th><th>Serial No.</th>
      </tr></thead>
      <tbody>{doc.lines.map((l, i) => (
        <tr key={l._id}>
          <td>{i + 1}</td><td>{l.productName} | {l.color} | {l.productCode}</td><td className="r">{fmt.money(l.qty)}</td>
          {doc.status === 'Received' || doc.kind === 'OPENING' ? <><td className="r">{l.okQty}</td><td className="r">{l.damageQty}</td><td className="r">{l.missingQty}</td></> : null}
          <td className="r">{fmt.money(l.price)}</td><td className="r">{fmt.money(l.value)}</td><td className="r">{fmt.money(l.discountPerUnit)}</td><td className="r">{fmt.money(l.afterDiscount)}</td>
          {hasTax && <><td className="r">{l.sgstPer}</td><td className="r">{fmt.money(l.sgstAmt)}</td><td className="r">{l.cgstPer}</td><td className="r">{fmt.money(l.cgstAmt)}</td><td className="r">{l.igstPer}</td><td className="r">{fmt.money(l.igstAmt)}</td></>}
          <td className="r">{fmt.money(l.total)}</td><td>{l.schemeName ? `${l.schemeName} (${l.schemeCode})` : ''}</td>
          <td style={{ fontSize: 11 }}>{(l.serials || []).join(', ')}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export function DocDetailPanels({ doc }) {
  return (
    <>
      <Panel title="Party Information">
        <KV pairs={[
          ['Invoice To', `${fmt.party(doc.to)}${doc.to.state ? `,${doc.to.state}` : ''}`], ['Invoice From', `${fmt.party(doc.from)}${doc.from.state ? `,${doc.from.state}` : ''}`],
          ['Invoice No.', doc.invoiceNo], ['Invoice Date', fmt.date(doc.invoiceDate)],
          ['PO No.', doc.poNo || ''], ['Ref. No.', [doc.refNo, doc.sourceInvoiceNo].filter(Boolean).join(' / ')],
          ['Entry By', doc.entryBy], ['Status', <Status key="s" value={doc.status} />],
          ['Delivery Address', doc.deliveryAddress], ['Dispatch Address', doc.dispatchAddress],
          ['Document Type', `${doc.docType} — ${KIND_LABEL[doc.kind]}`], ['Currency', doc.currency],
        ]} />
      </Panel>
      <Panel title="Items Information"><DocItems doc={doc} /></Panel>
      <Panel title="Amount Information">
        <KV pairs={[
          ['Qty', doc.totalQty], ['Sub Total', fmt.money(doc.subTotal)], ['Total SGST', fmt.money(doc.totalSgst)], ['Discount', fmt.money(doc.totalDiscount)],
          ['Total CGST', fmt.money(doc.totalCgst)], ['Grand Total', fmt.money(doc.grandTotal)], ['Total IGST', fmt.money(doc.totalIgst)], ['Round Off', fmt.money(doc.roundOff)],
          ['Margin', fmt.money(doc.marginAmount)], ['Discount Type', doc.discountType], ['Remark', doc.remark], ['Paid Amount', doc.kind === 'RETAIL_CUSTOMER' ? fmt.money(doc.paidAmount) : ''],
        ]} />
      </Panel>
      {doc.logistic?.docketNo && (
        <Panel title="Logistic Information">
          <KV pairs={[
            ['Logistic Name', doc.logistic.courierName], ['Docket No.', doc.logistic.docketNo], ['Logistic Person', doc.logistic.logisticPerson], ['Contact No.', doc.logistic.contactNo],
            ['Carrier No.', doc.logistic.carrierNo], ['Dispatch Date', fmt.date(doc.logistic.dispatchDate)], ['Transportation Mode', doc.logistic.transportMode], ['E-Way Bill No', doc.logistic.ewayBillNo],
            ['Dispatch Remark', doc.logistic.remark], ['Updated By', doc.logistic.updatedBy],
          ]} />
        </Panel>
      )}
      {doc.receiving?.by && (
        <Panel title="Receiving Information">
          <KV pairs={[['Received By', doc.receiving.by], ['Received Date', fmt.dt(doc.receiving.at)], ['Receive Remark', doc.receiving.remark], ['', '']]} />
        </Panel>
      )}
    </>
  );
}

export function DocView() {
  const { id } = useParams();
  const { data, isLoading, error } = useDmsQuery('doc-one', `/invoices/${id}`);
  const [pay, setPay] = useState(null);
  const payM = useDmsMutation((b) => dms.post(`/invoices/${id}/payment`, b), { onSuccess: () => setPay(null) });
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  if (error) return <Alert>{apiError(error).message}</Alert>;
  const doc = data.data;
  const due = Math.round((doc.grandTotal - doc.paidAmount) * 100) / 100;
  return (
    <>
      <PageTitle icon={FileText}>Invoice Details</PageTitle>
      <DocDetailPanels doc={doc} />
      <ActionLog actions={doc.actions} />
      <div className="dms-actions">
        {doc.kind === 'RETAIL_CUSTOMER' && doc.status === 'Pending' && <Btn variant="success" onClick={() => setPay({ amount: String(due), payMode: 'CASH', remark: '' })}>Receive Payment</Btn>}
        <a className="dms-btn default" href={`/distributor/print/doc/${doc._id}`} target="_blank" rel="noreferrer">Print</a>
        <BackBtn />
      </div>
      <Modal open={Boolean(pay)} title="Receive Payment" onClose={() => setPay(null)}
        footer={<><Btn disabled={payM.isPending} onClick={() => payM.mutate({ ...pay, amount: Number(pay.amount) })}>Receive</Btn><Btn variant="default" onClick={() => setPay(null)}>Close</Btn></>}>
        <p>Balance due: <b>{fmt.money(due)}</b></p>
        <div className="dms-form" style={{ gridTemplateColumns: '1fr' }}>
          <Field label="Amount" required><Input type="number" step="any" min="0" max={due} value={pay?.amount || ''} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Payment Mode"><Select placeholder={false} value={pay?.payMode} options={['CASH', 'BANK', 'PAYTM', 'CHEQUE', 'OTHER']} onChange={(e) => setPay({ ...pay, payMode: e.target.value })} /></Field>
          <Field label="Remark"><TextArea value={pay?.remark || ''} onChange={(e) => setPay({ ...pay, remark: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}

/* ───────────── update dispatch ───────────── */
export function DispatchPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const ctx = useFormCtx(null);
  const { data, isLoading } = useDmsQuery('doc-one', `/invoices/${id}`);
  const [v, setV] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const doc = data?.data;
  useEffect(() => {
    if (doc) {
      const l = doc.logistic || {};
      setV({ courier: l.courier?._id || l.courier || '', docketNo: l.docketNo || '', dispatchDate: fmt.date(l.dispatchDate) || fmt.date(new Date()), logisticPerson: l.logisticPerson || '', transportMode: l.transportMode || '', contactNo: l.contactNo || '', carrierNo: l.carrierNo || '', ewayBillNo: l.ewayBillNo || '', deliveryAddress: l.deliveryAddress || doc.deliveryAddress || '', remark: l.remark || '' });
    }
  }, [doc]);
  const save = useDmsMutation((b) => dms.post(`/invoices/${id}/dispatch`, b), { onSuccess: () => nav('/distributor/logistic/dispatch') });
  if (isLoading || !v) return <div className="dms-loading">Loading…</div>;
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageTitle icon={Truck}>Update Dispatch</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={(e) => { e.preventDefault(); setErrors({}); setMsg(''); save.mutate(v, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } }); }}>
        <div className="dms-form">
          <Field label="Dispatch To"><Input readOnly value={fmt.party(doc.to)} /></Field>
          <Field label="Invoice No."><Input readOnly value={doc.invoiceNo} /></Field>
          <Field label="Invoice Date"><Input readOnly value={fmt.date(doc.invoiceDate)} /></Field>
          <Field label="Invoice Value"><Input readOnly value={fmt.money(doc.grandTotal)} /></Field>
          <Field label="Logistic Name" required error={errors.courier}><Select required value={v.courier} placeholder="--Select--" options={(ctx.lk?.couriers || []).map((c) => ({ value: c._id, label: [c.name, c.attrs?.city, c.attrs?.state].filter(Boolean).join(',') }))} onChange={set('courier')} /></Field>
          <Field label="Docket No." required error={errors.docketNo}><Input required value={v.docketNo} onChange={set('docketNo')} /></Field>
          <Field label="Dispatch Date" required error={errors.dispatchDate}><Input type="date" required value={v.dispatchDate} onChange={set('dispatchDate')} /></Field>
          <Field label="Logistic Person" required error={errors.logisticPerson}><Input required value={v.logisticPerson} onChange={set('logisticPerson')} /></Field>
          <Field label="Transportation Mode" required error={errors.transportMode}><Select required placeholder="--Select--" value={v.transportMode} options={['By Road', 'By Air', 'By Transport', 'By Hand Held']} onChange={set('transportMode')} /></Field>
          <Field label="Contact No." required error={errors.contactNo}><Input required pattern="\d{10}" value={v.contactNo} onChange={set('contactNo')} /></Field>
          <Field label="Carrier No." required error={errors.carrierNo}><Input required value={v.carrierNo} onChange={set('carrierNo')} /></Field>
          <Field label="E-Way Bill No"><Input value={v.ewayBillNo} onChange={set('ewayBillNo')} /></Field>
          <Field label="Delivery Address" required error={errors.deliveryAddress}><TextArea required value={v.deliveryAddress} onChange={set('deliveryAddress')} /></Field>
          <Field label="Remark" required error={errors.remark}><TextArea required value={v.remark} onChange={set('remark')} /></Field>
        </div>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Update</button><BackBtn to="/distributor/logistic/dispatch" /></div>
      </form>
    </>
  );
}

/* ───────────── receive ───────────── */
export function ReceivePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('doc-one', `/invoices/${id}`);
  const doc = data?.data;
  const [rows, setRows] = useState([]);
  const [remark, setRemark] = useState('');
  const [msg, setMsg] = useState('');
  // "Receive Stock By Scanning": each scanned serial must be on this invoice; serialized lines count OK = scanned
  const scanMode = new URLSearchParams(window.location.search).has('scan');
  const [scanned, setScanned] = useState({});
  const [code, setCode] = useState('');
  useEffect(() => { if (doc) setRows(doc.lines.map((l) => ({ lineId: l._id, qty: l.qty, okQty: scanMode && l.serials?.length ? '0' : String(l.qty), damageQty: '0', missingQty: scanMode && l.serials?.length ? String(l.qty) : '0' }))); }, [doc]); // eslint-disable-line react-hooks/exhaustive-deps
  const onScan = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    setCode('');
    if (!c) return;
    const i = doc.lines.findIndex((l) => (l.serials || []).map((x) => String(x).toUpperCase()).includes(c));
    if (i < 0) { setMsg(`Serial ${c} is not on this invoice`); return; }
    if (scanned[c] !== undefined) { setMsg(`Serial ${c} is already scanned`); return; }
    setMsg('');
    const next = { ...scanned, [c]: i };
    setScanned(next);
    const n = Object.values(next).filter((x) => x === i).length;
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, okQty: String(n), missingQty: String(Math.max(0, r.qty - n - Number(r.damageQty || 0))) } : r)));
  };
  const save = useDmsMutation((b) => dms.post(`/invoices/${id}/receive`, b), { onSuccess: () => nav(doc?.kind === 'JOBWORK' ? '/distributor/receive/jobwork' : doc?.kind === 'LOCAL_PURCHASE' ? '/distributor/purchase/local' : '/distributor/receive/location') });
  if (isLoading || !doc) return <div className="dms-loading">Loading…</div>;
  const set = (i, k, val) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <>
      <PageTitle icon={PackageCheck}>Receive Invoice Details</PageTitle>
      <p style={{ textAlign: 'center', fontWeight: 700 }}>{KIND_LABEL[doc.kind]}</p>
      <Alert>{msg}</Alert>
      <Panel title="Party Information">
        <KV pairs={[['Billing To', fmt.party(doc.to)], ['Billing From', fmt.party(doc.from)], ['Invoice No.', doc.invoiceNo], ['Billing Date', fmt.date(doc.invoiceDate)], ['Entry By', doc.entryBy], ['Status', <Status key="s" value={doc.status} />]]} />
      </Panel>
      {scanMode && (
        <Panel title="Receive Stock By Scanning">
          <form className="dms-filter" onSubmit={onScan}>
            <div><label className="dms-label" htmlFor="scan-code">Scan Serial No.</label><Input id="scan-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Scan or type, then Enter" /></div>
            <div style={{ minWidth: 0 }}><button type="submit" className="dms-btn">Add</button></div>
          </form>
          <p className="dms-muted">Scanned: {Object.keys(scanned).length} of {doc.lines.reduce((n, l) => n + (l.serials?.length || 0), 0)} serial(s). Serials not scanned are received as Missing.</p>
        </Panel>
      )}
      <form onSubmit={(e) => { e.preventDefault(); setMsg(''); save.mutate({ remark, lines: rows.map((r) => ({ lineId: r.lineId, okQty: Number(r.okQty), damageQty: Number(r.damageQty), missingQty: Number(r.missingQty) })) }, { onError: (err) => setMsg(apiError(err).message) }); }}>
        <Panel title="Items Information">
          <div className="dms-table-wrap"><table className="dms-table">
            <thead><tr><th>#</th><th>Product</th><th>Disp. Qty</th><th>Ok Qty</th><th>Damage Qty</th><th>Missing Qty</th><th>Price</th><th>Total</th><th>Serials</th></tr></thead>
            <tbody>{doc.lines.map((l, i) => {
              const r = rows[i] || {};
              const sum = Number(r.okQty || 0) + Number(r.damageQty || 0) + Number(r.missingQty || 0);
              return (
                <tr key={l._id}>
                  <td>{i + 1}</td><td>{l.productName} ({l.color})</td><td className="r">{l.qty}</td>
                  {['okQty', 'damageQty', 'missingQty'].map((k) => <td key={k}><input className={`dms-input ${sum !== l.qty ? 'err' : ''}`} type="number" min="0" max={l.qty} style={{ width: 80 }} value={r[k] ?? ''} onChange={(e) => set(i, k, e.target.value)} /></td>)}
                  <td className="r">{fmt.money(l.price)}</td><td className="r">{fmt.money(l.total)}</td><td style={{ fontSize: 11 }}>{(l.serials || []).join(', ')}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
          <p className="dms-muted">Ok + Damage + Missing must equal the dispatched qty for every row.</p>
        </Panel>
        {doc.logistic?.docketNo && <Panel title="Logistic Information"><KV pairs={[['Logistic Name', doc.logistic.courierName], ['Docket No.', doc.logistic.docketNo], ['Dispatch Date', fmt.date(doc.logistic.dispatchDate)], ['Carrier No.', doc.logistic.carrierNo]]} /></Panel>}
        <Panel title="Receiving Information">
          <Field label="Receive Remark" required><TextArea required value={remark} onChange={(e) => setRemark(e.target.value)} /></Field>
        </Panel>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Receive</button><BackBtn /></div>
      </form>
    </>
  );
}

/* ───────────── approve (STN / JOBWORK / PRN) ───────────── */
export function DocApprove() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('doc-one', `/invoices/${id}`);
  const [v, setV] = useState({ action: 'Approved', remark: '' });
  const [msg, setMsg] = useState('');
  const doc = data?.data;
  const back = doc?.kind === 'PRN' ? '/distributor/return/approval' : '/distributor/invoicing/stock-transfer-approval';
  const act = useDmsMutation((b) => dms.post(`/invoices/${id}/approve`, b), { onSuccess: () => nav(back) });
  if (isLoading || !doc) return <div className="dms-loading">Loading…</div>;
  return (
    <>
      <PageTitle icon={FileText}>{doc.kind === 'PRN' ? 'Return Approval View' : 'Stock Transfer Approval'}</PageTitle>
      <DocDetailPanels doc={doc} />
      <Panel title="Approval Action">
        <Alert>{msg}</Alert>
        {doc.status === 'PFA' ? (
          <form onSubmit={(e) => { e.preventDefault(); setMsg(''); act.mutate(v, { onError: (err) => setMsg(apiError(err).message) }); }}>
            <div className="dms-form">
              <Field label="Action Taken" required><Select required placeholder={false} value={v.action} options={['Approved', 'Rejected']} onChange={(e) => setV({ ...v, action: e.target.value })} /></Field>
              <Field label="Remark" required><TextArea required value={v.remark} onChange={(e) => setV({ ...v, remark: e.target.value })} /></Field>
            </div>
            <div className="dms-actions"><button type="submit" className="dms-btn" disabled={act.isPending}>Update</button><BackBtn to={back} /></div>
          </form>
        ) : <p>Already <b>{doc.status}</b>.</p>}
      </Panel>
      <ActionLog actions={doc.actions} />
    </>
  );
}

/* ───────────── receive against vendor PO ───────────── */
export function VendorPoReceive() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('po-one', `/po/${id}`);
  const po = data?.data;
  const [rows, setRows] = useState([]);
  const [v, setV] = useState({ refNo: '', refDate: '', remark: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { if (po) setRows(po.lines.map((l) => ({ lineId: l._id, okQty: String(l.reqQty), damageQty: '0', missingQty: '0', serialsText: '' }))); }, [po]);
  const save = useDmsMutation((b) => dms.post(`/invoices/from-vendor-po/${id}`, b), { onSuccess: (res) => nav(`/distributor/doc/${res.data._id}`) });
  if (isLoading || !po) return <div className="dms-loading">Loading…</div>;
  const set = (i, k, val) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <>
      <PageTitle icon={ShoppingCart}>Receive Vendor Purchase Order</PageTitle>
      <Alert>{msg}</Alert>
      <Panel title="Party Information"><KV pairs={[['PO From', fmt.party(po.from)], ['PO To (Vendor)', fmt.party(po.to)], ['PO No.', po.poNo], ['PO Date', fmt.date(po.poDate)]]} /></Panel>
      <form onSubmit={(e) => { e.preventDefault(); setMsg(''); save.mutate({ ...v, lines: rows.map((r) => ({ lineId: r.lineId, okQty: Number(r.okQty), damageQty: Number(r.damageQty), missingQty: Number(r.missingQty), serials: r.serialsText ? splitSerials(r.serialsText) : undefined })) }, { onError: (err) => setMsg(apiError(err).message) }); }}>
        <Panel title="Items Information">
          <div className="dms-table-wrap"><table className="dms-table">
            <thead><tr><th>#</th><th>Product</th><th>Ordered</th><th>Ok Qty</th><th>Damage Qty</th><th>Missing Qty</th><th>Price</th><th>Serial / IMEI</th></tr></thead>
            <tbody>{po.lines.map((l, i) => (
              <tr key={l._id}><td>{i + 1}</td><td>{l.productName} | {l.productCode}</td><td className="r">{l.reqQty}</td>
                {['okQty', 'damageQty', 'missingQty'].map((k) => <td key={k}><input className="dms-input" type="number" min="0" style={{ width: 80 }} value={rows[i]?.[k] ?? ''} onChange={(e) => set(i, k, e.target.value)} /></td>)}
                <td className="r">{fmt.money(l.price)}</td>
                <td><textarea rows={1} value={rows[i]?.serialsText || ''} onChange={(e) => set(i, 'serialsText', e.target.value)} /></td></tr>
            ))}</tbody>
          </table></div>
        </Panel>
        <div className="dms-form">
          <Field label="Vendor Invoice No." required><Input required value={v.refNo} onChange={(e) => setV({ ...v, refNo: e.target.value })} /></Field>
          <Field label="Vendor Invoice Date"><Input type="date" value={v.refDate} onChange={(e) => setV({ ...v, refDate: e.target.value })} /></Field>
          <Field label="Remark" full><TextArea value={v.remark} onChange={(e) => setV({ ...v, remark: e.target.value })} /></Field>
        </div>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Receive</button><BackBtn to="/distributor/purchase/vendor" /></div>
      </form>
    </>
  );
}
