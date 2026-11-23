import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, Navigate, useOutletContext } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, apiError, fmt } from '../api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, Alert, Panel, KV, Status, ViewLink, EditLink, Modal,
} from '../components/ui';
import { LineItems, emptyLine, toPayloadLines } from '../components/LineItems';
import { QuoteLines, GridInput, GridView, emptyQuoteLine } from '../components/GridInputs';
import { useLookups } from '../api';
import { env } from '@/config/env';

export const useSchemas = () => useDmsQuery('schemas', '/entities/schemas', undefined, { staleTime: Infinity });
const useRemoteOptions = (kind, enabled = true) => useDmsQuery(`opt-${kind}`, `/entities/options/${kind}`, undefined, { enabled: Boolean(kind) && enabled, staleTime: 30_000 });

const ROUTE_BASE = { all: 'e', mine: 'me', approval: 'approve' };
const BUILTIN = { docNo: 'Doc No.', status: 'Status', createdAt: 'Created Date', createdByName: 'Entry By' };

/** Uploaded files are served by the API host under /uploads. */
export const fileHref = (v) => (String(v).startsWith('/uploads/') ? `${env.apiBaseUrl.replace(/\/api\/?$/, '')}${v}` : v);

function cellValue(cfg, row, col) {
  if (col === 'docNo') return row.docNo;
  if (col === 'status') return <Status value={row.status} />;
  if (col === 'createdAt') return cfg.colFormat?.createdAt === 'dt' ? fmt.dt(row.createdAt) : fmt.date(row.createdAt);
  if (col === 'createdByName') return row.createdByName;
  const fd = cfg.fields.find((f) => f.n === col);
  const v = row.data?.[col];
  if (v === undefined || v === null || v === '') return row.data?.[`${col}_label`] || '';
  if (fd?.t === 'ref' || fd?.t === 'multiref') return row.data[`${col}_label`] || '';
  if (fd?.t === 'url' || fd?.t === 'file') return <a href={fileHref(v)} target="_blank" rel="noreferrer">Download</a>;
  if (fd?.t === 'multiselect' && Array.isArray(v)) return v.join(', ');
  if (fd?.t === 'lines' || fd?.t === 'grid') return `${v.length} item(s)`;
  if (col === 'inAt' || col === 'outAt') return fmt.dt(v);
  return String(v);
}

function FilterField({ fd, value, onChange }) {
  const remote = useRemoteOptions(fd.t === 'ref' ? fd.ref : null);
  if (fd.t === 'select') return <Select value={value || ''} placeholder="All" options={fd.opts} onChange={(e) => onChange(e.target.value)} />;
  if (fd.t === 'ref') return <Select value={value || ''} placeholder="All" options={remote.data?.data || []} onChange={(e) => onChange(e.target.value)} />;
  return <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />;
}

/** mode: all | mine | approval */
export function EntityList({ mode = 'all', type: typeProp, title: titleProp, extraToolbar, goFirst: goFirstProp, filterNames, filterLabels: filterLabelsProp, createdRange, noAdd, statusLabel }) {
  const params = useParams();
  const type = typeProp || params.type;
  const { data: sc } = useSchemas();
  const cfg = sc?.data?.types?.[type];
  const list = useListState();
  const [filters, setFilters] = useState({});
  const [draft, setDraft] = useState({});
  const [went, setWent] = useState(false); // filter-first pages load after GO / Show
  const q = useMemo(() => {
    const o = { ...list.params };
    if (mode === 'mine') o.view = 'mine';
    if (mode === 'approval') o.queue = 'approval';
    for (const [k, v] of Object.entries(filters)) if (v !== '' && v != null) o[k] = v;
    return o;
  }, [list.params, mode, filters]);
  const goFirst = goFirstProp ?? cfg?.goFirst;
  const { data, isFetching, error } = useDmsQuery(`ent-${type}-${mode}`, `/entities/${type}`, q, { enabled: Boolean(cfg) && (!goFirst || went) });
  if (!sc) return <div className="dms-loading">Loading…</div>;
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const base = `/distributor/${ROUTE_BASE[mode]}/${type}`;
  const filterFields = (filterNames || cfg.filters).map((n) => cfg.fields.find((f) => f.n === n)).filter(Boolean);
  const fl = { ...(cfg.filterLabels || {}), ...(filterLabelsProp || {}) };
  const editable = !cfg.noEdit && mode !== 'approval';
  const canAdd = !cfg.noCreate && mode !== 'approval' && !noAdd;
  const view = cfg.modeCols?.[mode] || {}; // per-mode list columns (e.g. approval queues)
  const actionCol = view.actionCol || cfg.actionCol;
  const viewTo = (r) => `/distributor/e/${type}/${r._id}${mode === 'mine' ? '?m=1' : ''}`;
  const canEditRow = (r) => editable && (cfg.editStatuses.includes(r.status) || cfg.fields.some((f) => f.n === 'status'));
  const editTo = (r) => `${base}/${r._id}/edit`;
  const actionCols = {
    none: [],
    view: [{ key: 'v', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={viewTo(r)} /> }],
    edit: editable ? [{ key: 'e', label: 'Edit', sortable: false, align: 'c', render: (r) => (canEditRow(r) ? <EditLink to={editTo(r)} /> : null) }] : [],
    'view-edit': [{ key: 've', label: 'View/Edit', sortable: false, align: 'c', render: (r) => (canEditRow(r) ? <EditLink to={editTo(r)} /> : <ViewLink to={viewTo(r)} />) }],
    action: [{ key: 'ac', label: 'Action', sortable: false, align: 'c', render: (r) => <span className="dms-row-acts"><ViewLink to={viewTo(r)} />{canEditRow(r) && <EditLink to={editTo(r)} />}</span> }],
    history: [{ key: 'h', label: 'History', sortable: false, align: 'c', render: (r) => <Link className="dms-icon-btn" to={viewTo(r)} title="History"><i className="fa fa-history fa-lg" aria-hidden="true" /></Link> }],
    'view+reply': [{ key: 'v', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={viewTo(r)} /> },
      { key: 'rp', label: 'Reply', sortable: false, align: 'c', render: (r) => <Link className="dms-icon-btn" to={viewTo(r)} title="Reply"><i className="fa fa-reply fa-lg" aria-hidden="true" /></Link> }],
  };
  const columns = [
    ...(cfg.snoLabel === null ? [] : [{ key: '#', label: cfg.snoLabel || 'S.No' }]),
    ...(view.cols || cfg.cols).map((c) => ({
      ...(cfg.linkCol === c ? { linkTo: true } : {}),
      key: c, label: view.colLabels?.[c] || cfg.colLabels?.[c] || (c === 'docNo' ? cfg.docLabel || BUILTIN.docNo : BUILTIN[c] || cfg.fields.find((f) => f.n === c)?.label || c),
      text: (r) => { const v = r.data?.[c]; return c === 'docNo' ? r.docNo : c === 'status' ? r.status : c === 'createdAt' ? fmt.date(r.createdAt) : c === 'createdByName' ? r.createdByName : r.data?.[`${c}_label`] || (v ?? ''); },
      render: (r) => (cfg.linkCol === c ? <Link to={viewTo(r)}>{cellValue(cfg, r, c)}</Link> : cellValue(cfg, r, c)),
    })),
    ...(actionCols[actionCol] && actionCol !== 'view+edit' ? actionCols[actionCol] : [...actionCols.view, ...actionCols.edit]),
    ...(type === 'salary' ? [{ key: 'pr', label: 'Pay Slip', sortable: false, align: 'c', render: (r) => <a className="dms-icon-btn" href={`/distributor/print/payslip/${r._id}`} target="_blank" rel="noreferrer">Print</a> }] : []),
  ].filter(Boolean);
  const dateField = cfg.fields.find((f) => f.n === cfg.dateField);
  return (
    <>
      <PageTitle icon={FileText}>{titleProp || cfg.titles?.[mode] || cfg.title}</PageTitle>
      {cfg.formWithList && canAdd && <EntityForm mode={mode} inline typeProp={type} />}
      {cfg.formOnly?.includes(mode) ? null : (<>
      {error && <Alert>{apiError(error).message}</Alert>}
      {(filterFields.length > 0 || cfg.statusFilter || dateField || cfg.byFilter || createdRange || goFirst) && (
        <form className="dms-filter" onSubmit={(e) => { e.preventDefault(); const f = {}; for (const [k, v] of Object.entries(draft)) if (v) f[k] = v; setFilters(f); list.setFilters({}); setWent(true); }}>
          {filterFields.map((fd) => <div key={fd.n}><label className="dms-label">{fl[fd.n] || fd.label}</label><FilterField fd={fd} value={draft[`f_${fd.n}`]} onChange={(v) => setDraft({ ...draft, [`f_${fd.n}`]: v })} /></div>)}
          {cfg.statusFilter && <div><label className="dms-label">{statusLabel || fl.status || 'Status'}</label><Select placeholder="All" value={draft.status || ''} options={cfg.statusFilter} onChange={(e) => setDraft({ ...draft, status: e.target.value })} /></div>}
          {dateField && <><div><label className="dms-label">{cfg.dateLabels?.[0] || 'From Date'}</label><Input type="date" value={draft.from || ''} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></div>
            <div><label className="dms-label">{cfg.dateLabels?.[1] || 'To Date'}</label><Input type="date" value={draft.to || ''} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></div></>}
          {cfg.byFilter && <div><label className="dms-label">{cfg.byFilter}</label><Input value={draft.by || ''} onChange={(e) => setDraft({ ...draft, by: e.target.value })} /></div>}
          {createdRange && <><div><label className="dms-label">From Date</label><Input type="date" value={draft.cfrom || ''} onChange={(e) => setDraft({ ...draft, cfrom: e.target.value })} /></div>
            <div><label className="dms-label">To Date</label><Input type="date" value={draft.cto || ''} onChange={(e) => setDraft({ ...draft, cto: e.target.value })} /></div></>}
          <div style={{ minWidth: 0 }}><button type="submit" className="dms-btn">{cfg.goLabel || 'GO'}</button></div>
        </form>
      )}
      <Toolbar>{extraToolbar}{canAdd && !cfg.formWithList && (cfg.addButtons
        ? cfg.addButtons.map((b) => <Btn key={b.label} to={`${base}/new?${new URLSearchParams(b.q)}`}>{b.label}</Btn>)
        : <Btn to={`${base}/new`}>{cfg.addLabel || 'Add New'}</Btn>)}</Toolbar>
      {(!goFirst || went) && <DataTable columns={columns} rows={data?.data} total={data?.pagination?.total ?? 0} loading={isFetching && !data} {...list.tableProps} />}
      </>)}
    </>
  );
}

/* ───────── form ───────── */
function RefSelect({ fd, value, onChange, error, required, disabled }) {
  const { data } = useRemoteOptions(fd.ref);
  return <Select required={required} disabled={disabled} error={error} value={value || ''} options={data?.data || []} onChange={(e) => onChange(e.target.value)} />;
}
function MultiRef({ fd, value, onChange }) {
  const { data } = useRemoteOptions(fd.ref);
  return (
    <select multiple style={{ height: 110 }} value={Array.isArray(value) ? value : []} onChange={(e) => onChange([...e.target.selectedOptions].map((o) => o.value))}>
      {(data?.data || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Bulk upload (reference "Upload Lead"): Excel / CSV with one column per form field; all rows or none are saved. */
function BulkUpload({ type, cfg, onDone }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [errs, setErrs] = useState([]);
  const cols = cfg.fields.filter((x) => x.form !== false && !['file', 'lines', 'grid', 'ref', 'multiref'].includes(x.t));
  const up = useDmsMutation((b) => dms.post(`/entities/${type}/bulk`, b), { onSuccess: () => onDone() });
  const onFile = async (file) => {
    setMsg(''); setErrs([]); setRows([]);
    if (!file) return;
    try {
      const { readSheet } = await import('../excel');
      const raw = await readSheet(file);
      // header cells may be the field name or its label
      setRows(raw.map((r) => Object.fromEntries(cols.map((c) => [c.n, r[c.n] ?? r[c.label] ?? r[c.l] ?? '']).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)]))));
    } catch (e) { setMsg(e.message); }
  };
  const template = async () => {
    const { downloadTemplate } = await import('../excel');
    downloadTemplate(`${type}_upload_template`, cols.map((c) => c.n), [cols.map((c) => (c.opts ? c.opts[0] : ''))], [...cols.filter((c) => c.opts).map((c) => `${c.n}: ${c.opts.join(', ')}`), 'Every row must be valid; otherwise nothing is saved.']);
  };
  return (
    <div className="dms-toolbar" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
      <button type="button" className="dms-btn" onClick={() => setOpen(!open)}>{`Upload ${cfg.label.replace(' Details', '')}`}</button>
      {open && (
        <div className="dms-panel" style={{ width: '100%', marginTop: 8 }}><div className="hd">{`Upload ${cfg.label.replace(' Details', '')}`}</div><div className="bd">
          {msg && <div className="dms-alert">{msg}</div>}
          {errs.length > 0 && <div className="dms-alert">{errs.map((e) => <div key={e}>{e}</div>)}</div>}
          <div className="dms-filter" style={{ alignItems: 'flex-end' }}>
            <div><label className="dms-label" htmlFor="bulk-file">Attach File (.xlsx / .csv)</label><input id="bulk-file" type="file" accept=".xlsx,.csv" onChange={(e) => onFile(e.target.files?.[0])} /></div>
            <button type="button" className="dms-btn default" onClick={template}>Download template</button>
            <button type="button" className="dms-btn" disabled={!rows.length || up.isPending} onClick={() => { setMsg(''); setErrs([]); up.mutate({ rows }, { onError: (err) => { const a = apiError(err); setMsg(a.message); setErrs(a.fieldErrors.rows || []); } }); }}>Upload</button>
          </div>
          {rows.length > 0 && <p className="dms-muted">{rows.length} row(s) read.</p>}
        </div></div>
      )}
    </div>
  );
}

/** File field: uploads to /entities/upload (PDF, JPG or PNG, up to 2 MB) and keeps the returned path. */
function FileInput({ fd, value, onChange }) {
  const [state, setState] = useState('');
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setState('Upload upto 2 MB'); e.target.value = ''; return; }
    setState('Uploading…');
    try {
      const body = new FormData(); body.append('file', file);
      const r = await dms.post('/entities/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(r.data.url); setState('');
    } catch (err) { setState(apiError(err).message); e.target.value = ''; }
  };
  return (
    <div>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" required={Boolean(fd.req && !value)} onChange={onFile} aria-label={fd.label} />
      {state && <div className="dms-img-note">{state}</div>}
      {value && <div><a href={fileHref(value)} target="_blank" rel="noreferrer">Current file</a></div>}
    </div>
  );
}

function FieldInput({ fd, v, set, err }) {
  const common = { required: fd.req, error: err };
  switch (fd.t) {
    case 'textarea': return <TextArea {...common} value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'select': return <Select {...common} value={v ?? ''} placeholder={fd.def ? false : 'Please Select'} options={fd.opts} onChange={(e) => set(e.target.value)} />;
    case 'ref': return <RefSelect fd={fd} value={v} onChange={set} error={err} required={fd.req} />;
    case 'multiref': return <MultiRef fd={fd} value={v} onChange={set} />;
    case 'number': return <Input {...common} type="number" step="any" min={fd.min} value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'date': return <Input {...common} type="date" value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'email': return <Input {...common} type="email" value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'tel': return <Input {...common} type="tel" pattern="\d{10}" title="10 digits" value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'url': return <Input {...common} type="url" placeholder="https://" value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    case 'file': return <FileInput fd={fd} value={v} onChange={set} />;
    case 'multiselect': return (
      <select multiple style={{ height: 96 }} value={Array.isArray(v) ? v : []} onChange={(e) => set([...e.target.selectedOptions].map((o) => o.value))}>
        {fd.opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    default: return <Input {...common} value={v ?? ''} onChange={(e) => set(e.target.value)} />;
  }
}

export function EntityForm({ mode = 'all', inline = false, typeProp }) {
  const params = useParams();
  const type = typeProp || params.type;
  const id = inline ? undefined : params.id;
  const [sp] = useSearchParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { data: sc } = useSchemas();
  const cfg = sc?.data?.types?.[type];
  const { data: lk } = useLookups();
  const [v, setV] = useState({});
  const [lines, setLines] = useState([emptyLine()]);
  useEffect(() => { if (cfg?.fields.some((x) => x.t === 'lines' && x.tax) && !isEdit) setLines([emptyQuoteLine()]); }, [cfg, isEdit]);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const { data: rec } = useDmsQuery(`ent-one-${type}`, `/entities/${type}/${id}`, undefined, { enabled: isEdit && Boolean(cfg) });
  const { data: leadRec } = useDmsQuery('ent-lead-prefill', `/entities/lead/${sp.get('lead')}`, undefined, { enabled: type === 'quote' && Boolean(sp.get('lead')) });
  useEffect(() => {
    if (cfg && !isEdit) {
      const pre = Object.fromEntries(cfg.fields.filter((f) => sp.get(f.n) && f.form !== false).map((f) => [f.n, sp.get(f.n)]));
      setV((s) => ({ ...Object.fromEntries(cfg.fields.filter((f) => f.def !== undefined).map((f) => [f.n, f.def])), ...pre, ...s }));
    }
  }, [cfg, isEdit]);
  useEffect(() => {
    if (rec?.data) {
      const d = { ...rec.data.data };
      const sf = cfg.fields.find((f) => f.n === 'status');
      if (sf) d.status = rec.data.status;
      setV(d);
      if (Array.isArray(d.lines)) setLines(d.lines.map((l) => ({ product: l.product, qty: String(l.qty), price: String(l.price), discountPerUnit: String(l.discountPerUnit || ''), taxType: l.taxType || '', taxPer: l.taxPer !== undefined ? String(l.taxPer) : '' })));
    }
  }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (leadRec?.data) setV((s) => ({ ...s, lead: leadRec.data._id, partyName: leadRec.data.data.partyName })); }, [leadRec]);
  const back = `/distributor/${ROUTE_BASE[mode]}/${type}`;
  const save = useDmsMutation((b) => (isEdit ? dms.put(`/entities/${type}/${id}`, b) : dms.post(`/entities/${type}`, b)), { onSuccess: () => { if (inline) { setV({}); setMsg('Request submitted'); } else nav(back); } });
  if (!sc) return <div className="dms-loading">Loading…</div>;
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const fields = cfg.fields.filter((f) => f.form !== false && !(mode === 'mine' && type === 'beat' && f.n === 'assignedTo') && !(cfg.computed && ['duration', 'amount'].includes(f.n)) && !(type === 'deviation'));
  const submit = (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    const body = { ...v };
    for (const f of cfg.fields) {
      if (f.t === 'lines' && f.tax) body[f.n] = lines.filter((l) => l.product).map((l) => ({ product: l.product, qty: Number(l.qty), price: Number(l.price), taxType: l.taxType, taxPer: Number(l.taxPer || 0) }));
      else if (f.t === 'lines') body[f.n] = toPayloadLines(lines).map(({ product, qty, price, discountPerUnit }) => ({ product, qty, price, discountPerUnit }));
      else if (f.t === 'grid') body[f.n] = (v[f.n] || []).filter((r) => Object.values(r).some((x) => x !== '' && x != null)).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.endsWith('_label'))));
    }
    for (const k of Object.keys(body)) if (k.endsWith('_label')) delete body[k];
    save.mutate(body, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } });
  };
  return (
    <>
      {!inline && cfg.bulk && !isEdit && <BulkUpload type={type} cfg={cfg} onDone={() => nav(back)} />}
      {!inline && <PageTitle icon={FileText}>{isEdit ? (cfg.editTitle || `Edit ${cfg.label}`) : cfg.addButtons && sp.get('type') ? `${cfg.addTitle} ${sp.get('type')}` : (cfg.addTitle || `Add ${cfg.label}`)}</PageTitle>}
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          {fields.map((fd) => (fd.t === 'grid' ? (
            <div key={fd.n} className="full">
              <label className="dms-label">{fd.label}{fd.req && <span className="req"> *</span>}</label>
              <GridInput fd={fd} value={v[fd.n]} onChange={(x) => setV((s) => ({ ...s, [fd.n]: x }))} products={lk?.data?.products || []} />
              {errors[fd.n] && <div className="dms-field-err">{errors[fd.n][0]}</div>}
            </div>
          ) : fd.t === 'lines' && fd.tax ? (
            <div key={fd.n} className="full">
              <QuoteLines lines={lines} setLines={setLines} products={lk?.data?.products || []} />
              {errors[fd.n] && <div className="dms-field-err">{errors[fd.n][0]}</div>}
            </div>
          ) : fd.t === 'lines' ? (
            <div key={fd.n} className="full">
              <label className="dms-label">{fd.label}{fd.req && <span className="req"> *</span>}</label>
              <LineItems lines={lines} setLines={setLines} products={lk?.data?.products || []} cols={['discount']} preview={{ rows: lines.map((l) => { const q = Number(l.qty) || 0; const p = Number(l.price) || 0; const d = Number(l.discountPerUnit) || 0; return { value: q * p, after: q * (p - d), total: q * (p - d) }; }), totals: null }} />
              {errors[fd.n] && <div className="dms-field-err">{errors[fd.n][0]}</div>}
            </div>
          ) : (
            <Field key={fd.n} label={fd.label} required={fd.req} error={errors[fd.n]} full={fd.full}>
              <FieldInput fd={fd} v={v[fd.n]} set={(x) => setV((s) => ({ ...s, [fd.n]: x }))} err={errors[fd.n]} />
            </Field>
          )))}
        </div>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : (isEdit ? 'Update' : cfg.submitLabel || 'Save')}</button>{!inline && <BackBtn to={back} />}</div>
      </form>
    </>
  );
}

/* ───────── view + actions ───────── */
export function EntityView({ typeProp, idProp }) {
  const p = useParams();
  const type = typeProp || p.type; const id = idProp || p.id;
  const { data: sc } = useSchemas();
  const cfg = sc?.data?.types?.[type];
  const { me } = useOutletContext() || {};
  const { data, isLoading, error } = useDmsQuery(`ent-one-${type}`, `/entities/${type}/${id}`, undefined, { enabled: Boolean(cfg) });
  const [act, setAct] = useState({ action: '', status: '', remark: '' });
  const [msg, setMsg] = useState('');
  const [dev, setDev] = useState(null);
  const doAct = useDmsMutation((b) => dms.post(`/entities/${type}/${id}/action`, b), { onSuccess: () => setAct({ action: '', status: '', remark: '' }) });
  const deviate = useDmsMutation((b) => dms.post(`/entities/beat/${id}/deviate`, b), { onSuccess: () => setDev(null) });
  if (!sc || isLoading) return <div className="dms-loading">Loading…</div>;
  if (error) return <Alert>{apiError(error).message}</Alert>;
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const row = data.data;
  const can = (page) => me?.isAdmin || me?.pages?.includes(page);
  const available = cfg.actions.filter((a) => a.from.includes(row.status) && (can(a.page) || (a.owner && row.ownerLoginId === String(me?.loginId || '').toLowerCase())));
  const sel = available.find((a) => a.key === act.action);
  const pairs = [];
  if (cfg.prefix || row.docNo) pairs.push([cfg.docLabel || 'Doc No.', row.docNo]);
  pairs.push(['Status', <Status key="s" value={row.status} />], ['Entry By', row.createdByName], ['Created', fmt.dt(row.createdAt)]);
  for (const f of cfg.fields) {
    if (f.t === 'lines' || f.t === 'grid') continue;
    const val = row.data[f.n];
    if (val === undefined || val === '' || f.n === 'status') continue;
    pairs.push([f.label, f.t === 'ref' || f.t === 'multiref' ? row.data[`${f.n}_label`] : f.t === 'url' || f.t === 'file' ? <a key={f.n} href={fileHref(val)} target="_blank" rel="noreferrer">Download</a> : Array.isArray(val) ? val.join(', ') : f.n.endsWith('At') ? fmt.dt(val) : String(val)]);
  }
  for (const k of ['duration', 'amount', 'note']) if (row.data[k] !== undefined && row.data[k] !== '' && !cfg.fields.some((f) => f.n === k)) pairs.push([k[0].toUpperCase() + k.slice(1), String(row.data[k])]);
  if (row.achieved !== undefined) pairs.push(['Achieved', `${fmt.money(row.achieved)} (${row.achievedPercent}%)`]);
  if (pairs.length % 2) pairs.push(['', '']);
  const lineField = cfg.fields.find((f) => f.t === 'lines');
  return (
    <>
      <PageTitle icon={FileText}>{cfg.title} — Details</PageTitle>
      <Panel title="Information"><KV pairs={pairs} /></Panel>
      {lineField && row.data[lineField.n] && (
        <Panel title="Items Information">
          <div className="dms-table-wrap"><table className="dms-table">
            <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th>{lineField.tax ? <><th>Value</th><th>Tax Type</th><th>Tax %</th><th>Tax Amt</th></> : <th>Discount/Unit</th>}<th>Total</th></tr></thead>
            <tbody>{row.data[lineField.n].map((l, i) => <tr key={i}><td>{i + 1}</td><td>{l.productName}</td><td className="r">{l.qty}</td><td className="r">{fmt.money(l.price)}</td>{lineField.tax ? <><td className="r">{fmt.money(l.value ?? l.total)}</td><td>{l.taxType}</td><td className="r">{fmt.money(l.taxPer)}</td><td className="r">{fmt.money(l.taxAmt)}</td></> : <td className="r">{fmt.money(l.discountPerUnit)}</td>}<td className="r">{fmt.money(l.total)}</td></tr>)}
              <tr><td colSpan={lineField.tax ? 8 : 5} className="r"><b>Grand Total</b></td><td className="r"><b>{fmt.money(row.data[lineField.n].reduce((n, l) => n + l.total, 0))}</b></td></tr></tbody>
          </table></div>
        </Panel>
      )}
      {cfg.fields.filter((x) => x.t === 'grid' && row.data[x.n]?.length).map((x) => <Panel key={x.n} title={x.label}><GridView fd={x} rows={row.data[x.n]} /></Panel>)}
      {(available.length > 0 || type === 'lead' || (type === 'beat' && row.status === 'Scheduled')) && (
        <Panel title="Action">
          <Alert>{msg}</Alert>
          {available.length > 0 && (
            <form onSubmit={(e) => { e.preventDefault(); setMsg(''); doAct.mutate(act, { onError: (err) => setMsg(apiError(err).message) }); }}>
              <div className="dms-form">
                <Field label="Action" required><Select required value={act.action} options={available.map((a) => ({ value: a.key, label: a.label }))} onChange={(e) => setAct({ action: e.target.value, status: '', remark: act.remark })} /></Field>
                {sel?.statuses && <Field label="New Status" required><Select required value={act.status} options={sel.statuses.filter((s) => s !== row.status)} onChange={(e) => setAct({ ...act, status: e.target.value })} /></Field>}
                {sel && <Field label="Remark" required={sel.remark} full><TextArea required={sel.remark} value={act.remark} onChange={(e) => setAct({ ...act, remark: e.target.value })} /></Field>}
              </div>
              <div className="dms-actions"><button type="submit" className="dms-btn" disabled={!sel || doAct.isPending}>Update</button></div>
            </form>
          )}
          <div className="dms-actions">
            {type === 'lead' && can('quote') && !['Closed', 'Cancelled'].includes(row.status) && <Btn variant="success" to={`/distributor/e/quote/new?lead=${row._id}`}>Share Quote</Btn>}
            {type === 'beat' && row.status === 'Scheduled' && <Btn variant="default" onClick={() => setDev({ changeVisit: '', requestRemark: '' })}>Request Deviation</Btn>}
          </div>
        </Panel>
      )}
      <Panel title="Action Log">
        <table className="dms-kv"><tbody>
          <tr><td className="k">Date &amp; Time</td><td className="k">By</td><td className="k">Action</td><td className="k">Remark</td></tr>
          {(row.actions || []).map((a, i) => <tr key={i}><td>{fmt.dt(a.at)}</td><td>{a.by}</td><td>{a.action}{a.to ? ` (${a.from || ''} → ${a.to})` : ''}</td><td>{a.remark}</td></tr>)}
        </tbody></table>
      </Panel>
      <div className="dms-actions"><BackBtn /></div>
      <Modal open={Boolean(dev)} title="Request Deviation" onClose={() => setDev(null)}
        footer={<><Btn disabled={deviate.isPending} onClick={() => deviate.mutate(dev, { onError: (err) => setMsg(apiError(err).message) })}>Send Request</Btn><Btn variant="default" onClick={() => setDev(null)}>Close</Btn></>}>
        <Field label="Change Visit To" required><Input value={dev?.changeVisit || ''} onChange={(e) => setDev({ ...dev, changeVisit: e.target.value })} /></Field>
        <Field label="Request Remark" required><TextArea value={dev?.requestRemark || ''} onChange={(e) => setDev({ ...dev, requestRemark: e.target.value })} /></Field>
      </Modal>
    </>
  );
}

/* Own employee record (My Profile) */
export function MyProfile() {
  const { data, isLoading } = useDmsQuery('ent-mine-employee', '/entities/employee', { view: 'mine', perPage: 1 });
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  const row = data?.data?.[0];
  if (!row) return <><PageTitle icon={FileText}>My Profile</PageTitle><Alert>No employee record is linked to your login ID. Ask HR to create one in Employee Master with your Login ID.</Alert></>;
  const d = row.data || {};
  // reference "My Profile" fields
  const pairs = [
    ['Employee Name', d.name], ['Email', d.email], ['Company Name', d.location_label || ''], ['Reporting manager', d.manager_label || ''],
    ['Date of Birth', d.dob ? fmt.dmy(d.dob) : ''], ['Anniversary Date', d.marriageDate ? fmt.dmy(d.marriageDate) : ''], ['Contact No.', d.phone], ['Address', d.address],
    ['Date of Joining', d.joiningDate ? fmt.dmy(d.joiningDate) : ''], ['EMP Code', row.docNo], ['Alternate Email', d.email2 || ''], ['Alternate Number', d.phone2 || ''],
    ['Password', <Link key="pw" to="/distributor/change-password">Change Password</Link>], ['', ''],
  ];
  return (
    <>
      <PageTitle icon={FileText}>My Profile</PageTitle>
      <Panel title={d.name}><KV pairs={pairs} /></Panel>
    </>
  );
}

export { Link };
