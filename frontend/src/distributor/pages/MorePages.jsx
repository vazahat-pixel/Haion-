import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Briefcase, Gauge, FileBarChart, Users, MapPin, Upload } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError, fmt } from '../api';
import { PageTitle, Btn, BackBtn, DataTable, Field, Input, Select, Alert, Panel, KV, Status, TextArea, locOpt, prodOpt } from '../components/ui';
import { FilterBar } from './MasterPages';
import { Report, useLocProdOpts } from './ReportPages';
import { EntityList } from './EntityPages';
import '../dms.css';
import { readSheet, readList, downloadTemplate } from '../excel';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLORS = ['#337ab7', '#5cb85c', '#f0ad4e', '#d9534f', '#5bc0de', '#777', '#8e44ad', '#16a085', '#e67e22', '#2c3e50'];
const years = () => { const y = new Date().getFullYear(); return Array.from({ length: 8 }, (_, i) => String(y - 5 + i)); };

const useOpt = (kind) => useDmsQuery(`opt-${kind}`, `/entities/options/${kind}`, undefined, { staleTime: 30_000 }).data?.data || [];

/* ───────── HR ───────── */
export function AttendancePage() {
  const { data, refetch } = useDmsQuery('att-today', '/entities/attendance-today');
  const [address, setAddress] = useState('');
  const [msg, setMsg] = useState('');
  const punch = useDmsMutation((kind) => dms.post('/entities/attendance-punch', { kind, address }), { onSuccess: () => refetch() });
  const rec = data?.data?.data;
  const go = (kind) => { setMsg(''); punch.mutate(kind, { onError: (e) => setMsg(apiError(e).message) }); };
  return (
    <>
      <PageTitle icon={Briefcase}>Attendance</PageTitle>
      <Alert>{msg}</Alert>
      <Panel title={`Today — ${fmt.date(new Date())}`}>
        <KV pairs={[['In Time', rec?.inAt ? fmt.dt(rec.inAt) : 'Not logged in'], ['In Address', rec?.inAddress || ''], ['Out Time', rec?.outAt ? fmt.dt(rec.outAt) : ''], ['Out Address', rec?.outAddress || '']]} />
        <div className="dms-form" style={{ marginTop: 12, gridTemplateColumns: '1fr' }}><Field label="Your location / address (optional)"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field></div>
        <div className="dms-actions">
          <Btn variant="success" disabled={punch.isPending || Boolean(rec)} onClick={() => go('in')}>Login</Btn>
          <Btn variant="danger" disabled={punch.isPending || !rec || Boolean(rec?.outAt)} onClick={() => go('out')}>Logout</Btn>
        </div>
      </Panel>
    </>
  );
}

export function SalaryGenerate() {
  const nav = useNavigate();
  const emps = useOpt('employee');
  const [v, setV] = useState({ employee: '', month: '', year: String(new Date().getFullYear()), bonus: '', otherDeduction: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const save = useDmsMutation((b) => dms.post('/entities/salary-generate', b), { onSuccess: () => nav('/distributor/e/salary') });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageTitle icon={Briefcase}>Salary Generate</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={(e) => { e.preventDefault(); setErrors({}); setMsg(''); save.mutate({ ...v, year: Number(v.year), bonus: Number(v.bonus || 0), otherDeduction: Number(v.otherDeduction || 0) }, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } }); }}>
        <div className="dms-form">
          <Field label="Employee Name" required error={errors.employee}><Select required value={v.employee} placeholder="-- Please Select --" options={emps} onChange={set('employee')} /></Field>
          <Field label="Month" required error={errors.month}><Select required value={v.month} placeholder="-- Please Select --" options={MONTHS} onChange={set('month')} /></Field>
          <Field label="Year" required error={errors.year}><Select required placeholder={false} value={v.year} options={years()} onChange={set('year')} /></Field>
          <Field label="Bonus (optional)"><Input type="number" min="0" step="any" value={v.bonus} onChange={set('bonus')} /></Field>
          <Field label="Other Deduction (optional)"><Input type="number" min="0" step="any" value={v.otherDeduction} onChange={set('otherDeduction')} /></Field>
        </div>
        <p className="dms-muted" style={{ textAlign: 'center' }}>Working days exclude Sundays and active holidays. Days without attendance or approved leave are loss-of-pay.</p>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Salary Generate</button></div>
      </form>
    </>
  );
}

export function MyTeams() {
  const { data: mine } = useDmsQuery('ent-mine-employee', '/entities/employee', { view: 'mine', perPage: 1 });
  const me = mine?.data?.data?.[0];
  const { data, isFetching } = useDmsQuery('team', '/entities/employee', { f_manager: me?._id, perPage: 100 }, { enabled: Boolean(me) });
  if (mine && !me) return <><PageTitle icon={Users}>My Teams</PageTitle><Alert>No employee record is linked to your login ID.</Alert></>;
  return (
    <>
      <PageTitle icon={Users}>My Teams</PageTitle>
      <DataTable loading={isFetching} rows={data?.data || []} columns={[
        { key: '#', label: 'S.No' }, { key: 'docNo', label: 'Employee Id' }, { key: 'name', label: 'Name', render: (r) => r.data.name, text: (r) => r.data.name },
        { key: 'phone', label: 'Phone', render: (r) => r.data.phone }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
      ]} />
    </>
  );
}

export function RpPage() {
  const { type } = useParams();
  if (type === 'attendance') return <EntityList type="attendance" title="Attendance Report" goFirst noAdd />;
  if (type === 'employee') return <EntityList type="employee" title="Employee Details Report" goFirst noAdd filterNames={['name']} filterLabels={{ name: 'Employee Name' }} />;
  if (type === 'leave') return <EntityList type="leave" title="Leave Report" goFirst noAdd statusLabel="Leave Status" />;
  if (type === 'salary') return <EntityList type="salary" title="Salary Report" goFirst noAdd filterNames={[]} createdRange />;
  if (type === 'slip') return <EntityList type="salary" title="Salary Slip" goFirst noAdd filterNames={[]} createdRange />;
  return <Navigate to="/distributor/home" replace />;
}

export function OtherRequests() {
  const types = ['Apply for ID Card', 'Apply for Visiting Card', 'Apply for Loan', 'Travelling Claim', 'Lodging Claim'];
  return (
    <Report title="Other Request Report" icon={FileBarChart} url="/x/other-requests" name="other_requests" pick={(d) => d}
      filters={[{ name: 'from', label: 'From Date', type: 'date' }, { name: 'to', label: 'To Date', type: 'date' }, { name: 'type', label: 'Request Type', required: true, options: types }]}
      columns={[{ key: '#', label: 'S.No' }, { key: 'employee', label: 'Employee' }, { key: 'request', label: 'Request' }, { key: 'date', label: 'Date', render: (r) => fmt.date(r.date), text: (r) => fmt.date(r.date) },
        { key: 'amount', label: 'Amount' }, { key: 'details', label: 'Details' }, { key: 'status', label: 'Status', render: (r) => <Status value={r.status} />, text: (r) => r.status }]} />
  );
}

export function PrintPayslip() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('ent-one-salary', `/entities/salary/${id}`);
  const r = data?.data;
  useEffect(() => { if (r && !new URLSearchParams(window.location.search).has('noprint')) { const t = setTimeout(() => window.print(), 400); return () => clearTimeout(t); } return undefined; }, [r]);
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!r) return <div className="dms-print">Loading…</div>;
  const d = r.data;
  const row = (a, b) => <tr><td>{a}</td><td style={{ textAlign: 'right' }}>{fmt.money(b)}</td></tr>;
  return (
    <div className="dms-print">
      <div className="no-print" style={{ textAlign: 'right' }}><button type="button" className="dms-btn" onClick={() => window.print()}>Print</button></div>
      <h2>PAY SLIP — {d.month} {d.year}</h2>
      <table><tbody>
        <tr><td><b>Employee</b> {d.employee_label}</td><td><b>Working days</b> {d.workingDays} &nbsp; <b>Present</b> {d.presentDays} &nbsp; <b>Paid leave</b> {d.leaveDays} &nbsp; <b>LOP</b> {d.lopDays}</td></tr>
      </tbody></table>
      <table style={{ marginTop: 6 }}><thead><tr><th>Earnings</th><th>Amount</th></tr></thead><tbody>{row('Basic', d.basic)}{row('HRA', d.hra)}{row('Allowances', d.allowances)}{row('Bonus', d.bonus)}</tbody></table>
      <table style={{ marginTop: 6 }}><thead><tr><th>Deductions</th><th>Amount</th></tr></thead><tbody>{row('PF', d.pf)}{row('Loss of pay', d.lopDeduction)}{row('Other', d.otherDeduction)}</tbody></table>
      <table style={{ marginTop: 6 }}><tbody><tr><td><b>Net Pay</b></td><td style={{ textAlign: 'right' }}><b>{fmt.money(d.net)}</b></td></tr></tbody></table>
      <p style={{ textAlign: 'center', fontSize: 10 }}>Computer generated pay slip.</p>
    </div>
  );
}

/* ───────── Sale Force ───────── */
export function BeatScheduler() {
  const [rows, setRows] = useState([]);
  const [check, setCheck] = useState(false);
  const [msg, setMsg] = useState('');
  const [errs, setErrs] = useState([]);
  const up = useDmsMutation((b) => dms.post('/entities/beat-upload', b), { onSuccess: () => setRows([]) });
  const onFile = async (f) => { setMsg(''); setErrs([]); if (!f) return; try { setRows(await readSheet(f)); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <PageTitle icon={Upload}>Upload Beat Scheduler</PageTitle>
      <Alert>{msg}</Alert>
      {errs.length > 0 && <Alert>{errs.map((e) => <div key={e}>{e}</div>)}</Alert>}
      <form onSubmit={(e) => { e.preventDefault(); setMsg(''); setErrs([]); up.mutate({ rows }, { onError: (err) => { const a = apiError(err); setMsg(a.message); setErrs(a.fieldErrors.rows || []); } }); }}>
        <div className="dms-form">
          <Field label="Attach File" required><Input type="file" accept=".xlsx,.csv" required aria-label="Browse…" onChange={(e) => onFile(e.target.files?.[0])} /></Field>
          <div><label className="dms-label">&nbsp;</label><Btn variant="default" onClick={() => downloadTemplate('beat_scheduler_template', ['loginId', 'date', 'task', 'area'], [['DEUSRDLUP6', '2026-12-01', 'Dealer Visit', 'Agra - Market Road']], ['date as YYYY-MM-DD', 'task: Collection, Dealer Visit, Feedback or Sale Order', 'The upload is rejected completely if any row is invalid.'])}>Download template</Btn></div>
        </div>
        {rows.length > 0 && <p style={{ textAlign: 'center' }}>{rows.length} row(s) ready. Tasks: Collection, Dealer Visit, Feedback, Sale Order.</p>}
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={!rows.length || up.isPending}>Upload</button><button type="button" className="dms-btn" onClick={() => setCheck(!check)}>Check Beat Scheduled</button></div>
      </form>
      {check && <EntityList type="beat" title="Beat Scheduled" noAdd />}
    </>
  );
}

/* ───────── dashboards ───────── */
export function DashYearly() {
  const opts = useLocProdOpts();
  const [p, setP] = useState(null);
  const { data, error } = useDmsQuery('dash-y', '/x/dash-yearly', p, { enabled: p !== null });
  const d = data?.data;
  return (
    <>
      <PageTitle icon={Gauge}>Yearly Dashboard</PageTitle>
      <FilterBar opts={opts} onGo={setP} defs={[{ name: 'periodType', label: 'Period Type', options: ['Year'], placeholder: false }, { name: 'year', label: 'Year', required: true, options: years() }, { name: 'by', label: 'Location Tpye', options: ['Customer', 'Location'], placeholder: false }, { name: 'location', label: 'Location', optionsFrom: 'locations' }]} initial={{ by: 'Location', periodType: 'Year' }} />
      {error && <Alert>{apiError(error).message}</Alert>}
      {d && (d.series.length === 0 ? <p className="dms-loading">No sales in this year</p> : (
        <div className="dms-chart"><h4>Month-wise sale (₹)</h4>
          <ResponsiveContainer width="100%" height={340}><BarChart data={d.chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis width={62} tickFormatter={fmt.short} /><Tooltip /><Legend />
            {d.series.map((s, i) => <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} />)}</BarChart></ResponsiveContainer>
        </div>
      ))}
    </>
  );
}

export function DashMonthly() {
  const opts = useLocProdOpts();
  const [p, setP] = useState(null);
  const { data, error } = useDmsQuery('dash-m', '/x/dash-monthly', p, { enabled: p !== null });
  const rows = data?.data || [];
  return (
    <>
      <PageTitle icon={Gauge}>Sale QTY/AMT Dashboard</PageTitle>
      <FilterBar opts={opts} onGo={(f) => setP({ ...f, month: MONTHS.indexOf(f.monthName) + 1 })}
        defs={[{ name: 'periodType', label: 'Period Type', options: ['Month'], placeholder: false }, { name: 'year', label: 'Year', required: true, options: years() }, { name: 'monthName', label: 'Month', required: true, options: MONTHS }, { name: 'location', label: 'Location', optionsFrom: 'locations' }, { name: 'product', label: 'Product', optionsFrom: 'products' }]} />
      {error && <Alert>{apiError(error).message}</Alert>}
      {p && (
        <div className="dms-chart"><h4>Day-wise sale</h4>
          <ResponsiveContainer width="100%" height={340}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis yAxisId="a" width={62} tickFormatter={fmt.short} /><YAxis yAxisId="q" orientation="right" /><Tooltip /><Legend />
            <Bar yAxisId="a" dataKey="amount" name="Amount (₹)" fill="#337ab7" /><Bar yAxisId="q" dataKey="qty" name="Qty" fill="#5cb85c" /></BarChart></ResponsiveContainer>
        </div>
      )}
    </>
  );
}

export function DashLead() {
  const [p, setP] = useState({});
  const { data } = useDmsQuery('dash-l', '/x/dash-lead', p);
  const d = data?.data;
  return (
    <>
      <PageTitle icon={Gauge}>Lead Dashboard</PageTitle>
      <FilterBar opts={(x) => x.options || []} onGo={setP} defs={[{ name: 'from', label: 'From Date', type: 'date' }, { name: 'to', label: 'To Date', type: 'date' }]} />
      <h4 style={{ margin: '10px 0' }}>Lead Conversion</h4>
      <DataTable rows={d?.conversion || []} rowKey="area" groups={[{ label: 'Lead Conversion', span: 7 }]} columns={[{ key: '#', label: 'S.No' }, { key: 'area', label: 'Area' }, { key: 'lead', label: 'Lead', align: 'r' }, { key: 'quote', label: 'Quote', align: 'r' }, { key: 'quotePct', label: 'Quote %', align: 'r' }, { key: 'order', label: 'Sale Order', align: 'r' }, { key: 'orderPct', label: 'Sale Order %', align: 'r' }]} />
      <h4 style={{ margin: '14px 0 10px' }}>Upcoming Task</h4>
      <DataTable rows={d?.upcoming || []} columns={[{ key: '#', label: 'Sno' }, { key: 'lead', label: 'Lead' }, { key: 'party', label: 'Party Name' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Follow-up Date' }]} />
      <h4 style={{ margin: '14px 0 10px' }}>Top 10 Lead Conversion Ratio</h4>
      <DataTable rows={d?.top || []} rowKey="user" columns={[{ key: '#', label: 'Sno' }, { key: 'user', label: 'User Name' }, { key: 'leads', label: 'No. of Lead', align: 'r' }, { key: 'orders', label: 'No. of Sales Order', align: 'r' }, { key: 'value', label: 'Value After Sales Order', align: 'r', render: (r) => fmt.money(r.value) }, { key: 'ratio', label: 'Ratio %', align: 'r' }]} />
    </>
  );
}

/* ───────── reports ───────── */
export function CollectionReport() {
  const opts = useLocProdOpts();
  const [p, setP] = useState(null);
  const [showPrev, setShowPrev] = useState(false);
  const { data, error } = useDmsQuery('coll', '/x/collection', p, { enabled: p !== null });
  const d = data?.data;
  return (
    <>
      <PageTitle icon={FileBarChart}>Collection Sheet</PageTitle>
      <FilterBar opts={opts} onGo={setP} initial={{ date: fmt.date(new Date()) }} defs={[{ name: 'date', label: 'Date', type: 'date', required: true }, { name: 'location', label: 'Location Name', optionsFrom: 'locations' }]} />
      {error && <Alert>{apiError(error).message}</Alert>}
      <div style={{ textAlign: 'right', marginBottom: 6 }}><Btn size="sm" variant="default" onClick={() => { if (!p) setP({ date: fmt.date(new Date()) }); setShowPrev(!showPrev); }}>View Previous Collection</Btn></div>
      {d && (
        <>
          <DataTable rows={d.rows} columns={[{ key: '#', label: 'S.No' }, { key: 'docNo', label: 'Receipt No' }, { key: 'f', label: 'From', render: (r) => r.fromLocation?.name, text: (r) => r.fromLocation?.name }, { key: 't', label: 'To', render: (r) => r.toLocation?.name, text: (r) => r.toLocation?.name }, { key: 'payMode', label: 'Mode' }, { key: 'receivedAmount', label: 'Collected', align: 'r', render: (r) => fmt.money(r.receivedAmount) }]} />
          <p style={{ textAlign: 'right' }}><b>Total collection: {fmt.money(d.total)}</b></p>
          {showPrev && <DataTable rows={d.previous} rowKey="date" columns={[{ key: 'date', label: 'Date' }, { key: 'count', label: 'Receipts', align: 'r' }, { key: 'amount', label: 'Amount', align: 'r', render: (r) => fmt.money(r.amount) }]} />}
        </>
      )}
    </>
  );
}

export const PaymentStatusReport = () => (
  <Report title="Payment" url="/x/payment-status" name="payment_status"
    filters={[{ name: 'location', label: 'Location', required: true, optionsFrom: 'locations' }, { name: 'type', label: 'Payment Type', required: true, options: ['Payable', 'Receivable'] }]}
    columns={[{ key: '#', label: 'S.No' }, { key: 'party', label: 'Party' }, { key: 'code', label: 'Code' }, { key: 'invoiced', label: 'Invoiced', align: 'r', render: (r) => fmt.money(r.invoiced) }, { key: 'paid', label: 'Paid', align: 'r', render: (r) => fmt.money(r.paid) }, { key: 'outstanding', label: 'Outstanding', align: 'r', render: (r) => fmt.money(r.outstanding) }]} />
);
export const PriceDropReport = () => (
  <Report title="Price Drop" url="/x/price-drop" name="price_drop"
    filters={[{ name: 'location', label: 'Location', optionsFrom: 'locations' }, { name: 'product', label: 'Product', required: true, optionsFrom: 'products' }]}
    columns={[{ key: '#', label: 'S.No' }, { key: 'date', label: 'Date', render: (r) => fmt.date(r.date), text: (r) => fmt.date(r.date) }, { key: 'invoiceNo', label: 'Document' }, { key: 'from', label: 'Seller' },
      { key: 'oldPrice', label: 'Old Price', align: 'r' }, { key: 'newPrice', label: 'New Price', align: 'r' }, { key: 'change', label: 'Change', align: 'r' }, { key: 'percent', label: '%', align: 'r' }]} />
);
export const PartyMasterReport = () => (
  <Report title="Party Master Report" url="/x/party-master" name="party_master" requireGo={false} filters={[{ name: 'location', label: 'Party Name', optionsFrom: 'locations' }, { name: 'mapped', label: 'Location Name', optionsFrom: 'allLocations' }]}
    columns={[{ key: '#', label: 'SNo.' }, { key: 'party', label: 'Party Name' }, { key: 'mapped', label: 'Mapped Location Name' }, { key: 'status', label: 'Status' }]} />
);
export const IsdReport = () => (
  <Report title="ISP Report" url="/x/isd" name="isd" headersBeforeGo filters={[{ name: 'from', label: 'From Date', type: 'date' }, { name: 'to', label: 'To Date', type: 'date' }, { name: 'location', label: 'Location', optionsFrom: 'locations' }]}
    columns={[{ key: '#', label: 'S.NO.' }, { key: 'isp', label: 'ISP Name' }, { key: 'serial', label: 'Serial No.' }, { key: 'customer', label: 'Customer Name' }, { key: 'location', label: 'Location' }, { key: 'phone', label: 'Contact No.' },
      { key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'date', label: 'Entry Date', render: (r) => fmt.date(r.date), text: (r) => fmt.date(r.date) }]} />
);
export const SerialActReport = () => (
  <Report title="Serial No. Activation Report" url="/x/serial-activation" name="serial_activation" filters={[{ name: 'from', label: 'From Date', type: 'date' }, { name: 'to', label: 'To Date', type: 'date' }]}
    columns={[{ key: '#', label: 'S.No' }, { key: 'serialNo', label: 'Serial No.' }, { key: 'product', label: 'Product' }, { key: 'status', label: 'Status' }, { key: 'location', label: 'Location' }, { key: 'activatedAt', label: 'Activated On', render: (r) => fmt.dt(r.activatedAt), text: (r) => fmt.dt(r.activatedAt) }]} />
);

export function TrackLocation() {
  const users = useOpt('profile');
  const [f, setF] = useState({});
  const [dist, setDist] = useState(null);
  const me = (v) => String(v || '').toLowerCase();
  const ownerLogin = (label) => me((label.match(/\(([^)]+)\)$/) || [])[1]);
  const userOpts = users.map((u) => ({ value: ownerLogin(u.label), label: u.label }));
  const check = async () => {
    setDist(null);
    try { setDist((await dms.get('/x/track-distance', { user: f.user, from: f.from, to: f.to })).data); } catch (e) { setDist({ error: apiError(e).message }); }
  };
  return (
    <>
      <PageTitle icon={MapPin}>Track Location</PageTitle>
      <div className="dms-filter">
        <div><label className="dms-label">Users</label><Select value={f.user || ''} options={userOpts} onChange={(e) => setF({ ...f, user: e.target.value })} /></div>
        <div><label className="dms-label">From Date</label><Input type="date" value={f.from || ''} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div><label className="dms-label">To Date</label><Input type="date" value={f.to || ''} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <div style={{ minWidth: 0 }}><Btn disabled={!f.user} onClick={check}>Check distance covered by user</Btn></div>
      </div>
      {dist && (dist.error ? <Alert>{dist.error}</Alert> : <Alert ok>{dist.points} point(s), about {dist.km} km covered (straight-line between logged points).</Alert>)}
      <EntityList type="track" title="Logged Points" />
    </>
  );
}

/* ───────── uploads ───────── */
export function SerialActivationUpload() {
  const { data: lk } = useLookups();
  const [v, setV] = useState({ category: '', brand: '', product: '' });
  const [serials, setSerials] = useState([]);
  const [msg, setMsg] = useState('');
  const [res, setRes] = useState(null);
  const up = useDmsMutation((b) => dms.post('/x/serial-activate', b), { onSuccess: (r) => setRes(r.data) });
  const L = lk?.data;
  const products = (L?.products || []).filter((p) => (!v.category || p.category === v.category) && (!v.brand || p.brand === v.brand) && (!v.subCategory || String(p.subCategory) === String(v.subCategory)));
  const onFile = async (f) => { setMsg(''); if (!f) return; try { setSerials(await readList(f)); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <PageTitle icon={Upload}>Serial No. Activation</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={(e) => { e.preventDefault(); setMsg(''); setRes(null); up.mutate({ product: v.product, serials }, { onError: (err) => setMsg(apiError(err).message) }); }}>
        <div className="dms-form">
          <Field label="Product Category"><Select value={v.category} options={(L?.categories || []).map((c) => ({ value: c._id, label: c.name }))} onChange={(e) => setV({ ...v, category: e.target.value, product: '' })} /></Field>
          <Field label="Sub-Category"><Select value={v.subCategory || ''} options={(L?.subcategories || []).filter((x) => !v.category || String(x.parent) === String(v.category)).map((c) => ({ value: c._id, label: c.name }))} onChange={(e) => setV({ ...v, subCategory: e.target.value, product: '' })} /></Field>
          <Field label="Brand"><Select value={v.brand} options={(L?.brands || []).map((c) => ({ value: c._id, label: c.name }))} onChange={(e) => setV({ ...v, brand: e.target.value, product: '' })} /></Field>
          <Field label="Product" required><Select required value={v.product} options={products.map(prodOpt)} onChange={(e) => setV({ ...v, product: e.target.value })} /></Field>
          <Field label="Attach File" required><Input type="file" accept=".xlsx,.csv,.txt" required onChange={(e) => onFile(e.target.files?.[0])} /></Field>
        </div>
        {serials.length > 0 && <p style={{ textAlign: 'center' }}>{serials.length} serial number(s) in file</p>}
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={up.isPending || !serials.length}>Upload</button></div>
      </form>
      {res && <Panel title="Result"><KV pairs={[['Activated', res.activated], ['Already active', res.alreadyActive], ['Not found for this product', res.unknownCount], ['Examples', (res.unknown || []).slice(0, 10).join(', ')]]} /></Panel>}
    </>
  );
}

export function DeliveryUpload() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [errs, setErrs] = useState([]);
  const nav = useNavigate();
  const up = useDmsMutation((b) => dms.post('/x/delivery-bulk', b), { onSuccess: () => nav('/distributor/masters/productdelivery') });
  const onFile = async (f) => { setMsg(''); setErrs([]); if (!f) return; try { setRows(await readSheet(f)); } catch (e) { setMsg(e.message); } };
  return (
    <>
      <PageTitle icon={Upload}>Upload Delivery Matrix</PageTitle>
      <Alert>{msg}</Alert>{errs.length > 0 && <Alert>{errs.map((e) => <div key={e}>{e}</div>)}</Alert>}
      <form onSubmit={(e) => { e.preventDefault(); up.mutate({ rows }, { onError: (err) => { const a = apiError(err); setMsg(a.message); setErrs(a.fieldErrors.rows || []); } }); }}>
        <div className="dms-form">
          <Field label="Attach File" required><Input type="file" accept=".xlsx,.csv" required aria-label="Browse…" onChange={(e) => onFile(e.target.files?.[0])} /></Field>
          <div><label className="dms-label">&nbsp;</label><Btn variant="default" onClick={() => downloadTemplate('delivery_matrix_template', ['fromCity', 'toCity', 'category', 'days'], [['Agra', 'Delhi', 'MOBILE', 2]], ['days: whole number of delivery days'])}>Download template</Btn></div>
        </div>
        {rows.length > 0 && <p style={{ textAlign: 'center' }}>{rows.length} row(s) ready</p>}
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={!rows.length || up.isPending}>Upload</button><BackBtn /></div>
      </form>
    </>
  );
}

export function LocationMapping() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: lk } = useLookups();
  const { data: rec } = useDmsQuery('loc-one', `/locations/${id}`);
  const [sel, setSel] = useState([]);
  useEffect(() => { if (rec?.data) setSel((rec.data.mappedLocations || []).map(String)); }, [rec]);
  const save = useDmsMutation((b) => dms.put(`/locations/${id}/mapping`, b), { onSuccess: () => nav('/distributor/masters/locations') });
  const others = (lk?.data?.allLocations || []).filter((l) => l._id !== id);
  return (
    <>
      <PageTitle icon={MapPin}>Location Mapping — {rec?.data?.name}</PageTitle>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate({ mappedLocations: sel }); }}>
        <div className="dms-form" style={{ gridTemplateColumns: '1fr' }}>
          <Field label="Locations this location may transact with (hold Ctrl to select several)">
            <select multiple style={{ height: 260 }} value={sel} onChange={(e) => setSel([...e.target.selectedOptions].map((o) => o.value))}>
              {others.map((l) => { const o = locOpt(l); return <option key={o.value} value={o.value}>{o.label}</option>; })}
            </select>
          </Field>
        </div>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Save</button><BackBtn to="/distributor/masters/locations" /></div>
      </form>
    </>
  );
}
export { TextArea };

/** Report Master → Beat Report: beats of a user in a period (reference: From Date, To Date, Select User). */
export function BeatReport() {
  return <EntityList type="beat" title="Beat Report" goFirst noAdd filterNames={['assignedTo']} filterLabels={{ assignedTo: 'Select User' }} />;
}
