/* Shared building blocks for the Service CRM panels (reference: CANCRM V6). */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { crm, crmApiError, useCrmLookups, useCrmMe, useCrmMutation, useCrmQuery, fmt } from './api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, Field, Input, Select, TextArea, Alert, Panel, KV, Status, IconBtn, exportCsv,
} from '../components/ui';

export const B = '/distributor/service';
export const STATES_FALLBACK = [];
export const useLk = () => useCrmLookups().data?.data || {};
export const useMe = () => useCrmMe().data?.data;

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const YEARS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 3 + i));
export const STATUS2 = ['Active', 'Deactive'];

/** Option builders from lookups. */
export const o = {
  named: (arr = []) => arr.map((x) => ({ value: x._id, label: x.name })),
  loc: (arr = []) => arr.map((l) => ({ value: l._id, label: `${l.name} (${l.code})` })),
  model: (arr = []) => arr.map((m) => ({ value: m._id, label: `${m.modelName} | ${m.modelCode}` })),
  part: (arr = []) => arr.map((p) => ({ value: p._id, label: `${p.partName} | ${p.partcode}` })),
  eng: (arr = []) => arr.map((e) => ({ value: e._id, label: `${e.displayName} | ${e.loginId}` })),
  text: (arr = []) => arr.map((x) => ({ value: x.name, label: x.name })),
};

export const fmtCell = (t, v) => {
  if (v === undefined || v === null || v === '') return '';
  if (t === 'date') return fmt.dmy(v);
  if (t === 'dt') return fmt.dt(v);
  if (t === 'money') return fmt.money(v);
  return v;
};

/** Columns: [{key,label,t?,render?}] → DataTable columns with S.No first. */
export const cols = (list, sno = true) => [
  ...(sno ? [{ key: '#', label: 'S.No', sortable: false, width: 60 }] : []),
  ...list.map((c) => ({ ...c, render: c.render || (c.t ? (r) => fmtCell(c.t, r[c.key]) : undefined), text: c.text || (c.t ? (r) => fmtCell(c.t, r[c.key]) : undefined) })),
];

/* ───────────── Filters ───────────── */
function FilterInput({ f, v, set, lk }) {
  const options = typeof f.o === 'function' ? f.o(lk, v) : f.o || [];
  if (f.t === 'daterange') {
    return (
      <span style={{ display: 'flex', gap: 6 }}>
        <Input type="date" aria-label="From date" value={v.from || ''} onChange={(e) => set({ from: e.target.value })} />
        <Input type="date" aria-label="To date" value={v.to || ''} onChange={(e) => set({ to: e.target.value })} />
      </span>
    );
  }
  if (f.t === 'check') return <input type="checkbox" checked={v[f.n] === '1'} onChange={(e) => set({ [f.n]: e.target.checked ? '1' : '' })} />;
  if (f.t === 'text') return <Input value={v[f.n] || ''} onChange={(e) => set({ [f.n]: e.target.value })} />;
  return <Select value={v[f.n] || ''} placeholder={f.ph ?? 'All'} options={options} onChange={(e) => set({ [f.n]: e.target.value })} required={f.req} />;
}

export function Filters({ filters, onGo, initial = {}, goLabel = 'GO' }) {
  const lk = useLk();
  const [v, setV] = useState(initial);
  if (!filters?.length) return null;
  return (
    <form className="dms-filter" onSubmit={(e) => { e.preventDefault(); const out = {}; for (const [k, x] of Object.entries(v)) if (x) out[k] = x; onGo(out); }}>
      {filters.map((f) => (
        <Field key={f.n || f.t} label={f.label} required={f.req}>
          <FilterInput f={f} v={v} lk={lk} set={(x) => setV((s) => ({ ...s, ...x }))} />
        </Field>
      ))}
      <button type="submit" className="dms-btn">{goLabel}</button>
    </form>
  );
}

/** Filter → GO → table → Excel. `url` (API path) or `report` (report key). */
export function ListPage({ title, icon, filters, url, report, columns, params: fixed, actions, toolbar, auto = true, rowsOf, empty, after, groups }) {
  const [p, setP] = useState(auto ? {} : null);
  const path = url || `/reports/${report}`;
  const q = useCrmQuery(['list', path], path, p ? { ...fixed, ...p } : undefined, { enabled: p !== null });
  const raw = q.data?.data;
  const rows = useMemo(() => (rowsOf ? rowsOf(raw || []) : raw || []), [raw, rowsOf]);
  const colList = useMemo(() => (typeof columns === 'function' ? columns(rows) : columns), [columns, rows]);
  const c = useMemo(() => cols(actions ? [...colList, ...actions] : colList), [colList, actions]);
  return (
    <div>
      <PageTitle icon={icon}>{title}</PageTitle>
      <Filters filters={filters} onGo={setP} />
      {(toolbar || p) && (
        <Toolbar>
          {toolbar}
          {p && <Btn variant="default" onClick={() => exportCsv(title, colList.map((x) => ({ ...x, text: x.text || ((r) => (x.t ? fmtCell(x.t, r[x.key]) : r[x.key])) })), rows)}>Export Excel</Btn>}
        </Toolbar>
      )}
      {q.error && <Alert>{crmApiError(q.error).message}</Alert>}
      {p && <DataTable columns={c} rows={rows} loading={q.isLoading} emptyText={empty} groups={groups} />}
      {after?.(rows)}
    </div>
  );
}

/* ───────────── Masters (list + add/edit form) ───────────── */
export function FormField({ fd, v, set, lk, err }) {
  const val = v[fd.n];
  const options = typeof fd.o === 'function' ? fd.o(lk, v) : fd.o || [];
  const ch = (x) => set({ [fd.n]: x });
  let input;
  if (fd.t === 'select') input = <Select value={val ?? ''} options={options} placeholder={fd.ph ?? '--Please Select--'} error={err} onChange={(e) => ch(e.target.value)} />;
  else if (fd.t === 'multi') input = <select multiple className={err ? 'err' : ''} style={{ height: 110 }} value={val || []} onChange={(e) => ch([...e.target.selectedOptions].map((x) => x.value))}>{options.map((x) => (typeof x === 'string' ? <option key={x}>{x}</option> : <option key={x.value} value={x.value}>{x.label}</option>))}</select>;
  else if (fd.t === 'textarea') input = <TextArea rows={3} value={val ?? ''} error={err} onChange={(e) => ch(e.target.value)} />;
  else if (fd.t === 'yn') input = <span className="dms-radio">{['Yes', 'No'].map((x) => <label key={x} style={{ marginRight: 14 }}><input type="radio" name={fd.n} checked={val === (x === 'Yes')} onChange={() => ch(x === 'Yes')} /> {x}</label>)}</span>;
  else if (fd.t === 'check') input = <input type="checkbox" checked={Boolean(val)} onChange={(e) => ch(e.target.checked)} />;
  else if (fd.t === 'checks') input = <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>{options.map((x) => { const k = x.value ?? x; const on = (val || []).includes(k); return <label key={k}><input type="checkbox" checked={on} onChange={() => ch(on ? val.filter((y) => y !== k) : [...(val || []), k])} /> {x.label ?? x}</label>; })}</span>;
  else input = <Input type={fd.t || 'text'} value={val ?? ''} error={err} readOnly={fd.ro} onChange={(e) => ch(e.target.value)} />;
  return <Field label={fd.label} required={fd.req} error={err} full={fd.full}>{input}</Field>;
}

export function FormGrid({ fields, v, setV, errors = {} }) {
  const lk = useLk();
  return (
    <div className="dms-form">
      {fields.filter((fd) => !fd.when || fd.when(v)).map((fd) => (
        fd.t === 'heading'
          ? <h4 key={fd.label} className="full" style={{ margin: '6px 0 0', color: 'var(--dms-primary)' }}>{fd.label}</h4>
          : <FormField key={fd.n} fd={fd} v={v} lk={lk} err={errors[fd.n]} set={(x) => setV((s) => ({ ...s, ...x }))} />
      ))}
    </div>
  );
}

const required = (fields, v) => {
  const e = {};
  for (const fd of fields) {
    if (!fd.req || (fd.when && !fd.when(v))) continue;
    const x = v[fd.n];
    if (x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length)) e[fd.n] = 'Required';
  }
  return e;
};

/**
 * cfg: { title, icon, url, columns, fields, addLabel, toBody(v), fromRow(row), statusFilter, canAdd, rowsOf, defaults }
 */
export function MasterPage({ cfg }) {
  const [sp, setSp] = useSearchParams();
  const form = sp.get('form');
  const me = useMe();
  const list = useCrmQuery(['master', cfg.url], cfg.url, cfg.params);
  const [status, setStatus] = useState('');
  const rows = useMemo(() => {
    const r = cfg.rowsOf ? cfg.rowsOf(list.data?.data || []) : list.data?.data || [];
    return status ? r.filter((x) => (x.status || 'Active') === status) : r;
  }, [list.data, status, cfg]);
  const canAdd = cfg.canAdd ? cfg.canAdd(me) : me?.isAdmin;
  if (form) return <MasterForm cfg={cfg} id={form} row={rows.find((r) => r._id === form) || (list.data?.data || []).find((r) => r._id === form)} onDone={() => setSp({})} />;
  const columns = cols([
    ...cfg.columns,
    ...(canAdd && cfg.fields ? [{ key: '_e', label: 'View/Edit', sortable: false, render: (r) => <button type="button" className="dms-icon-btn" title="Edit" onClick={() => setSp({ form: r._id })}>✎</button> }] : []),
  ]);
  return (
    <div>
      <PageTitle icon={cfg.icon}>{cfg.title}</PageTitle>
      {cfg.statusFilter !== false && (
        <form className="dms-filter" onSubmit={(e) => e.preventDefault()}>
          <Field label="Status"><Select value={status} placeholder="All" options={STATUS2} onChange={(e) => setStatus(e.target.value)} /></Field>
        </form>
      )}
      <Toolbar>
        {canAdd && cfg.fields && <Btn onClick={() => setSp({ form: 'new' })}>{cfg.addLabel || 'Add New'}</Btn>}
        <Btn variant="default" onClick={() => exportCsv(cfg.title, cfg.columns.map((c) => ({ ...c, text: c.text || ((r) => (c.t ? fmtCell(c.t, r[c.key]) : r[c.key])) })), rows)}>Export Excel</Btn>
      </Toolbar>
      {list.error && <Alert>{crmApiError(list.error).message}</Alert>}
      <DataTable columns={columns} rows={rows} loading={list.isLoading} />
    </div>
  );
}

function MasterForm({ cfg, id, row, onDone }) {
  const isNew = id === 'new';
  const [v, setV] = useState(() => (isNew ? { status: 'Active', ...(cfg.defaults || {}) } : cfg.fromRow ? cfg.fromRow(row || {}) : { ...(row || {}) }));
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const save = useCrmMutation((b) => (isNew ? crm.post(cfg.saveUrl || cfg.url, b) : crm.put(`${cfg.saveUrl || cfg.url}/${id}`, b)), { onSuccess: onDone });
  if (!isNew && !row) return <div className="dms-loading">Loading…</div>;
  const submit = (e) => {
    e.preventDefault();
    const er = required(cfg.fields, v);
    setErrors(er); setMsg(Object.keys(er).length ? 'Please fill all required (*) fields.' : '');
    if (Object.keys(er).length) return;
    save.mutate(cfg.toBody ? cfg.toBody(v) : v, { onError: (err) => { const x = crmApiError(err); setMsg(x.message); setErrors(x.fieldErrors || {}); } });
  };
  return (
    <form onSubmit={submit} noValidate>
      <PageTitle icon={cfg.icon}>{cfg.formTitle || cfg.title.replace(/ Master$/, '')}</PageTitle>
      <Alert>{msg}</Alert>
      <FormGrid fields={cfg.fields} v={v} setV={setV} errors={errors} />
      <div className="dms-actions">
        <button type="submit" className="dms-btn" disabled={save.isPending}>{isNew ? (cfg.saveLabel || 'Save') : 'Update'}</button>
        <Btn variant="default" onClick={onDone}>Back</Btn>
      </div>
    </form>
  );
}

/* ───────────── Part line items (Product → Brand → Model → Partcode) ───────────── */
export const emptyPart = () => ({ product: '', brand: '', model: '', part: '', qty: '', price: '', discount: '', igst: '' });

/**
 * show: { price, cost, avl, discount, tax, serial } ; priceOf(part) → default price ; stockOf(partId) → available qty
 */
export function PartLines({ lines, setLines, show = {}, priceOf = (p) => p?.locationPrice || 0, stockOf, partFilter }) {
  const lk = useLk();
  const parts = lk.parts || [];
  const setRow = (i, x) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...x } : l)));
  const models = (l) => (lk.models || []).filter((m) => (!l.brand || String(m.brand?._id || m.brand) === l.brand) && (!l.product || String(m.product?._id || m.product) === l.product));
  const partOpts = (l) => parts.filter((p) => (!l.brand || String(p.brand?._id || p.brand) === l.brand) && (!l.product || String(p.product?._id || p.product) === l.product)
    && (!l.model || !(p.models || []).length || (p.models || []).some((m) => String(m._id || m) === l.model)) && (!partFilter || partFilter(p)));
  const total = (l) => {
    const base = Number(l.qty || 0) * Number(l.price || 0) - Number(l.discount || 0);
    return base + (base * Number(l.igst || 0)) / 100;
  };
  return (
    <div className="dms-table-wrap" style={{ marginTop: 10 }}>
      <table className="dms-table">
        <thead><tr>
          <th>Product</th><th>Brand</th><th>Model</th><th>Partcode</th>{show.serial && <th>Serial No</th>}<th>Qty</th>
          {show.avl && <th>Available Stock</th>}{show.price !== false && <th>Price</th>}{show.discount && <th>Discount</th>}{show.tax && <th>IGST(%)</th>}{show.price !== false && <th>Total</th>}<th />
        </tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td><Select value={l.product} options={o.named(lk.products)} placeholder="Select" onChange={(e) => setRow(i, { product: e.target.value, model: '', part: '' })} /></td>
              <td><Select value={l.brand} options={o.named(lk.brands)} placeholder="Select" onChange={(e) => setRow(i, { brand: e.target.value, model: '', part: '' })} /></td>
              <td><Select value={l.model} options={o.model(models(l))} placeholder="Select Model" onChange={(e) => setRow(i, { model: e.target.value, part: '' })} /></td>
              <td><Select value={l.part} options={o.part(partOpts(l))} placeholder="Select Partcode" aria-label="Partcode"
                onChange={(e) => { const p = parts.find((x) => x._id === e.target.value); setRow(i, { part: e.target.value, price: l.price || priceOf(p) || '' }); }} /></td>
              {show.serial && <td><Input value={l.serialNo || ''} onChange={(e) => setRow(i, { serialNo: e.target.value })} /></td>}
              <td><Input type="number" min="1" style={{ width: 80 }} aria-label="Qty" value={l.qty} onChange={(e) => setRow(i, { qty: e.target.value })} /></td>
              {show.avl && <td className="r">{l.part && stockOf ? stockOf(l.part) : ''}</td>}
              {show.price !== false && <td><Input type="number" min="0" style={{ width: 100 }} aria-label="Price" value={l.price} onChange={(e) => setRow(i, { price: e.target.value })} /></td>}
              {show.discount && <td><Input type="number" min="0" style={{ width: 90 }} value={l.discount} onChange={(e) => setRow(i, { discount: e.target.value })} /></td>}
              {show.tax && <td><Input type="number" min="0" style={{ width: 70 }} value={l.igst} onChange={(e) => setRow(i, { igst: e.target.value })} /></td>}
              {show.price !== false && <td className="r">{fmt.money(total(l))}</td>}
              <td>{lines.length > 1 && <IconBtn icon={Trash2} title="Remove row" danger onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Btn size="sm" onClick={() => setLines((ls) => [...ls, emptyPart()])}>Add Row</Btn>
        <span><b>Total Qty:</b> {lines.reduce((s, l) => s + Number(l.qty || 0), 0)} &nbsp; <b>Grand Total:</b> ₹ {fmt.money(lines.reduce((s, l) => s + total(l), 0))}</span>
      </div>
    </div>
  );
}
export const linesPayload = (lines) => lines.filter((l) => l.part && Number(l.qty) > 0).map((l) => ({ part: l.part, qty: Number(l.qty), reqQty: Number(l.qty), price: Number(l.price || 0), discount: Number(l.discount || 0), igst: Number(l.igst || 0), serialNo: l.serialNo }));

/** Generic "fill a form, then POST" page. */
export function ActionForm({ title, icon, fields, url, toBody, saveLabel = 'Save', defaults = {}, children, extraValid, onDone, back = true }) {
  const nav = useNavigate();
  const [v, setV] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const save = useCrmMutation((b) => crm.post(typeof url === 'function' ? url(v) : url, b), {
    onSuccess: (res) => { setOk(res?.message || 'Saved'); if (onDone) onDone(res, nav); else setV(defaults); },
  });
  const submit = (e) => {
    e.preventDefault(); setOk('');
    const er = required(fields, v);
    const extra = extraValid?.(v);
    setErrors(er); setMsg(extra || (Object.keys(er).length ? 'Please fill all required (*) fields.' : ''));
    if (Object.keys(er).length || extra) return;
    save.mutate(toBody ? toBody(v) : v, { onError: (err) => { const x = crmApiError(err); setMsg(x.message); setErrors(x.fieldErrors || {}); } });
  };
  return (
    <form onSubmit={submit} noValidate>
      {title && <PageTitle icon={icon}>{title}</PageTitle>}
      <Alert>{msg}</Alert><Alert ok>{ok}</Alert>
      <FormGrid fields={fields} v={v} setV={setV} errors={errors} />
      {children?.(v, setV)}
      <div className="dms-actions">
        <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : saveLabel}</button>
        {back && <BackBtn />}
      </div>
    </form>
  );
}

/* ───────────── Job detail panels (Complaint Details) ───────────── */
export function JobPanels({ job, sections = ['customer', 'product', 'observation', 'history'] }) {
  if (!job) return null;
  const vocs = [...(job.vocs || []), job.vocText].filter(Boolean).join(', ');
  return (
    <>
      {sections.includes('customer') && (
        <Panel title="Customer Details">
          <KV pairs={[
            ['Customer Name', job.customerName], ['Address', job.address], ['Contact No. (For SMS Update)', job.contactNo], ['Alternate Contact No.', job.altContactNo],
            ['State', job.state], ['Email', job.email], ['City', job.city], ['Pincode', job.pincode], ['Customer Category', job.customerCategory],
            ['Residence No', job.customer?.residenceNo], ['Landmarks', job.landmark], ['Customer Id', job.customerIdCode],
          ]} />
        </Panel>
      )}
      {sections.includes('product') && (
        <Panel title="Product Details">
          <KV pairs={[
            ['Product', job.productName], ['Brand', job.brandName], ['Model', job.modelName], ['Date Of Installation', fmt.dmy(job.installationDate)],
            ['Serial No', job.serialNo], ['Call Source', job.callSource], ['Warranty Status', job.warrantyStatus], ['Job For', job.callType],
            ['Purchase Date', fmt.dmy(job.purchaseDate)], ['Warranty End Date', fmt.dmy(job.warrantyEndDate)], ['Invoice No', job.invoiceNo], ['Purchase From', job.purchaseFrom],
            ['Dealer Name', job.dealerName], ['Service Type', job.serviceType],
          ]} />
        </Panel>
      )}
      {sections.includes('observation') && (
        <Panel title="Observation">
          <KV pairs={[
            ['Assign Location', job.assignLocation?.name || job.assignLocationName], ['VOC', vocs], ['Remark', job.remark], ['Happy Code', job.happyCode],
            ['Confirm By', job.handover?.confirmBy], ['Contact No', job.handover?.contactNo], ['Service Remark', job.handover?.remark], ['Rating', job.handover?.rating ?? 0],
            ['Service Charge', job.estimate?.serviceCharge || job.model?.serviceCharges], ['Document Type', job.closeType], ['Customer Ready to Pay', job.customerReadyToPay ? 'Yes' : 'No'], ['Document No.', job.closeDocNo],
            ['Eng Name', job.engineer?.displayName || job.engineerName], ['Eng Phone No', job.engineer?.phone], ['Pending Reason', job.pendingReason], ['Close Reason', job.closeReason],
            ['Status', job.statusText || job.status], ['Sub Status', job.subStatus], ['Visit', job.visitDate ? `${fmt.dmy(job.visitDate)} / ${job.visitTime || ''}` : ''], ['Priority', job.priority],
          ]} />
        </Panel>
      )}
      {sections.includes('repair') && job.repairDetails?.length > 0 && (
        <Panel title="Repair Detail">
          <table className="dms-table"><thead><tr><th>Fault Code</th><th>Repair Code</th><th>Partcode</th><th>Part Name</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>{job.repairDetails.map((d, i) => <tr key={i}><td>{d.faultName || d.faultCode}</td><td>{d.repairName || d.repairCode}</td><td>{d.partcode}</td><td>{d.partName}</td><td>{d.qty}</td><td>{fmt.money(d.price)}</td></tr>)}</tbody>
          </table>
        </Panel>
      )}
      {sections.includes('history') && (
        <Panel title="History">
          <div className="dms-table-wrap"><table className="dms-table">
            <thead><tr><th>Location</th><th>Activity</th><th>Outcome</th><th>Travel(KM)</th><th>Update By</th><th>Remark</th><th>Priority</th><th>Update on</th></tr></thead>
            <tbody>{(job.history || []).map((h, i) => <tr key={i}><td>{h.location}</td><td>{h.activity}</td><td>{h.outcome}</td><td>{fmt.money(h.travelKm)}</td><td>{h.updateBy}</td><td>{h.remark}</td><td>{h.priority}</td><td>{fmt.dt(h.updateOn)}</td></tr>)}</tbody>
          </table></div>
        </Panel>
      )}
    </>
  );
}

export const JobLink = ({ r }) => <Link to={`${B}/jobs/view/${r._id}`}>{r.jobNo}</Link>;
export { Status, Btn, BackBtn, PageTitle, Toolbar, Field, Input, Select, TextArea, Alert, Panel, KV, DataTable, fmt, crm, useCrmMutation, useCrmQuery, crmApiError };
