import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError, fmt } from '../api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, EditLink, Alert, locOpt, prodOpt, Status,
} from '../components/ui';
import { MASTERS } from './masters.config';
import './masters.extra.config';
import { Link } from 'react-router-dom';
import { exportCsv } from '../components/ui';

const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) {
  const keys = p.split('.');
  const out = { ...o };
  let cur = out;
  keys.slice(0, -1).forEach((k) => { cur[k] = { ...(cur[k] || {}) }; cur = cur[k]; });
  cur[keys[keys.length - 1]] = v;
  return out;
}

/** Resolve options for a field/filter from static options or the /lookups payload. */
export function useOptions(lk) {
  return (def, values = {}) => {
    if (def.options) return def.options;
    const L = lk || {};
    switch (def.optionsFrom) {
      case 'categories': case 'brands': case 'colors':
        return (L[def.optionsFrom] || []).map((x) => (def.byName ? x.name : { value: x._id, label: x.name }));
      case 'subcategories':
        return (L.subcategories || []).filter((s) => !def.dependsOn || !values[def.dependsOn] || String(s.parent) === String(values[def.dependsOn])).map((x) => ({ value: x._id, label: x.name }));
      case 'hsn': return (L.hsn || []).map((h) => ({ value: h.hsnCode, label: `${h.hsnCode} (IGST ${h.igst}%)` }));
      case 'locations': return (L.locations || []).map(locOpt);
      case 'allLocations': return (L.allLocations || []).map(locOpt);
      case 'products': return (L.products || []).map(prodOpt);
      case 'locationTypes': return L.locationTypes || [];
      default: return [];
    }
  };
}

export function MasterList() {
  const { key } = useParams();
  const cfg = MASTERS[key];
  const { data: lk } = useLookups();
  const opts = useOptions(lk?.data);
  const list = useListState();
  const [filters, setFilters] = useState({});
  const { data, isFetching, error } = useDmsQuery(`m-${key}`, cfg?.endpoint, { ...list.params, ...filters }, { enabled: Boolean(cfg) });
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  const columns = [
    ...cfg.columns.map((c) => {
      if (c.key === 'status') return { ...c, render: (r) => <Status value={r.status} /> };
      if (c.link) return { ...c, sortable: false, align: 'c', render: (r) => <Link to={c.link(r)}>{c.linkText || 'Open'}</Link> };
      return c.text && !c.render ? { ...c, render: c.text } : c;
    }),
    { key: 'edit', label: 'View/Edit', sortable: false, align: 'c', render: (r) => <EditLink to={`/distributor/masters/${key}/${r._id}`} /> },
  ];
  return (
    <>
      <PageTitle icon={Database}>{cfg.title}</PageTitle>
      {error && <Alert>{apiError(error).message}</Alert>}
      {cfg.filters?.length > 0 && (
        <FilterBar defs={cfg.filters} opts={opts} onGo={(f) => { setFilters(f); list.setFilters({}); }} />
      )}
      <Toolbar>
        {cfg.exportable && <Btn variant="default" onClick={() => exportCsv(cfg.title, cfg.columns.filter((c) => c.key !== '#'), data?.data || [])}>Export to Excel</Btn>}
        {(cfg.toolbar || []).map((b) => <Btn key={b.to} variant="default" to={b.to}>{b.label}</Btn>)}
        <Btn to={`/distributor/masters/${key}/new`}>{cfg.addLabel}</Btn>
      </Toolbar>
      <DataTable columns={columns} rows={data?.data} total={data?.pagination?.total ?? 0} loading={isFetching && !data} {...list.tableProps} />
    </>
  );
}

export function FilterBar({ defs, opts, onGo, initial = {} }) {
  const [v, setV] = useState(() => ({ ...Object.fromEntries(defs.filter((d) => d.defaultToday).map((d) => [d.name, fmt.date(new Date())])), ...initial }));
  return (
    <form className="dms-filter" onSubmit={(e) => { e.preventDefault(); onGo(Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x != null))); }}>
      {defs.map((d) => (
        <div key={d.name}>
          <label className="dms-label">{d.label}{d.required && <span className="req"> *</span>}</label>
          {d.type === 'date'
            ? <Input type="date" value={v[d.name] || ''} required={d.required} onChange={(e) => setV({ ...v, [d.name]: e.target.value })} />
            : <Select value={v[d.name] || ''} required={d.required} placeholder={d.placeholder ?? (d.required ? 'Please Select' : 'All')} options={opts(d, v)} onChange={(e) => setV({ ...v, [d.name]: e.target.value })} />}
        </div>
      ))}
      <div style={{ minWidth: 0 }}><button type="submit" className="dms-btn">GO</button></div>
    </form>
  );
}

/** Generic field renderer shared by master and document forms. */
export function FormField({ def, values, setValues, errors, opts, isEdit }) {
  const val = getPath(values, def.name) ?? '';
  const err = errors?.[def.name];
  const set = (x) => setValues((s) => setPath(s, def.name, x));
  const common = { id: `f-${def.name}`, required: def.required, disabled: isEdit && def.lockOnEdit, error: err };
  let input;
  if (def.type === 'select') {
    input = <Select {...common} value={val} placeholder={def.placeholder ?? 'Please Select'} options={opts(def, values)} onChange={(e) => set(e.target.value)} />;
  } else if (def.type === 'multiselect') {
    input = (
      <select multiple id={common.id} required={def.required} style={{ height: 120 }} value={Array.isArray(val) ? val : []}
        onChange={(e) => set([...e.target.selectedOptions].map((o) => o.value))}>
        {opts(def, values).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (def.type === 'textarea') {
    input = <TextArea {...common} value={val} onChange={(e) => set(e.target.value)} />;
  } else {
    input = <Input {...common} type={def.type || 'text'} step={def.type === 'number' ? 'any' : undefined} pattern={def.pattern} value={val} onChange={(e) => set(e.target.value)} />;
  }
  return <Field label={def.label} required={def.required} error={err} full={def.full}>{input}</Field>;
}

export function MasterForm() {
  const { key, id } = useParams();
  const cfg = MASTERS[key];
  const isEdit = id && id !== 'new';
  const nav = useNavigate();
  const { data: lk } = useLookups();
  const opts = useOptions(lk?.data);
  const { data: rec, isLoading } = useDmsQuery(`m-${key}-one`, `${cfg?.endpoint}/${id}`, undefined, { enabled: Boolean(cfg && isEdit) });
  const [values, setValues] = useState({ status: 'Active', ...(cfg?.defaults || {}) });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { if (rec?.data) setValues(cfg.toForm ? cfg.toForm(rec.data) : rec.data); }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useDmsMutation((payload) => (isEdit ? dms.put(`${cfg.endpoint}/${id}`, payload) : dms.post(cfg.endpoint, payload)), {
    onSuccess: () => nav(`/distributor/masters/${key}`),
  });
  const fields = useMemo(() => cfg?.fields || [], [cfg]);
  if (!cfg) return <Navigate to="/distributor/home" replace />;
  if (isEdit && isLoading) return <div className="dms-loading">Loading…</div>;

  const submit = (e) => {
    e.preventDefault();
    setErrors({}); setMsg('');
    const payload = cfg.fromForm ? cfg.fromForm(values) : values;
    const clean = Object.fromEntries(Object.entries(payload).filter(([k]) => !['_id', '__v', 'createdAt', 'updatedAt', 'history', 'createdBy', 'type'].includes(k)));
    save.mutate(clean, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } });
  };
  return (
    <>
      <PageTitle icon={Database}>{isEdit ? `Edit ${cfg.title.replace(' Master', '')}` : cfg.addLabel}</PageTitle>
      <Alert>{msg}</Alert>
      {isEdit && rec?.data?.code && <p style={{ textAlign: 'center' }} className="dms-muted">Code: <b>{rec.data.code}</b></p>}
      <form onSubmit={submit} noValidate={false}>
        <div className="dms-form">
          {fields.map((f) => <FormField key={f.name} def={f} values={values} setValues={setValues} errors={errors} opts={opts} isEdit={isEdit} />)}
        </div>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
          <BackBtn to={`/distributor/masters/${key}`} />
        </div>
      </form>
    </>
  );
}
