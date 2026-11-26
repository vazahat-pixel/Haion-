import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Wrench, CheckCircle2, PackageX, Truck, KeyRound, Trophy } from 'lucide-react';
import { B, useMe, useCrmQuery, PageTitle, Panel, Field, Input, Alert, crm, useCrmMutation, Filters, o, DataTable, cols } from '../kit';

function Tile({ c, icon: Icon, label, value, to }) {
  const body = (<><div className="v">{value ?? 0}</div><Icon /><div className="lbl">{label}</div></>);
  return to ? <Link to={to} className="dms-tile" style={{ '--c': c, textDecoration: 'none' }}>{body}</Link> : <div className="dms-tile" style={{ '--c': c }}>{body}</div>;
}

export default function HomePage() {
  const me = useMe();
  const q = useCrmQuery(['dash'], '/reports/dashboard');
  const [f, setF] = useState({});
  const top = useCrmQuery(['top', f], '/reports/asp-tat', f, { enabled: me?.crmRole === 'Admin' });
  const d = q.data?.data || {};
  const jobs = me?.crmRole === 'ASP' ? `${B}/jobs/asp` : me?.crmRole === 'Call Center' ? `${B}/jobs/call-status` : `${B}/jobs/search`;
  return (
    <div>
      <PageTitle icon={Trophy}>{me?.crmRole === 'Admin' ? 'Top Ranked' : `Welcome ${me?.displayName || ''}`}</PageTitle>
      <div className="dms-tiles">
        <Tile c="#1d4ed8" icon={ClipboardList} label="Total Calls" value={d.totalJobs} to={jobs} />
        <Tile c="#e8960c" icon={Wrench} label="Open Calls" value={d.openJobs} to={jobs} />
        <Tile c="#22a84a" icon={CheckCircle2} label="Closed Calls" value={d.closedJobs} to={jobs} />
        <Tile c="#cf3341" icon={PackageX} label="PNA Calls" value={d.pnaJobs} />
        {d.poSummary && <Tile c="#0e9bb5" icon={Truck} label="PO Raised / In Process" value={`${d.poSummary.Raised} / ${d.poSummary.Process}`} />}
      </div>
      {me?.crmRole === 'Admin' && (
        <Panel title="Top Ranked ASP (TAT %)">
          <Filters filters={[{ t: 'daterange', label: 'Date Range' }, { n: 'brand', label: 'Brand', o: (lk) => o.named(lk.brands) }]} onGo={setF} />
          <DataTable rows={[...(top.data?.data || [])].sort((a, b) => parseFloat(b.tat) - parseFloat(a.tat))} loading={top.isLoading}
            columns={cols([{ key: 'location', label: 'ASP Name' }, { key: 'code', label: 'ASP Code' }, { key: 'state', label: 'State' }, { key: 'total', label: 'Calls' }, { key: 'completed', label: 'Completed' }, { key: 'tat', label: 'Tat %' }])} />
        </Panel>
      )}
      {d.byStatus && (
        <Panel title="Calls by Status">
          <table className="dms-table"><thead><tr>{Object.keys(d.byStatus).map((k) => <th key={k}>{k}</th>)}</tr></thead><tbody><tr>{Object.values(d.byStatus).map((n, i) => <td key={i}>{n}</td>)}</tr></tbody></table>
        </Panel>
      )}
    </div>
  );
}

export function ChangePasswordPage() {
  const [v, setV] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const save = useCrmMutation((b) => crm.post('/change-password', b), { onSuccess: () => { setOk('Password changed successfully'); setV({ oldPassword: '', newPassword: '', confirm: '' }); } });
  const submit = (e) => {
    e.preventDefault(); setMsg(''); setOk('');
    if (!v.oldPassword || !v.newPassword) { setMsg('All fields are required'); return; }
    if (v.newPassword.length < 6) { setMsg('New password must be at least 6 characters'); return; }
    if (v.newPassword !== v.confirm) { setMsg('New password and confirm password do not match'); return; }
    save.mutate({ oldPassword: v.oldPassword, newPassword: v.newPassword }, { onError: (err) => setMsg(err?.response?.data?.message || 'Could not change password') });
  };
  return (
    <form onSubmit={submit} noValidate>
      <PageTitle icon={KeyRound}>Change Password</PageTitle>
      <Alert>{msg}</Alert><Alert ok>{ok}</Alert>
      <div className="dms-form">
        <Field label="Old Password" required><Input type="password" autoComplete="current-password" value={v.oldPassword} onChange={(e) => setV((s) => ({ ...s, oldPassword: e.target.value }))} /></Field>
        <Field label="New Password" required><Input type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV((s) => ({ ...s, newPassword: e.target.value }))} /></Field>
        <Field label="Confirm Password" required><Input type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => setV((s) => ({ ...s, confirm: e.target.value }))} /></Field>
      </div>
      <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Update</button></div>
    </form>
  );
}
