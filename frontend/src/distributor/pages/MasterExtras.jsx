/**
 * Extra master pages and controls taken from the reference:
 *  - ContactButtons: Customer Master "Send Mail" / "Send SMS" (opens the user's mail / messaging app)
 *  - MasterFile: file field (PDF, JPG or PNG up to 2 MB) on master forms
 *  - MasterHistory: "History" column of Location / Customer Master
 *  - MasterMapping: "Mapped with locations" (reference mappWithAccount.php) for Account and Coupon Master
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError } from '../api';
import { PageTitle, BackBtn, DataTable, Select, Alert } from '../components/ui';
import { MASTERS } from './masters.config';
import './masters.extra.config';
import './masters.reference';
import { fileHref } from './EntityPages';

export function ContactButtons({ rows }) {
  const emails = [...new Set(rows.map((r) => r.email).filter(Boolean))];
  const phones = [...new Set(rows.map((r) => r.phone).filter(Boolean))];
  return (
    <>
      <a className={`dms-btn default ${emails.length ? '' : 'disabled'}`} href={emails.length ? `mailto:?bcc=${encodeURIComponent(emails.join(','))}` : undefined}
        aria-disabled={!emails.length} title={`${emails.length} e-mail address(es) on this page`}>Send Mail</a>
      <a className={`dms-btn default ${phones.length ? '' : 'disabled'}`} href={phones.length ? `sms:${phones.join(',')}` : undefined}
        aria-disabled={!phones.length} title={`${phones.length} mobile number(s) on this page`}>Send SMS</a>
    </>
  );
}

export function MasterFile({ value, onChange, label }) {
  const [state, setState] = useState('');
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setState('Allowed upto 2 MB'); e.target.value = ''; return; }
    setState('Uploading…');
    try {
      const body = new FormData();
      body.append('file', file);
      const r = await dms.post('/entities/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(r.data.url);
      setState('');
    } catch (err) { setState(apiError(err).message); e.target.value = ''; }
  };
  return (
    <div>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" aria-label={label} onChange={onFile} />
      {state && <div className="dms-img-note">{state}</div>}
      {value && <div><a href={fileHref(value)} target="_blank" rel="noreferrer">Current file</a></div>}
    </div>
  );
}

export function MasterHistory() {
  const { key, id } = useParams();
  const cfg = MASTERS[key];
  const { data, isLoading } = useDmsQuery(`m-${key}-one`, `${cfg?.endpoint}/${id}`, undefined, { enabled: Boolean(cfg) });
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const rec = data?.data;
  const ref = rec?.code || rec?.customerId;
  return (
    <>
      <PageTitle icon={Database}>History</PageTitle>
      {rec && <p className="dms-perm-user">{rec.name}{ref ? ` (${ref})` : ''}</p>}
      <DataTable
        loading={isLoading}
        rows={[...(rec?.history || [])].reverse().map((h, i) => ({ _id: String(i), ...h }))}
        columns={[
          { key: '#', label: 'S.No' },
          { key: 'at', label: 'Date & Time', render: (h) => (h.at ? new Date(h.at).toLocaleString('en-IN') : '') },
          { key: 'by', label: 'Changed By' },
          { key: 'change', label: 'Change' },
        ]}
      />
      <div className="dms-actions"><BackBtn to={`/distributor/masters/${key}`} /></div>
    </>
  );
}

export function MasterMapping() {
  const { key, id } = useParams();
  const cfg = MASTERS[key];
  const nav = useNavigate();
  const { data: lk } = useLookups();
  const { data: rec } = useDmsQuery(`m-${key}-one`, `${cfg?.endpoint}/${id}`, undefined, { enabled: Boolean(cfg) });
  const [sel, setSel] = useState(null);
  const [f, setF] = useState({ state: '', city: '', type: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { if (rec?.data && sel === null) setSel((rec.data.attrs?.mappedLocations || []).map(String)); }, [rec, sel]);
  const save = useDmsMutation((b) => dms.put(`${cfg.endpoint}/${id}`, b), { onSuccess: () => nav(`/distributor/masters/${key}`) });
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const all = lk?.data?.allLocations || [];
  const shown = all.filter((l) => (!f.state || l.state === f.state) && (!f.city || l.city === f.city) && (!f.type || l.locationType === f.type));
  const cur = sel || [];
  const r = rec?.data;
  const head = r ? `${r.name}${r.attrs?.accountNo ? ` - ${r.attrs.accountNo}` : ''}${r.attrs?.accountType ? ` (${r.attrs.accountType})` : ''}` : '';
  const toggle = (lid) => setSel(cur.includes(lid) ? cur.filter((x) => x !== lid) : [...cur, lid]);
  const submit = () => {
    setMsg('');
    save.mutate({ name: r.name, code: r.code, status: r.status, attrs: { ...(r.attrs || {}), mappedLocations: cur } }, { onError: (err) => setMsg(apiError(err).message) });
  };
  return (
    <>
      <PageTitle icon={Database}>Mapped with locations</PageTitle>
      <Alert>{msg}</Alert>
      {r && <p className="dms-perm-user">{cfg.mappingLabel || 'Account Name'}: {head}</p>}
      <form className="dms-filter" onSubmit={(e) => e.preventDefault()}>
        <div><label className="dms-label">Location State</label>
          <Select placeholder="All" value={f.state} options={[...new Set(all.map((l) => l.state))].sort()} onChange={(e) => setF({ ...f, state: e.target.value, city: '' })} /></div>
        <div><label className="dms-label">Location City</label>
          <Select placeholder="All" value={f.city} options={[...new Set(all.filter((l) => !f.state || l.state === f.state).map((l) => l.city))].sort()} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div><label className="dms-label">Location Type</label>
          <Select placeholder="All" value={f.type} options={lk?.data?.locationTypes || []} onChange={(e) => setF({ ...f, type: e.target.value })} /></div>
      </form>
      <div className="dms-perm-pane">
        <div className="dms-perm-tools">
          <button type="button" className="dms-btn" onClick={() => setSel([...new Set([...cur, ...shown.map((l) => l._id)])])}>Check All</button>
          <button type="button" className="dms-btn" onClick={() => setSel(cur.filter((x) => !shown.some((l) => l._id === x)))}>Uncheck All</button>
        </div>
        <div className="dms-perm-group">
          <h4>Locations Name</h4>
          <div className="dms-perm-grid">
            {shown.map((l) => (
              <label key={l._id}><input type="checkbox" checked={cur.includes(l._id)} onChange={() => toggle(l._id)} /> {l.name} | {l.stateCode || l.state} | {l.city}({l.code})</label>
            ))}
          </div>
        </div>
        <div className="dms-actions">
          <button type="button" className="dms-btn" disabled={!r || save.isPending} onClick={submit}>Update</button>
          <BackBtn to={`/distributor/masters/${key}`} />
        </div>
      </div>
    </>
  );
}
