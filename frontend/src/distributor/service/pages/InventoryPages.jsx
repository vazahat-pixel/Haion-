/* Inventory, procurement and dispatch screens for ASP, WH and Admin (reference Inventory / GRN / Dispatch menus). */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, Truck, Warehouse, PackageCheck, Eye, Printer, Trash2, Receipt, ShieldCheck } from 'lucide-react';
import {
  B, useLk, useMe, o, cols, fmt, crm, crmApiError, useCrmQuery, useCrmMutation, ListPage, ActionForm, PartLines, emptyPart, linesPayload, PageTitle, Toolbar, Btn, BackBtn,
  DataTable, Field, Input, Select, TextArea, Alert, Panel, KV, Filters,
} from '../kit';
import { Modal, exportCsv } from '../../components/ui';

const DATE = { t: 'daterange', label: 'Date Range' };
const inRange = (d, f) => (!f.from || new Date(d) >= new Date(f.from)) && (!f.to || new Date(d) <= new Date(`${f.to}T23:59:59`));
const iconBtn = (title, I, onClick) => <button type="button" className="dms-icon-btn" title={title} aria-label={title} onClick={onClick}><I size={17} /></button>;
const printBtn = (r) => <a className="dms-icon-btn" title="Print" aria-label="Print" href={`${B}/print/doc/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a>;
const ageing = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);

/* generic client-filtered list */
function DocList({ title, icon, url, params, filters, filterFn, columns, toolbar, rowsOf }) {
  const [f, setF] = useState({});
  const q = useCrmQuery(['doclist', url, params], url, params);
  const rows = useMemo(() => {
    let r = q.data?.data || [];
    if (rowsOf) r = rowsOf(r);
    return filterFn ? r.filter((x) => filterFn(x, f)) : r;
  }, [q.data, f, filterFn, rowsOf]);
  return (
    <div>
      <PageTitle icon={icon}>{title}</PageTitle>
      <Filters filters={filters} onGo={setF} />
      <Toolbar>{toolbar}<Btn variant="default" onClick={() => exportCsv(title, columns.filter((c) => c.text || !c.render).map((c) => ({ ...c, text: c.text || ((r) => r[c.key]) })), rows)}>Export Excel</Btn></Toolbar>
      {q.error && <Alert>{crmApiError(q.error).message}</Alert>}
      <DataTable columns={cols(columns)} rows={rows} loading={q.isLoading} />
    </div>
  );
}

/* Receive modal: per line OK / Damage / Missing */
function ReceiveModal({ doc, url, onClose, extraFields = [], title }) {
  const [lines, setLines] = useState(doc.items.map((l) => ({ part: l.part, partcode: l.partcode, partName: l.partName, qty: l.qty, okQty: l.qty, damageQty: 0, missingQty: 0 })));
  const [v, setV] = useState({});
  const [msg, setMsg] = useState('');
  const save = useCrmMutation((b) => crm.post(url, b), { onSuccess: onClose });
  const set = (i, x) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...x } : l)));
  const submit = () => {
    const bad = lines.find((l) => Number(l.okQty) + Number(l.damageQty) + Number(l.missingQty) !== Number(l.qty));
    if (bad) { setMsg(`OK + Damage + Missing must equal ${bad.qty} for ${bad.partcode}`); return; }
    const miss = extraFields.find((f) => f.req && !v[f.n]);
    if (miss) { setMsg(`${miss.label} is required`); return; }
    if (!v.remark) { setMsg('Receive Remark is required'); return; }
    save.mutate({ ...v, items: lines.map((l) => ({ part: l.part, okQty: Number(l.okQty), damageQty: Number(l.damageQty), missingQty: Number(l.missingQty) })) }, { onError: (e) => setMsg(crmApiError(e).message) });
  };
  return (
    <Modal open title={title || `Receive ${doc.docNo || doc.grnNo}`} onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Close</Btn><button type="button" className="dms-btn" disabled={save.isPending} onClick={submit}>Receive</button></>}>
      <Alert>{msg}</Alert>
      <table className="dms-table"><thead><tr><th>Partcode</th><th>Part</th><th>Shipped Qty</th><th>OK</th><th>Damage</th><th>Missing</th></tr></thead>
        <tbody>{lines.map((l, i) => <tr key={i}><td>{l.partcode}</td><td>{l.partName}</td><td>{l.qty}</td>
          {['okQty', 'damageQty', 'missingQty'].map((k) => <td key={k}><Input type="number" min="0" style={{ width: 70 }} value={l[k]} onChange={(e) => set(i, { [k]: e.target.value })} /></td>)}</tr>)}</tbody></table>
      <div className="dms-form" style={{ marginTop: 10 }}>
        {extraFields.map((f) => <Field key={f.n} label={f.label} required={f.req}><Input type={f.t || 'text'} value={v[f.n] || ''} onChange={(e) => setV((s) => ({ ...s, [f.n]: e.target.value }))} /></Field>)}
        <Field label="Receive Remark" required full><TextArea value={v.remark || ''} onChange={(e) => setV((s) => ({ ...s, remark: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function CourierModal({ doc, onClose, url }) {
  const [v, setV] = useState({ courierName: doc.courierName || '', docketNo: doc.docketNo || '' });
  const save = useCrmMutation((b) => crm.post(url || `/dispatches/${doc._id}/courier`, b), { onSuccess: onClose });
  return (
    <Modal open title="Update Dispatch Details" onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Close</Btn><button type="button" className="dms-btn" onClick={() => save.mutate(v)}>Update</button></>}>
      <div className="dms-form">
        <Field label="Courier Name"><Input value={v.courierName} onChange={(e) => setV((s) => ({ ...s, courierName: e.target.value }))} /></Field>
        <Field label="Docket No"><Input value={v.docketNo} onChange={(e) => setV((s) => ({ ...s, docketNo: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function ItemsModal({ title, items, onClose }) {
  return (
    <Modal open title={title} onClose={onClose}>
      <table className="dms-table"><thead><tr><th>Partcode</th><th>Part Name</th><th>Job No.</th><th>Qty</th><th>Dispatched</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>{items.map((i, k) => <tr key={k}><td>{i.partcode}</td><td>{i.partName}</td><td>{i.jobNo}</td><td>{i.reqQty ?? i.qty}</td><td>{i.dispQty ?? ''}</td><td>{fmt.money(i.price)}</td><td>{fmt.money(i.total)}</td></tr>)}</tbody></table>
    </Modal>
  );
}

const DOC_COLS = (extra = []) => [
  { key: 'docNo', label: 'Document No.' }, { key: 'createdAt', label: 'Document Date', render: (r) => fmt.dmy(r.createdAt), text: (r) => fmt.dmy(r.createdAt) }, { key: 'docType', label: 'Document Type' },
  { key: 'lc', label: 'Location Code', render: (r) => r.toLocation?.code || '', text: (r) => r.toLocation?.code || '' },
  { key: 'ln', label: 'Location Name', render: (r) => r.toLocation?.name || r.customerName || '', text: (r) => r.toLocation?.name || r.customerName || '' },
  { key: 'poNo', label: 'Ref. No.' }, { key: 'status', label: 'Status' }, ...extra,
];

/* ───────────── ASP ───────────── */
export function AspPoPage() {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);
  const cancel = useCrmMutation((id) => crm.post(`/po/${id}/cancel`));
  return (
    <>
      <DocList title="Purchase Order" icon={Package} url="/po" params={{ poType: 'MSL,PNA' }}
        filters={[DATE, { n: 'status', label: 'PO Status', o: ['Pending', 'Processed', 'Partial Processed', 'Dispatched', 'Received', 'Cancelled'], ph: '--Please Select-' }]}
        filterFn={(r, f) => inRange(r.createdAt, f) && (!f.status || r.status === f.status)}
        toolbar={<Btn onClick={() => nav(`${B}/po/new`)}>Add New PO</Btn>}
        columns={[{ key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: 'PO Date', render: (r) => fmt.dmy(r.createdAt), text: (r) => fmt.dmy(r.createdAt) }, { key: 'poType', label: 'Type' },
          { key: 'age', label: 'Ageing', render: (r) => ageing(r.createdAt) }, { key: 'status', label: 'Status' }, { key: 'to', label: 'To Location', render: (r) => r.toLocation?.name, text: (r) => r.toLocation?.name },
          { key: 'action', label: 'Action', sortable: false, render: (r) => (['Pending', 'Approved'].includes(r.status) ? iconBtn('Cancel PO', Trash2, () => window.confirm(`Cancel ${r.poNo}?`) && cancel.mutate(r._id)) : '') },
          { key: 'view', label: 'View', sortable: false, render: (r) => iconBtn('View', Eye, () => setModal(r)) },
          { key: 'print', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/po/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> }]} />
      {modal && <ItemsModal title={`PO ${modal.poNo}`} items={modal.items} onClose={() => setModal(null)} />}
    </>
  );
}

export function AspPoAddPage() {
  const lk = useLk();
  const [lines, setLines] = useState([emptyPart()]);
  const acc = useCrmQuery(['acc-status'], '/accounts/status');
  const stock = useCrmQuery(['my-stock'], '/stock');
  const bal = acc.data?.data?.[0];
  return (
    <ActionForm title="Add New Purchase Order" icon={Package} url="/po" saveLabel="ADD"
      fields={[{ n: 'toLocation', label: 'To Location/WH', t: 'select', o: (l) => o.loc(l.whs), req: true }]}
      extraValid={() => (linesPayload(lines).length ? '' : 'Add at least one part with quantity')}
      toBody={(v) => ({ ...v, poType: 'MSL', items: linesPayload(lines) })}
      onDone={(res, nav) => nav(`${B}/po`)}>
      {() => (
        <>
          <p><b>Available Credit Balance:</b> ₹ {fmt.money(bal?.mainAc || 0)}</p>
          <PartLines lines={lines} setLines={setLines} show={{ avl: true }} priceOf={(p) => p?.locationPrice} stockOf={(pid) => (stock.data?.data || []).find((s) => String(s.part?._id) === pid)?.fresh || 0} partFilter={(p) => ['ALL', 'ASP'].includes(p.partFor)} />
          {!lk.whs?.length && <Alert>No warehouse location exists yet.</Alert>}
        </>
      )}
    </ActionForm>
  );
}

export function PnaBucketPage() {
  const q = useCrmQuery(['pna'], '/pna-bucket');
  const stock = useCrmQuery(['my-stock'], '/stock');
  const lk = useLk();
  const [sel, setSel] = useState([]);
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const raise = useCrmMutation((b) => crm.post('/pna-bucket/raise-po', b), { onSuccess: () => { setSel([]); q.refetch(); } });
  const del = useCrmMutation((id) => crm.del(`/pna-bucket/${id}`), { onSuccess: () => q.refetch() });
  const rows = q.data?.data || [];
  const avl = (pid) => (stock.data?.data || []).find((s) => String(s.part?._id) === String(pid))?.fresh || 0;
  return (
    <div>
      <PageTitle icon={Package}>PNA Bucket</PageTitle>
      <Alert>{msg}</Alert>
      <form className="dms-filter" onSubmit={(e) => { e.preventDefault(); if (!to) { setMsg('Select To Location/WH'); return; } if (!sel.length) { setMsg('Select at least one part'); return; } setMsg(''); raise.mutate({ bucketIds: sel, toLocation: to }); }}>
        <Field label="To Location/WH" required><Select value={to} options={o.loc(lk.whs)} onChange={(e) => setTo(e.target.value)} /></Field>
        <Btn variant="default" onClick={() => setSel(rows.map((r) => r._id))}>Select All</Btn>
        <Btn variant="default" onClick={() => setSel([])}>Unselect All</Btn>
        <button type="submit" className="dms-btn" disabled={raise.isPending}>SAVE</button>
      </form>
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'partcode', label: 'Partcode' }, { key: 'avl', label: 'Stock Avilable', render: (r) => avl(r.part?._id) }, { key: 'partName', label: 'Part Details' }, { key: 'qty', label: 'Qty' },
        { key: 'jobNo', label: 'Job No.' }, { key: 'createdAt', label: 'Request Date', render: (r) => fmt.dmy(r.createdAt) },
        { key: 'action', label: 'Action', sortable: false, render: (r) => iconBtn('Delete PNA Part', Trash2, () => window.confirm('Delete this PNA part?') && del.mutate(r._id)) },
        { key: 'confirm', label: 'Confirm', sortable: false, render: (r) => <input type="checkbox" aria-label={`Select ${r.partcode}`} checked={sel.includes(r._id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r._id] : s.filter((x) => x !== r._id)))} /> },
      ])} />
    </div>
  );
}

function stockInList({ title, docTypes, receiverLabel = 'Receive', extraFields, isWh }) {
  return function StockInList() {
    const me = useMe();
    const [modal, setModal] = useState(null);
    const [items, setItems] = useState(null);
    const q = useCrmQuery(['stockin', title], '/dispatches', { docType: docTypes.join(',') });
    const [f, setF] = useState({});
    const rows = (q.data?.data || []).filter((r) => (me?.isAdmin || String(r.toLocation?._id) === String(me?.location?._id)) && inRange(r.createdAt, f) && (!f.status || r.status === f.status));
    return (
      <div>
        <PageTitle icon={PackageCheck}>{title}</PageTitle>
        <Filters filters={[DATE, { n: 'status', label: 'Status', o: ['Processed', 'Dispatched', 'Received'], ph: '--Please Select-' }]} onGo={setF} />
        <DataTable rows={rows} loading={q.isLoading} columns={cols([
          { key: 'from', label: 'From Location', render: (r) => `${r.fromLocation?.name || ''} (${r.fromLocation?.code || ''})` }, { key: 'docNo', label: isWh ? 'Challan No.' : 'Document No.' },
          { key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: isWh ? 'Entry Date' : 'Doc Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'status', label: 'Status' }, { key: 'docType', label: 'Type' },
          { key: 'view', label: 'View', sortable: false, render: (r) => iconBtn('View', Eye, () => setItems(r)) },
          { key: 'print', label: 'Print', sortable: false, render: printBtn },
          { key: 'rcv', label: receiverLabel, sortable: false, render: (r) => (r.status === 'Dispatched' ? <button type="button" className="dms-btn sm" onClick={() => setModal(r)}>{receiverLabel}</button> : r.status === 'Received' ? `Received ${fmt.dmy(r.receivedAt)}` : '') },
        ])} />
        {modal && <ReceiveModal doc={modal} url={`/dispatches/${modal._id}/receive`} extraFields={extraFields} onClose={() => { setModal(null); q.refetch(); }} />}
        {items && <ItemsModal title={items.docNo} items={items.items} onClose={() => setItems(null)} />}
      </div>
    );
  };
}
export const StockInPage = stockInList({ title: 'Stock In', docTypes: ['Invoice', 'Delivery Challan', 'STN'] });
export const WhReceiveReturnPage = stockInList({ title: 'Receive Purchase Return', docTypes: ['Purchase Return', 'Faulty Dispatch'], isWh: true });

export const EngineerStockPage = () => (
  <ListPage title="Engineer Stock" icon={Package} url="/engineer-stock"
    filters={[{ n: 'engineer', label: 'Engineer Name', o: (lk) => o.eng((lk.engineers || []).filter((e) => e.userType === 'Engineer')), ph: 'ALL' }]}
    rowsOf={(rows) => rows.map((r) => ({ ...r, eng: r.engineer ? `${r.engineer.displayName} (${r.engineer.loginId})` : '', brand: r.part?.brand?.name, product: r.part?.product?.name, partcode: r.part?.partcode, desc: r.part?.partName, price: r.part?.customerPrice, alt: (r.part?.alternatePartcodes || []).join(', ') }))}
    columns={[{ key: 'eng', label: 'Engineer Name' }, { key: 'brand', label: 'Brand' }, { key: 'product', label: 'Product Category' }, { key: 'partcode', label: 'Partcode' }, { key: 'desc', label: 'Description' }, { key: 'alt', label: 'Alternate Partcode' }, { key: 'price', label: 'Customer Price', t: 'money' }, { key: 'fresh', label: 'Fresh' }, { key: 'defective', label: 'Defective' }]} />
);

function DispatchForm({ title, icon, docType, fields, lineShow, priceOf, toBody, saveLabel = 'Process', backTo, stockKind = 'fresh', defaults }) {
  const [lines, setLines] = useState([emptyPart()]);
  const stock = useCrmQuery(['my-stock'], '/stock');
  return (
    <ActionForm title={title} icon={icon} url="/dispatches" saveLabel={saveLabel} fields={fields} defaults={defaults}
      extraValid={() => (linesPayload(lines).length ? '' : 'Add at least one part with quantity')}
      toBody={(v) => ({ docType, ...(toBody ? toBody(v) : v), items: linesPayload(lines) })}
      onDone={(res, nav) => (backTo ? nav(backTo) : setLines([emptyPart()]))}>
      {() => <PartLines lines={lines} setLines={setLines} show={{ avl: true, ...lineShow }} priceOf={priceOf}
        stockOf={(pid) => (stock.data?.data || []).find((s) => String(s.part?._id) === pid)?.[stockKind] || 0} />}
    </ActionForm>
  );
}

const CUSTOMER_FIELDS = [
  { n: 'customerName', label: 'Customer Name', req: true }, { n: 'customerState', label: 'State', t: 'select', o: (lk) => o.text(lk.states), req: true },
  { n: 'customerGstn', label: 'GSTN' }, { n: 'customerPhone', label: 'Contact No.', req: true }, { n: 'customerEmail', label: 'Email' },
];
export const RetailInvoiceAddPage = () => (
  <DispatchForm title="Retail Invoice" icon={Receipt} docType="Retail Invoice" backTo={`${B}/retail-invoice`} priceOf={(p) => p?.customerPrice}
    lineShow={{ serial: true, discount: true, tax: true }}
    fields={[...CUSTOMER_FIELDS, { n: 'deliveryAddress', label: 'Delivery Address', t: 'textarea', req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]} />
);
export const RetailInvoiceListPage = () => (
  <DocList title="Invoice Status" icon={Receipt} url="/dispatches" params={{ docType: 'Retail Invoice' }}
    filters={[DATE, { n: 'status', label: 'Invoice Status', o: ['Processed', 'Dispatched', 'Received', 'Cancelled'] }]} filterFn={(r, f) => inRange(r.createdAt, f) && (!f.status || r.status === f.status)}
    columns={[{ key: 'bf', label: 'Billing From', render: (r) => r.fromLocation?.name, text: (r) => r.fromLocation?.name }, { key: 'customerName', label: 'Billing To' }, { key: 'docNo', label: 'Invoice No.' },
      { key: 'createdAt', label: 'Invoice Date', render: (r) => fmt.dmy(r.createdAt), text: (r) => fmt.dmy(r.createdAt) }, { key: 'grandTotal', label: 'Amount', render: (r) => fmt.money(r.grandTotal) }, { key: 'status', label: 'Status' },
      { key: 'print', label: 'Print', sortable: false, render: printBtn }]} />
);

export function PurchaseReturnPage() {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);
  return (
    <>
      <DocList title="Purchase Return" icon={Truck} url="/dispatches" params={{ docType: 'Purchase Return' }} filters={[DATE]} filterFn={(r, f) => inRange(r.createdAt, f)}
        toolbar={<Btn onClick={() => nav(`${B}/purchase-return/new`)}>Add New</Btn>}
        columns={[{ key: 'f', label: 'From Location Name', render: (r) => r.fromLocation?.name }, { key: 't', label: 'To Location Name', render: (r) => r.toLocation?.name }, { key: 'docNo', label: 'Challan No.' },
          { key: 'createdAt', label: 'Entry Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'status', label: 'Status' }, { key: 'print', label: 'Print', sortable: false, render: printBtn },
          { key: 'uc', label: 'Update Courier', sortable: false, render: (r) => iconBtn('Update Courier', Truck, () => setModal(r)) }]} />
      {modal && <CourierModal doc={modal} onClose={() => setModal(null)} />}
    </>
  );
}
export const PurchaseReturnAddPage = () => (
  <DispatchForm title="Purchase Return" icon={Truck} docType="Purchase Return" backTo={`${B}/purchase-return`} priceOf={(p) => p?.locationPrice} lineShow={{ tax: true }}
    defaults={{ stockType: 'Fresh' }}
    fields={[{ n: 'toLocation', label: 'Billing To', t: 'select', o: (lk) => o.loc(lk.whs), req: true }, { n: 'transferType', label: 'Transfer Type', t: 'select', o: ['Sale Return(Invoice)'], ph: false },
      { n: 'stockType', label: 'Stock Type', t: 'select', o: ['Fresh', 'Faulty'], ph: false, req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]} />
);

export function FaultyBinPage() {
  const q = useCrmQuery(['faulty-bin'], '/faulty-bin');
  const lk = useLk();
  const [sel, setSel] = useState([]);
  const [v, setV] = useState({ toLocation: '', courierName: '', docketNo: '' });
  const [msg, setMsg] = useState('');
  const save = useCrmMutation((b) => crm.post('/dispatches', b), { onSuccess: () => { setSel([]); q.refetch(); } });
  const rows = q.data?.data || [];
  const submit = (e) => {
    e.preventDefault();
    if (!v.toLocation) { setMsg('Select Location Name'); return; }
    if (!sel.length) { setMsg('Select at least one part'); return; }
    setMsg('');
    save.mutate({ docType: 'Faulty Dispatch', stockType: 'Faulty', ...v, items: rows.filter((r) => sel.includes(r._id)).map((r) => ({ part: r.part, qty: r.qty, jobNo: r.jobNo })) });
  };
  return (
    <form onSubmit={submit}>
      <PageTitle icon={Truck}>Faulty/P2C Bin</PageTitle>
      <Alert>{msg}</Alert>
      <div className="dms-filter">
        <Field label="Location Name" required><Select value={v.toLocation} options={o.loc(lk.whs)} onChange={(e) => setV((s) => ({ ...s, toLocation: e.target.value }))} /></Field>
        <Btn variant="default" onClick={() => setSel(rows.map((r) => r._id))}>Check All</Btn><Btn variant="default" onClick={() => setSel([])}>Uncheck All</Btn>
      </div>
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'jobNo', label: 'Job No' }, { key: 'serialNo', label: 'Serial No' }, { key: 'model', label: 'Model' }, { key: 'part', label: 'Part', render: (r) => `${r.partName} (${r.partcode})` }, { key: 'qty', label: 'Qty' },
        { key: 'c', label: 'Confrim', sortable: false, render: (r) => <input type="checkbox" aria-label={`Select ${r.partcode}`} checked={sel.includes(r._id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r._id] : s.filter((x) => x !== r._id)))} /> },
      ])} />
      <div className="dms-form" style={{ marginTop: 10 }}>
        <Field label="Courier Name"><Input value={v.courierName} onChange={(e) => setV((s) => ({ ...s, courierName: e.target.value }))} /></Field>
        <Field label="Docket No"><Input value={v.docketNo} onChange={(e) => setV((s) => ({ ...s, docketNo: e.target.value }))} /></Field>
      </div>
      <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Dispatch</button><BackBtn /></div>
    </form>
  );
}

function InvoicesChallans({ title, docTypes, fromMe = true, cancel = false }) {
  const me = useMe();
  const [modal, setModal] = useState(null);
  const canc = useCrmMutation((id) => crm.post(`/dispatches/${id}/cancel`));
  return (
    <>
      <DocList title={title} icon={Truck} url="/dispatches" params={{ docType: docTypes.join(',') }}
        filters={[DATE, { n: 'status', label: 'Document Status', o: ['Processed', 'Dispatched', 'Received', 'Cancelled'], ph: '--Please Select-' }, { n: 'location', label: 'Location Name', o: (lk) => o.loc(lk.locations), ph: '--Please Select-' }]}
        filterFn={(r, f) => (!fromMe || me?.isAdmin || String(r.fromLocation?._id) === String(me?.location?._id)) && inRange(r.createdAt, f) && (!f.status || r.status === f.status) && (!f.location || String(r.toLocation?._id) === f.location)}
        columns={DOC_COLS([{ key: 'view', label: 'View', sortable: false, render: printBtn },
          { key: 'uc', label: 'Update Courier', sortable: false, render: (r) => (r.status === 'Dispatched' ? iconBtn('Update Courier', Truck, () => setModal(r)) : '') },
          ...(cancel ? [{ key: 'ac', label: 'Action', sortable: false, render: (r) => (['Dispatched', 'Processed'].includes(r.status) ? <button type="button" className="dms-btn sm danger" onClick={() => window.confirm(`Cancel ${r.docNo}? Stock will be returned.`) && canc.mutate(r._id)}>Cancel</button> : '') }] : [])])} />
      {modal && <CourierModal doc={modal} onClose={() => setModal(null)} />}
    </>
  );
}
export const FaultyDispatchedPage = () => <InvoicesChallans title="Invoices/Challans" docTypes={['Faulty Dispatch']} />;
export const WhInvoicesPage = () => <InvoicesChallans title="Invoices/Challans" docTypes={['Invoice', 'Delivery Challan', 'STN', 'Retail Invoice']} />;
export const InvoiceCancelPage = () => <InvoicesChallans title="Invoice Cancellation" docTypes={['Invoice', 'Delivery Challan', 'STN', 'Retail Invoice', 'Purchase Return', 'Faulty Dispatch']} fromMe={false} cancel />;

export function EngIssueListPage() {
  const nav = useNavigate();
  return (
    <DocList title="Spare Issue To Engineer" icon={Package} url="/dispatches" params={{ docType: 'Engineer Issue' }} filters={[DATE]} filterFn={(r, f) => inRange(r.createdAt, f)}
      toolbar={<Btn onClick={() => nav(`${B}/eng-issue/new`)}>Add New</Btn>}
      columns={[{ key: 'f', label: 'From Location Name', render: (r) => r.fromLocation?.name }, { key: 'u', label: 'To User Name', render: (r) => r.toEngineer?.displayName || '' }, { key: 'docNo', label: 'Challan No.' },
        { key: 'createdAt', label: 'Entry Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'jobNo', label: 'Job No.' }, { key: 'totalQty', label: 'Qty' }, { key: 'status', label: 'Status' }, { key: 'print', label: 'Print', sortable: false, render: printBtn }]} />
  );
}

export function EngIssueAddPage({ ret }) {
  const lk = useLk();
  const me = useMe();
  const [lines, setLines] = useState([emptyPart()]);
  const stock = useCrmQuery(['my-stock'], '/stock');
  const engStock = useCrmQuery(['eng-stock-all'], '/engineer-stock');
  const jobs = useCrmQuery(['open-jobs'], '/jobs', { closed: '0' });
  const engs = (lk.engineers || []).filter((e) => e.userType === 'Engineer' && String(e.location?._id || e.location) === String(me?.location?._id));
  return (
    <ActionForm title={ret ? 'Stock Return From Engineer' : 'Stock Issue'} icon={Package} url={ret ? '/stock/return-engineer' : '/stock/issue-engineer'} saveLabel={ret ? 'Receive' : 'Issue'}
      fields={[
        { n: 'engineerId', label: 'Engineer Name', t: 'select', o: () => o.eng(engs), req: true },
        { n: 'issueType', label: 'Issue Type', t: 'select', o: ['Against job', 'Bulk Part issue'], req: true },
        { n: 'jobNo', label: 'Job No.', t: 'select', ph: '--Select Job NO--', o: (l, v) => (jobs.data?.data || []).filter((j) => !v.engineerId || String(j.engineer?._id || j.engineer) === v.engineerId).map((j) => j.jobNo), req: true, when: (v) => v.issueType === 'Against job' },
        { n: 'remark', label: 'Remark', t: 'textarea' },
      ]}
      extraValid={() => (linesPayload(lines).length ? '' : 'Add at least one part with quantity')}
      toBody={(v) => ({ ...v, items: linesPayload(lines), stockKind: 'fresh' })}
      onDone={(res, nav) => nav(ret ? `${B}/eng-faulty` : `${B}/eng-issue`)}>
      {(v) => <PartLines lines={lines} setLines={setLines} show={{ avl: true }} priceOf={(p) => p?.customerPrice}
        stockOf={(pid) => (ret ? (engStock.data?.data || []).find((s) => String(s.part?._id) === pid && String(s.engineer?._id) === v.engineerId)?.fresh || 0 : (stock.data?.data || []).find((s) => String(s.part?._id) === pid)?.fresh || 0)} />}
    </ActionForm>
  );
}

export const EngDemandPage = () => (
  <ListPage title="Stock Issue To Engineer" icon={Package} url="/jobs" params={{ status: 'PNA' }}
    filters={[DATE, { n: 'engineer', label: 'Location Name', o: (lk) => o.eng((lk.engineers || []).filter((e) => e.userType === 'Engineer')), ph: 'Please Select' }]}
    rowsOf={(rows) => {
      const m = new Map();
      for (const j of rows) { const k = j.engineer?._id || 'none'; if (!m.has(k)) m.set(k, { _id: k, code: j.engineer?.loginId || '-', name: j.engineerName || 'Unassigned', jobs: 0, list: [] }); const r = m.get(k); r.jobs += 1; r.list.push(j.jobNo); }
      return [...m.values()].map((r) => ({ ...r, list: r.list.join(', ') }));
    }}
    columns={[{ key: 'code', label: 'Engineer Code' }, { key: 'name', label: 'Engineer Name' }, { key: 'jobs', label: 'Pending Demand (Jobs)' }, { key: 'list', label: 'View' }]} />
);

export function EngFaultyReturnPage() {
  const q = useCrmQuery(['eng-stock-all'], '/engineer-stock');
  const [sel, setSel] = useState([]);
  const [f, setF] = useState({});
  const recv = useCrmMutation(async (groups) => {
    let last;
    for (const [engineerId, items] of Object.entries(groups)) last = await crm.post('/stock/return-engineer', { engineerId, items, stockKind: 'defective', remark: 'Faulty part received from engineer' });
    return last;
  }, { onSuccess: () => { setSel([]); q.refetch(); } });
  const rows = (q.data?.data || []).filter((r) => r.defective > 0 && (!f.engineer || String(r.engineer?._id) === f.engineer));
  const go = () => {
    const groups = {};
    for (const r of rows.filter((x) => sel.includes(x._id))) (groups[r.engineer._id] ||= []).push({ part: r.part._id, qty: r.defective });
    recv.mutate(groups);
  };
  return (
    <div>
      <PageTitle icon={PackageCheck}>Faulty Part Receive From Engineer</PageTitle>
      <Filters filters={[{ n: 'engineer', label: 'Engineer Name', o: (lk) => o.eng((lk.engineers || []).filter((e) => e.userType === 'Engineer')), ph: 'ALL' }]} onGo={setF} />
      <Toolbar><Btn variant="default" onClick={() => setSel(rows.map((r) => r._id))}>Select All</Btn><Btn variant="default" onClick={() => setSel([])}>Unselect All</Btn>
        <button type="button" className="dms-btn" disabled={!sel.length || recv.isPending} onClick={go}>Receive</button></Toolbar>
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'pc', label: 'Partcode', render: (r) => r.part?.partcode }, { key: 'pd', label: 'Part Details', render: (r) => r.part?.partName }, { key: 'e', label: 'Engineer Name', render: (r) => r.engineer?.displayName },
        { key: 'defective', label: 'Faulty Qty' }, { key: 'rt', label: 'Receive Type', render: () => 'Faulty' },
        { key: 'c', label: 'Confirm', sortable: false, render: (r) => <input type="checkbox" aria-label={`Select ${r.part?.partcode}`} checked={sel.includes(r._id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r._id] : s.filter((x) => x !== r._id)))} /> },
      ])} />
    </div>
  );
}

/* ───────────── WH ───────────── */
const GST_LINES = { tax: true };
export function LocalGrnPage() {
  const nav = useNavigate();
  return (
    <DocList title="Local GRN" icon={Warehouse} url="/grn" filters={[DATE]} rowsOf={(r) => r.filter((x) => x.grnType === 'Local')} filterFn={(r, f) => inRange(r.createdAt, f)}
      toolbar={<Btn onClick={() => nav(`${B}/grn/local/new`)}>Add New</Btn>}
      columns={[{ key: 's', label: 'Supplier Name', render: (r) => r.supplier?.name }, { key: 'l', label: 'Location name', render: (r) => r.shipTo?.name }, { key: 'grnNo', label: 'GRN No.' },
        { key: 'receivedAt', label: 'Receive Date', render: (r) => fmt.dmy(r.receivedAt) }, { key: 'status', label: 'Status' }, { key: 'grandTotal', label: 'Amount', render: (r) => fmt.money(r.grandTotal) }]} />
  );
}
export function LocalGrnAddPage() {
  const [lines, setLines] = useState([emptyPart()]);
  return (
    <ActionForm title="Add Local GRN" icon={Warehouse} url="/grn/local" saveLabel="Receive"
      fields={[{ n: 'supplier', label: 'Supplier Name', t: 'select', o: (lk) => (lk.vendors || []).map((x) => ({ value: x._id, label: `${x.name} | ${x.code}` })), req: true },
        { n: 'billTo', label: 'Bill To', t: 'select', o: (lk) => o.loc(lk.whs), req: true }, { n: 'shipTo', label: 'Ship to', t: 'select', o: (lk) => o.loc(lk.whs), req: true },
        { n: 'supplierAddress', label: 'Supplier Address', t: 'textarea', req: true }, { n: 'billingAddress', label: 'Billing Address', t: 'textarea', req: true }, { n: 'shippingAddress', label: 'Shipping Address', t: 'textarea', req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]}
      extraValid={() => (linesPayload(lines).length ? '' : 'Add at least one part with quantity')}
      toBody={(v) => ({ ...v, items: linesPayload(lines) })} onDone={(r, nav) => nav(`${B}/grn/local`)}>
      {() => <PartLines lines={lines} setLines={setLines} show={GST_LINES} priceOf={(p) => p?.purchasePrice} />}
    </ActionForm>
  );
}

export function VendorPoPage({ approval }) {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);
  const [items, setItems] = useState(null);
  return (
    <>
      <DocList title={approval ? 'Admin Approval' : 'PO To Vendor'} icon={approval ? ShieldCheck : Warehouse} url="/po" params={{ poType: 'VENDOR' }}
        filters={[DATE, { n: 'status', label: 'PO Status', o: ['Pending', 'Approved', 'Rejected', 'Received', 'Cancelled'], ph: '--Please Select-' }]} filterFn={(r, f) => inRange(r.createdAt, f) && (!f.status || r.status === f.status)}
        toolbar={!approval && <Btn onClick={() => nav(`${B}/vendor-po/new`)}>Add New</Btn>}
        columns={[{ key: 's', label: 'Supplier Name', render: (r) => r.supplier?.name, text: (r) => r.supplier?.name }, { key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: 'PO Date', render: (r) => fmt.dmy(r.createdAt) },
          { key: 'totalAmount', label: 'Total Amount', render: (r) => fmt.money(r.totalAmount) }, { key: 'status', label: 'Status' },
          { key: 'print', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/po/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> },
          { key: 'view', label: 'View', sortable: false, render: (r) => <span style={{ display: 'flex', gap: 6 }}>{iconBtn('View', Eye, () => setItems(r))}{approval && r.status === 'Pending' && <button type="button" className="dms-btn sm" onClick={() => setModal(r)}>Approve</button>}</span> }]} />
      {modal && <ApproveModal po={modal} onClose={() => setModal(null)} />}
      {items && <ItemsModal title={`PO ${items.poNo}`} items={items.items} onClose={() => setItems(null)} />}
    </>
  );
}
function ApproveModal({ po, onClose }) {
  const [v, setV] = useState({ decision: 'Approved', remark: '' });
  const save = useCrmMutation((b) => crm.post(`/po/${po._id}/approve`, b), { onSuccess: onClose });
  return (
    <Modal open title={`Vendor PO ${po.poNo} — ₹ ${fmt.money(po.totalAmount)}`} onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Close</Btn><button type="button" className="dms-btn" onClick={() => save.mutate(v)}>Save</button></>}>
      <div className="dms-form">
        <Field label="Decision" required><Select value={v.decision} placeholder={false} options={['Approved', 'Rejected']} onChange={(e) => setV((s) => ({ ...s, decision: e.target.value }))} /></Field>
        <Field label="Remark"><TextArea value={v.remark} onChange={(e) => setV((s) => ({ ...s, remark: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}
export function VendorPoAddPage() {
  const [lines, setLines] = useState([emptyPart()]);
  const me = useMe();
  return (
    <ActionForm title="Add New PO" icon={Warehouse} url="/po" saveLabel="ADD"
      fields={[{ n: 'supplier', label: 'Supplier Name', t: 'select', o: (lk) => (lk.vendors || []).map((x) => ({ value: x._id, label: `${x.name} | ${x.code}` })), req: true }, { n: 'supplierAddress', label: 'Supplier Address', req: true },
        { n: 'fromLocation', label: 'Bill To', t: 'select', o: (lk) => o.loc(lk.whs), req: true }, { n: 'billingAddress', label: 'Billing Address', req: true },
        { n: 'toLocation', label: 'Ship to', t: 'select', o: (lk) => o.loc(lk.whs), req: true }, { n: 'shippingAddress', label: 'Shipping Address', req: true },
        { n: 'vendorType', label: 'Type', t: 'select', o: ['Import', 'Local', 'Interstate'], ph: false }, { n: 'docType', label: 'Document Type', t: 'select', o: ['Invoice', 'Challan'], ph: false }, { n: 'remark', label: 'Remark', t: 'textarea' }]}
      defaults={{ vendorType: 'Local', docType: 'Invoice', fromLocation: me?.location?._id || '', toLocation: me?.location?._id || '' }}
      extraValid={() => (linesPayload(lines).length ? '' : 'Add at least one part with quantity')}
      toBody={(v) => ({ ...v, poType: 'VENDOR', items: linesPayload(lines) })} onDone={(r, nav) => nav(`${B}/vendor-po`)}>
      {() => <PartLines lines={lines} setLines={setLines} show={GST_LINES} priceOf={(p) => p?.purchasePrice} />}
    </ActionForm>
  );
}

export function GateEntryPage() {
  const q = useCrmQuery(['grn-all'], '/grn');
  const pos = useCrmQuery(['vpo-approved'], '/po', { poType: 'VENDOR', status: 'Approved' });
  const [show, setShow] = useState(false);
  const rows = (q.data?.data || []).filter((g) => g.grnType === 'PO');
  return (
    <div>
      <PageTitle icon={PackageCheck}>Gate Entry</PageTitle>
      <Toolbar><Btn onClick={() => setShow(true)}>Add Gate Entry</Btn></Toolbar>
      <DataTable rows={rows} loading={q.isLoading} columns={cols([{ key: 'gateEntryNo', label: 'Entry Number' }, { key: 'poNo', label: 'PO No.' }, { key: 'vehicleNo', label: 'Vehicle No.' }, { key: 'v', label: 'Vendor Name', render: (r) => r.supplier?.name },
        { key: 'createdAt', label: 'Date of Entry', render: (r) => fmt.dmy(r.createdAt) }, { key: 'status', label: 'Status' }])} />
      {show && (
        <Modal open title="Add Gate Entry" onClose={() => setShow(false)}>
          <ActionForm url="/grn/gate-entry" saveLabel="GO" back={false} onDone={() => { setShow(false); q.refetch(); }}
            fields={[{ n: 'poNo', label: 'Select PO Number', t: 'select', o: () => (pos.data?.data || []).map((p) => p.poNo), req: true }, { n: 'vehicleNo', label: 'Vehicle No.' }, { n: 'transportName', label: 'Transport name' }, { n: 'docketNo', label: 'Billty/Docket number' }]} />
        </Modal>
      )}
    </div>
  );
}

export function ReceiveGrnPage({ status }) {
  const q = useCrmQuery(['grn-all'], '/grn');
  const [modal, setModal] = useState(null);
  const [items, setItems] = useState(null);
  const rows = (q.data?.data || []).filter((g) => (status === 'Received' ? g.status === 'Received' : g.grnType === 'PO' && g.status === 'Gate Entry'));
  return (
    <div>
      <PageTitle icon={PackageCheck}>{status === 'Received' ? 'GRN Status' : 'Receive GRN'}</PageTitle>
      <DataTable rows={rows} loading={q.isLoading} columns={cols(status === 'Received'
        ? [{ key: 'grnNo', label: 'GRN No.' }, { key: 'receivedAt', label: 'GRN Date', render: (r) => fmt.dmy(r.receivedAt) }, { key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: 'PO Date', render: (r) => fmt.dmy(r.createdAt) },
          { key: 'v', label: 'View', sortable: false, render: (r) => iconBtn('View', Eye, () => setItems(r)) }]
        : [{ key: 'gateEntryNo', label: 'Gate Entry No' }, { key: 'poNo', label: 'PO No.' }, { key: 's', label: 'Supplier Name', render: (r) => r.supplier?.name }, { key: 'createdAt', label: 'Entry Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'status', label: 'Status' },
          { key: 'v', label: 'View', sortable: false, render: (r) => <button type="button" className="dms-btn sm" onClick={() => setModal(r)}>Receive</button> }])} />
      {modal && <ReceiveModal doc={modal} title={`Receive GRN View — ${modal.gateEntryNo}`} url={`/grn/${modal._id}/receive`} onClose={() => { setModal(null); q.refetch(); }}
        extraFields={[{ n: 'invoiceNo', label: 'Invoice No', req: true }, { n: 'invoiceDate', label: 'Invoice Date', t: 'date', req: true }]} />}
      {items && <ItemsModal title={items.grnNo} items={items.items} onClose={() => setItems(null)} />}
    </div>
  );
}

export function WhPoPage() {
  const [disp, setDisp] = useState(null);
  return (
    <>
      <DocList title="Against PO/PNA" icon={Truck} url="/po" params={{ poType: 'PNA,MSL' }}
        filters={[DATE, { n: 'status', label: 'PO Status', o: ['Pending', 'Partial Processed', 'Cancelled', 'Dispatched', 'Received'], ph: '--Please Select-' }, { n: 'location', label: 'Location Name', o: (lk) => o.loc(lk.asps), ph: '--Please Select-' }, { n: 'poType', label: 'PO Type', o: ['PNA', 'MSL'] }]}
        filterFn={(r, f) => inRange(r.createdAt, f) && (!f.status || r.status === f.status) && (!f.location || String(r.fromLocation?._id) === f.location) && (!f.poType || r.poType === f.poType)}
        columns={[{ key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: 'PO Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'poType', label: 'PO Type' }, { key: 'lc', label: 'Location Code', render: (r) => r.fromLocation?.code },
          { key: 'ln', label: 'Location Name', render: (r) => r.fromLocation?.name }, { key: 'cs', label: 'City/State', render: (r) => `${r.fromLocation?.city || ''}/${r.fromLocation?.state || ''}` }, { key: 'status', label: 'Status' },
          { key: 'view', label: 'View', sortable: false, render: (r) => (['Pending', 'Approved', 'Partial Processed'].includes(r.status) ? <button type="button" className="dms-btn sm" onClick={() => setDisp(r._id)}>Dispatch</button> : '') },
          { key: 'print', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/po/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> }]} />
      {disp && <DispatchPoModal id={disp} onClose={() => setDisp(null)} />}
    </>
  );
}
function DispatchPoModal({ id, onClose }) {
  const q = useCrmQuery(['po-one', id], `/po/${id}`);
  const po = q.data?.data;
  const [qty, setQty] = useState({});
  const [v, setV] = useState({ docType: 'Invoice' });
  const [msg, setMsg] = useState('');
  const save = useCrmMutation((b) => crm.post(`/po/${id}/dispatch`, b), { onSuccess: onClose });
  if (!po) return null;
  const pend = (l) => Math.max(0, l.reqQty - l.dispQty);
  const submit = () => {
    const items = po.items.map((l) => ({ part: l.part, jobNo: l.jobNo, price: l.price, dispQty: Number(qty[l.part] ?? pend(l)) })).filter((x) => x.dispQty > 0);
    const over = po.items.find((l) => Number(qty[l.part] ?? pend(l)) > Math.min(pend(l), l.whAvl));
    if (over) { setMsg(`Dispatch qty for ${over.partcode} is more than pending or available stock`); return; }
    if (!items.length) { setMsg('Enter dispatch quantity'); return; }
    save.mutate({ ...v, items }, { onError: (e) => setMsg(crmApiError(e).message) });
  };
  return (
    <Modal open title={`Dispatch Location PO/PNA — PO No.- ${po.poNo}`} onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Back</Btn><button type="button" className="dms-btn" disabled={save.isPending} onClick={submit}>Dispatch</button></>}>
      <Alert>{msg}</Alert>
      <KV pairs={[['PO No.', po.poNo], ['PO Date', fmt.dmy(po.createdAt)], ['From Location', po.fromLocation?.name], ['To Location', po.toLocation?.name], ['PO Type', po.poType], ['Status', po.status]]} />
      <table className="dms-table" style={{ marginTop: 10 }}><thead><tr><th>#</th><th>Partcode</th><th>Part</th><th>Job No.</th><th>Price</th><th>Req./Pend. Qty</th><th>ASP Avl Qty</th><th>Dispatch Qty</th><th>Amount</th><th>Available Qty</th></tr></thead>
        <tbody>{po.items.map((l, i) => { const d = Number(qty[l.part] ?? Math.min(pend(l), l.whAvl)); return (
          <tr key={i}><td>{i + 1}</td><td>{l.partcode}</td><td>{l.partName}</td><td>{l.jobNo}</td><td>{fmt.money(l.price)}</td><td>{l.reqQty}/{pend(l)}</td><td>{l.aspAvl}</td>
            <td><Input type="number" min="0" style={{ width: 70 }} value={qty[l.part] ?? Math.min(pend(l), l.whAvl)} onChange={(e) => setQty((s) => ({ ...s, [l.part]: e.target.value }))} /></td><td>{fmt.money(d * l.price)}</td><td>{l.whAvl}</td></tr>); })}</tbody></table>
      <div className="dms-form" style={{ marginTop: 10 }}>
        <Field label="Document Type"><Select value={v.docType} placeholder={false} options={['Invoice', 'Delivery Challan']} onChange={(e) => setV((s) => ({ ...s, docType: e.target.value }))} /></Field>
        <Field label="FCA Invoice No."><Input value={v.fcaInvoiceNo || ''} onChange={(e) => setV((s) => ({ ...s, fcaInvoiceNo: e.target.value }))} /></Field>
        <Field label="Courier Name"><Input value={v.courierName || ''} onChange={(e) => setV((s) => ({ ...s, courierName: e.target.value }))} /></Field>
        <Field label="Docket No."><Input value={v.docketNo || ''} onChange={(e) => setV((s) => ({ ...s, docketNo: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

export const DirectDispatchPage = () => (
  <DispatchForm title="Direct Dispatch To ASP" icon={Truck} docType="Invoice" backTo={`${B}/dispatches`} priceOf={(p) => p?.locationPrice} saveLabel="Dispatch"
    fields={[{ n: 'toLocation', label: 'Location', t: 'select', o: (lk) => o.loc(lk.asps), req: true }, { n: 'docType', label: 'Document Type', t: 'select', o: [{ value: 'Invoice', label: 'Invoice' }, { value: 'Delivery Challan', label: 'Challan' }], ph: false },
      { n: 'courierName', label: 'Courier Name' }, { n: 'docketNo', label: 'Docket No.' }, { n: 'remark', label: 'Remark', t: 'textarea' }]}
    defaults={{ docType: 'Invoice' }} />
);
export const StnPage = () => (
  <DispatchForm title="STN" icon={Truck} docType="STN" backTo={`${B}/dispatches`} priceOf={(p) => p?.locationPrice} saveLabel="Dispatch"
    fields={[{ n: 'toLocation', label: 'Location Name', t: 'select', o: (lk) => o.loc(lk.locations), req: true }, { n: 'stockType', label: 'Stock Type', t: 'select', o: ['OK', 'Faulty'], req: true },
      { n: 'purpose', label: 'Purpose', t: 'select', o: ['DOA', 'Faulty', 'Fresh'], req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]} />
);
export const ScrapOutPage = () => (
  <DispatchForm title="Retail Billing" icon={Receipt} docType="Retail Invoice" backTo={`${B}/dispatches`} priceOf={(p) => p?.customerPrice} lineShow={{ discount: true, tax: true }}
    fields={[...CUSTOMER_FIELDS, { n: 'stockType', label: 'Stock Type.', t: 'select', o: ['Fresh', 'Faulty'], req: true }, { n: 'deliveryAddress', label: 'Delivery Address', t: 'textarea', req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]} />
);

/* ───────────── Admin ───────────── */
export function PoCancelPage() {
  const canc = useCrmMutation((id) => crm.post(`/po/${id}/cancel`));
  return (
    <DocList title="PO Details" icon={ShieldCheck} url="/po" params={{ status: 'Pending,Approved' }}
      filters={[{ n: 'location', label: 'Location Name', o: (lk) => o.loc(lk.locations), req: true }]} filterFn={(r, f) => !f.location || String(r.fromLocation?._id) === f.location}
      columns={[{ key: 'poNo', label: 'PO No.' }, { key: 'createdAt', label: 'PO Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'poType', label: 'PO Type' }, { key: 'status', label: 'Status' }, { key: 't', label: 'To Location', render: (r) => r.toLocation?.name || r.supplier?.name },
        { key: 'd', label: 'Delete', sortable: false, render: (r) => iconBtn('Cancel PO', Trash2, () => window.confirm(`Cancel ${r.poNo}?`) && canc.mutate(r._id)) }]} />
  );
}

export function StockAdjustmentPage() {
  const [sp, setSp] = useState(false);
  const me = useMe();
  if (sp) return <StockAdjustmentAdd onDone={() => setSp(false)} me={me} />;
  return (
    <ListPage title="Stock Adjustment" icon={Package} report="spares-log" rowsOf={(r) => r.filter((x) => x.txnType === 'Stock Adjustment')}
      toolbar={<Btn onClick={() => setSp(true)}>Add New Entry</Btn>}
      columns={[{ key: 'partcode', label: 'Partcode' }, { key: 'partName', label: 'Part' }, { key: 'by', label: 'Entry By' }, { key: 'refNo', label: 'System Ref No.' }, { key: 'qty', label: 'Adjust QTY' }, { key: 'date', label: 'Entry Date', t: 'dt' }]} />
  );
}
function StockAdjustmentAdd({ onDone, me }) {
  const lk = useLk();
  const [loc, setLoc] = useState(me?.crmRole === 'WH' ? me.location?._id : '');
  const [rows, setRows] = useState([{ part: '', ok: '', damage: '', missing: '', okT: '+', damageT: '+', missingT: '+' }]);
  const [remark, setRemark] = useState('');
  const [msg, setMsg] = useState('');
  const stock = useCrmQuery(['adj-stock', loc], '/reports/stock-details', { location: loc }, { enabled: Boolean(loc) });
  const save = useCrmMutation((b) => crm.post('/stock/adjustment', b), { onSuccess: onDone });
  const st = (pid) => (stock.data?.data || []).find((s) => s.partcode === (lk.parts || []).find((p) => p._id === pid)?.partcode) || {};
  const set = (i, x) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...x } : r)));
  const sgn = (t, n) => (t === '-' ? -1 : 1) * Number(n || 0);
  const submit = () => {
    if (!loc) { setMsg('Select Location'); return; }
    const items = rows.filter((r) => r.part).map((r) => ({ part: r.part, okDelta: sgn(r.okT, r.ok), damageDelta: sgn(r.damageT, r.damage), missingDelta: sgn(r.missingT, r.missing) }));
    if (!items.length) { setMsg('Add at least one partcode'); return; }
    save.mutate({ locationId: loc, items, remark }, { onError: (e) => setMsg(crmApiError(e).message) });
  };
  return (
    <div>
      <PageTitle icon={Package}>Stock Adjustment</PageTitle>
      <Alert>{msg}</Alert>
      <div className="dms-form"><Field label="Select Location" required><Select value={loc} options={o.loc(lk.locations)} onChange={(e) => setLoc(e.target.value)} disabled={me?.crmRole === 'WH'} /></Field></div>
      <div className="dms-table-wrap" style={{ marginTop: 10 }}><table className="dms-table">
        <thead><tr><th rowSpan={2}>Partcode</th><th colSpan={3}>OK QTY</th><th colSpan={3}>Damage QTY</th><th colSpan={3}>Missing QTY</th></tr>
          <tr>{['OK', 'Damage', 'Missing'].flatMap((x) => [<th key={`${x}t`}>Type</th>, <th key={`${x}q`}>Adjust QTY</th>, <th key={`${x}a`}>Available QTY</th>])}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>
            <td><Select value={r.part} placeholder="Select Partcode" options={o.part(lk.parts)} onChange={(e) => set(i, { part: e.target.value })} /></td>
            {[['ok', 'fresh'], ['damage', 'damage'], ['missing', 'missing']].flatMap(([k, s]) => [
              <td key={`${k}t`}><Select value={r[`${k}T`]} placeholder={false} options={['+', '-']} onChange={(e) => set(i, { [`${k}T`]: e.target.value })} /></td>,
              <td key={`${k}q`}><Input type="number" min="0" style={{ width: 70 }} value={r[k]} onChange={(e) => set(i, { [k]: e.target.value })} /></td>,
              <td key={`${k}a`} className="r">{r.part ? st(r.part)[s] ?? 0 : ''}</td>,
            ])}
          </tr>
        ))}</tbody>
      </table><Btn size="sm" onClick={() => setRows((rs) => [...rs, { part: '', ok: '', damage: '', missing: '', okT: '+', damageT: '+', missingT: '+' }])}>Add Row</Btn></div>
      <div className="dms-form" style={{ marginTop: 10 }}><Field label="Remark" full><TextArea value={remark} onChange={(e) => setRemark(e.target.value)} /></Field></div>
      <div className="dms-actions"><button type="button" className="dms-btn" disabled={save.isPending} onClick={submit}>Process!</button><Btn variant="default" onClick={onDone}>Back</Btn></div>
    </div>
  );
}

/* ───────────── Prints (invoice / challan / PO) ───────────── */
export function DocPrintPage({ po }) {
  const { id } = useParams();
  const q = useCrmQuery(['print', po ? 'po' : 'doc', id], po ? `/po/${id}` : `/dispatches/${id}`);
  const d = q.data?.data;
  if (q.error) return <p>{crmApiError(q.error).message}</p>;
  if (!d) return <p>Loading…</p>;
  const from = po ? d.toLocation : d.fromLocation;
  const to = po ? (d.supplier ? { name: d.supplier.name, billingAddress: d.supplier.address } : d.fromLocation) : d.toLocation || { name: d.customerName, billingAddress: d.deliveryAddress, state: d.customerState, gstNo: d.customerGstn, phone: d.customerPhone };
  const title = po ? (d.poType === 'VENDOR' ? 'PURCHASE ORDER' : `${d.poType} PURCHASE ORDER`) : d.docType === 'Delivery Challan' || d.docType === 'STN' || d.docType === 'Faulty Dispatch' || d.docType === 'Engineer Issue' ? 'DELIVERY CHALLAN' : 'TAX INVOICE';
  const items = d.items || [];
  return (
    <div className="crm-print" style={{ maxWidth: 820, margin: '0 auto', padding: 16, font: '12px Arial, sans-serif', color: '#000', background: '#fff' }}>
      <style>{'.crm-print table{width:100%;border-collapse:collapse}.crm-print td,.crm-print th{border:1px solid #000;padding:5px 6px;text-align:left}.crm-print .r{text-align:right}@media print{.no-print{display:none}}'}</style>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 10 }}><button type="button" className="dms-btn" onClick={() => window.print()}>Print</button></div>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px' }}>{title}</h2>
      <table><tbody>
        <tr><td style={{ width: '50%' }}><b>From:</b> {from?.name}<br />{from?.billingAddress}<br />{from?.city} {from?.state}<br />GSTIN: {from?.gstNo || '-'}</td>
          <td><b>{po ? 'PO No.' : 'Document No.'}:</b> {po ? d.poNo : d.docNo}<br /><b>Date:</b> {fmt.dmy(d.createdAt)}<br />{d.poNo && !po && <><b>PO No.:</b> {d.poNo}<br /></>}{d.jobNo && <><b>Job No.:</b> {d.jobNo}<br /></>}{d.courierName && <><b>Courier:</b> {d.courierName} {d.docketNo}</>}</td></tr>
        <tr><td colSpan={2}><b>To:</b> {to?.name} {to?.code ? `(${to.code})` : ''}<br />{to?.billingAddress}<br />{to?.city || ''} {to?.state || ''} {to?.phone ? `Ph: ${to.phone}` : ''}<br />GSTIN: {to?.gstNo || '-'}</td></tr>
      </tbody></table>
      <table style={{ marginTop: 8 }}><thead><tr><th>#</th><th>Partcode</th><th>Description</th><th>Job No.</th><th className="r">Qty</th><th className="r">Rate</th><th className="r">Amount</th></tr></thead>
        <tbody>{items.map((l, i) => <tr key={i}><td>{i + 1}</td><td>{l.partcode}</td><td>{l.partName}</td><td>{l.jobNo}</td><td className="r">{l.reqQty ?? l.qty}</td><td className="r">{fmt.money(l.price)}</td><td className="r">{fmt.money(l.total ?? (l.reqQty ?? l.qty) * l.price)}</td></tr>)}
          <tr><td colSpan={4} className="r"><b>Total</b></td><td className="r"><b>{items.reduce((s, l) => s + Number(l.reqQty ?? l.qty), 0)}</b></td><td /><td className="r"><b>{fmt.money(d.grandTotal ?? d.totalAmount)}</b></td></tr>
          {!!d.taxTotal && <tr><td colSpan={6} className="r">Tax</td><td className="r">{fmt.money(d.taxTotal)}</td></tr>}
        </tbody></table>
      {d.remark && <p><b>Remark:</b> {d.remark}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}><span>Receiver Signature</span><span>For {from?.name}<br /><br />Authorised Signatory</span></div>
    </div>
  );
}
