import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, CalendarDays } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, apiError } from '../api';
import { PageTitle, Field, Select, TextArea, Alert, Btn, BackBtn, Modal, Input, locOpt, prodOpt } from '../components/ui';
import { useFormCtx } from './PoPages';
import { EntityList } from './EntityPages';

/* ───────── STN Distribution: one source → several destinations ───────── */
export function StnDistributionForm() {
  const nav = useNavigate();
  const [from, setFrom] = useState('');
  const [docType, setDocType] = useState('DELIVERY CHALLAN');
  const [dests, setDests] = useState([]);
  const [prods, setProds] = useState([]);
  const [grid, setGrid] = useState({}); // `${dest}|${prod}` → qty
  const [applied, setApplied] = useState(false);
  const [remark, setRemark] = useState('');
  const [msg, setMsg] = useState('');
  const ctx = useFormCtx(from);
  const { lk } = ctx;
  const pmap = useMemo(() => new Map((lk?.products || []).map((p) => [p._id, p])), [lk]);
  const lmap = useMemo(() => new Map((lk?.allLocations || []).map((l) => [l._id, l])), [lk]);
  const save = useDmsMutation((b) => dms.post('/invoices/stn-distribution', b), { onSuccess: () => nav('/distributor/invoicing/stn-distribution') });
  const totals = prods.map((p) => dests.reduce((n, d) => n + (Number(grid[`${d}|${p}`]) || 0), 0));
  const over = prods.filter((p, i) => totals[i] > ctx.stockOf(p));
  const submit = (e) => {
    e.preventDefault(); setMsg('');
    if (over.length) { setMsg(`Total exceeds available stock for: ${over.map((p) => pmap.get(p)?.productCode).join(', ')}`); return; }
    const rows = dests.map((d) => ({ to: d, lines: prods.map((p) => ({ product: p, qty: Number(grid[`${d}|${p}`]) || 0, price: 0 })).filter((l) => l.qty > 0) })).filter((r) => r.lines.length);
    if (!rows.length) { setMsg('Enter at least one quantity'); return; }
    save.mutate({ from, docType, rows, remark }, { onError: (err) => setMsg(apiError(err).message) });
  };
  const multi = (value, set, options) => (
    <select multiple style={{ height: 140 }} value={value} onChange={(e) => { set([...e.target.selectedOptions].map((o) => o.value)); setApplied(false); }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  return (
    <>
      <PageTitle icon={Monitor}>STN Distribution</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          <Field label="Distribution From" required><Select required value={from} options={(lk?.locations || []).map(locOpt)} onChange={(e) => { setFrom(e.target.value); setApplied(false); }} /></Field>
          <Field label="Distribution To (Ctrl+click for several)" required>{multi(dests, setDests, (lk?.allLocations || []).filter((l) => l._id !== from).map(locOpt))}</Field>
          <Field label="Product (Ctrl+click for several)" required>{multi(prods, setProds, (lk?.products || []).filter((p) => !p.isSerialized).map(prodOpt))}</Field>
          <Field label="Document Type"><Select placeholder={false} value={docType} options={[{ value: 'DELIVERY CHALLAN', label: 'Delivery Challan' }, { value: 'INVOICE', label: 'Invoice' }]} onChange={(e) => setDocType(e.target.value)} /></Field>
        </div>
        <div className="dms-actions"><Btn disabled={!from || !dests.length || !prods.length} onClick={() => setApplied(true)}>Apply</Btn></div>
        {applied && (
          <>
            <div className="dms-table-wrap"><table className="dms-table">
              <thead><tr><th>Destination</th>{prods.map((p) => <th key={p}>{pmap.get(p)?.productCode}<br /><span style={{ fontWeight: 400 }}>Avl {ctx.stockOf(p)}</span></th>)}</tr></thead>
              <tbody>
                {dests.map((d) => (
                  <tr key={d}><td>{lmap.get(d)?.name}</td>{prods.map((p) => (
                    <td key={p}><input className="dms-input" type="number" min="0" aria-label={`Qty ${lmap.get(d)?.name} ${pmap.get(p)?.productCode}`} style={{ width: 90 }} value={grid[`${d}|${p}`] || ''} onChange={(e) => setGrid({ ...grid, [`${d}|${p}`]: e.target.value })} /></td>
                  ))}</tr>
                ))}
                <tr><td><b>Total</b></td>{prods.map((p, i) => <td key={p} className="r" style={over.includes(p) ? { color: '#d9534f', fontWeight: 700 } : undefined}>{totals[i]}</td>)}</tr>
              </tbody>
            </table></div>
            <div className="dms-form" style={{ marginTop: 12 }}><Field label="Remark"><TextArea value={remark} onChange={(e) => setRemark(e.target.value)} /></Field></div>
            <p className="dms-muted" style={{ textAlign: 'center' }}>One stock transfer is created per destination; each goes to Stock Transfer Approval before stock moves. Serial-tracked products are transferred through Stock Transfer.</p>
            <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Save</button><BackBtn to="/distributor/invoicing/stn-distribution" /></div>
          </>
        )}
      </form>
    </>
  );
}

/* ───────── My Beat Plan: month calendar + create task ───────── */
const TASKS = ['Collection', 'Dealer Visit', 'Feedback', 'Sale Order'];
export function MyBeatPlan() {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = month;
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const { data } = useDmsQuery('beat-cal', '/entities/beat', { view: 'mine', from: iso(first), to: iso(last), perPage: 200 });
  const byDay = useMemo(() => { const m = {}; for (const b of data?.data || []) (m[b.data.date] ||= []).push(b); return m; }, [data]);
  const [task, setTask] = useState(null);
  const [msg, setMsg] = useState('');
  const create = useDmsMutation((b) => dms.post('/entities/beat', b), { onSuccess: () => setTask(null) });
  const cells = [];
  for (let i = 0; i < first.getDay(); i += 1) cells.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  const color = { Scheduled: '#337ab7', Visited: '#5cb85c', Missed: '#d9534f' };
  return (
    <>
      <PageTitle icon={CalendarDays}>My Beat Plan</PageTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Btn variant="default" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹ Prev</Btn>
        <b>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn onClick={() => setTask({ task: '', area: '', date: iso(new Date()) })}>Create Task</Btn>
          <Btn variant="default" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next ›</Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: '1px solid #ddd' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} style={{ background: '#337ab7', color: '#fff', fontWeight: 700, padding: 6, textAlign: 'center' }}>{d}</div>)}
        {cells.map((d, i) => (
          <div key={i} style={{ minHeight: 86, border: '1px solid #eee', padding: 4, background: d && iso(d) === iso(new Date()) ? '#fcf8e3' : '#fff' }}>
            {d && <div style={{ fontSize: 11, color: '#777' }}>{d.getDate()}</div>}
            {d && (byDay[iso(d)] || []).map((b) => (
              <a key={b._id} href={`/distributor/e/beat/${b._id}`} title={`${b.data.task} — ${b.data.area} (${b.status})`}
                style={{ display: 'block', fontSize: 11, color: '#fff', background: color[b.status] || '#777', borderRadius: 3, padding: '1px 4px', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {b.data.task}: {b.data.area}
              </a>
            ))}
          </div>
        ))}
      </div>
      <Modal open={Boolean(task)} title="Create Task" onClose={() => setTask(null)}
        footer={<><Btn disabled={create.isPending} onClick={() => { setMsg(''); create.mutate(task, { onError: (e) => setMsg(apiError(e).message) }); }}>ADD</Btn><Btn variant="default" onClick={() => setTask(null)}>Close</Btn></>}>
        <Alert>{msg}</Alert>
        <Field label="Task Name" required><Select value={task?.task || ''} placeholder="--Please Select--" options={TASKS} onChange={(e) => setTask({ ...task, task: e.target.value })} /></Field>
        <Field label="Area To Visit" required><Input value={task?.area || ''} onChange={(e) => setTask({ ...task, area: e.target.value })} /></Field>
        <Field label="Date" required><Input type="date" value={task?.date || ''} onChange={(e) => setTask({ ...task, date: e.target.value })} /></Field>
      </Modal>
      <div style={{ marginTop: 16 }}><EntityList mode="mine" type="beat" title="Task Details" /></div>
    </>
  );
}
