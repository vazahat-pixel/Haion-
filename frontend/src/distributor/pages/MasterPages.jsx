import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { Database } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError, fmt } from '../api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, EditLink, Alert, locOpt, prodOpt, Status,
} from '../components/ui';
import { MASTERS } from './masters.config';
import './masters.extra.config';
import './masters.reference';
import { Link } from 'react-router-dom';
import { exportCsv } from '../components/ui';
import { ContactButtons, MasterFile } from './MasterExtras';

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
        return (L.subcategories || []).filter((s) => !def.dependsOn || !values[def.dependsOn] || String(s.parent) === String(values[def.dependsOn])).map((x) => (def.byName ? x.name : { value: x._id, label: x.name }));
      case 'productsPicked': // products narrowed by the Product Category / Sub Category / Brand pickers on the form
        return (L.products || []).filter((p) => (!values.categoryPick || String(p.category) === String(values.categoryPick)) && (!values.subCategoryPick || String(p.subCategory) === String(values.subCategoryPick)) && (!values.brandPick || String(p.brand) === String(values.brandPick))).map(prodOpt);
      case 'hsn': return (L.hsn || []).map((h) => ({ value: h.hsnCode, label: `${h.hsnCode} (IGST ${h.igst}%)` }));
      case 'locations': return (L.locations || []).map(locOpt);
      case 'allLocations': return (L.allLocations || []).map(locOpt);
      case 'products': return (L.products || []).map(prodOpt);
      case 'locationTypes': return L.locationTypes || [];
      case 'vendors': return (L.vendors || []).map((x) => ({ value: x._id, label: `${x.name} | ${x.city || ''} | ${x.code || ''}` }));
      case 'schemes': return [...new Set((L.schemes || []).map((x) => x.name))];
      case 'cities': return (L.cities || []).filter((c) => !def.dependsOn || !values[def.dependsOn] || c.state === values[def.dependsOn]).map((c) => c.name);
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
  const built = [
    ...cfg.columns.map((c) => {
      if (c.key === 'status') return { ...c, render: (r) => <Status value={r.status} /> };
      if (c.link) return { ...c, sortable: false, align: 'c', render: (r) => <Link to={c.link(r)}>{c.linkText || 'Open'}</Link> };
      return c.text && !c.render ? { ...c, render: c.text } : c;
    }),
    { key: 'edit', label: cfg.editLabel || 'View/Edit', sortable: false, align: 'c', render: (r) => <EditLink to={`/distributor/masters/${key}/${r._id}`} /> },
    ...(cfg.afterEdit || []).map((c) => (c.link ? { ...c, sortable: false, align: 'c', render: (r) => <Link to={c.link(r)}>{c.linkText || 'Open'}</Link> } : c)),
    ...(cfg.historyCol ? [{ key: 'hist', label: 'History', sortable: false, align: 'c', render: (r) => <Link className="dms-icon-btn" to={`/distributor/masters/${key}/${r._id}/history`} title="History"><i className="fa fa-history fa-lg" aria-hidden="true" /></Link> }] : []),
  ];
  // Vendor Master (reference): Status and Edit lead the row
  const columns = cfg.editFirst ? [...built.filter((c) => ['status', 'edit'].includes(c.key)), ...built.filter((c) => !['status', 'edit'].includes(c.key))] : built;
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
        {cfg.contactButtons && <ContactButtons rows={data?.data || []} />}
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
  const cityList = def.optionsFrom === 'cities' ? opts(def, values) : null;
  if (def.type === 'select' && cityList && !cityList.length) {
    // no City Master entry for this state yet: type the city
    input = <Input {...common} value={val} onChange={(e) => set(e.target.value)} />;
  } else if (def.type === 'select') {
    input = <Select {...common} value={val} placeholder={def.placeholder ?? 'Please Select'} options={opts(def, values)} onChange={(e) => set(e.target.value)} />;
  } else if (def.type === 'multiselect') {
    input = (
      <select multiple id={common.id} required={def.required} style={{ height: 120 }} value={Array.isArray(val) ? val : []}
        onChange={(e) => set([...e.target.selectedOptions].map((o) => o.value))}>
        {opts(def, values).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  } else if (def.type === 'checklist') {
    const all = opts(def, values).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
    const cur = Array.isArray(val) ? val : [];
    input = (
      <div className="dms-checklist">
        <div className="dms-perm-tools"><button type="button" className="dms-btn sm" onClick={() => set(all.map((o) => o.value))}>Check All</button><button type="button" className="dms-btn sm" onClick={() => set([])}>Uncheck All</button></div>
        <div className="dms-perm-grid">{all.map((o) => <label key={o.value}><input type="checkbox" checked={cur.includes(o.value)} onChange={() => set(cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value])} /> {o.label}</label>)}</div>
      </div>
    );
  } else if (def.type === 'file') {
    input = <MasterFile value={val} onChange={set} label={def.label} />;
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
  const [sp] = useSearchParams();
  const [values, setValues] = useState(() => ({ status: 'Active', ...(cfg?.defaults || {}), ...Object.fromEntries((cfg?.queryDefaults ? cfg.queryDefaults(sp) : [])) }));
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { if (rec?.data) setValues(cfg.toForm ? cfg.toForm(rec.data) : rec.data); }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useDmsMutation(async (payload) => {
    if (isEdit) return dms.put(`${cfg.endpoint}/${id}`, payload);
    // e.g. Price Master: one record per ticked state, as the reference creates them
    if (cfg.multiCreate && Array.isArray(payload[cfg.multiCreate.from])) {
      const { [cfg.multiCreate.from]: many, ...rest } = payload;
      if (!many.length) throw Object.assign(new Error('Tick at least one state'), { response: { data: { message: 'Tick at least one state', errors: { [cfg.multiCreate.from]: ['Required'] } } } });
      let last;
      for (const one of many) last = await dms.post(cfg.endpoint, cfg.multiCreate.build(rest, one)); // eslint-disable-line no-await-in-loop
      return last;
    }
    return dms.post(cfg.endpoint, payload);
  }, {
    onSuccess: () => nav(`/distributor/masters/${key}`),
  });
  const fields = useMemo(() => (cfg?.fields || []).filter((x) => !(isEdit ? x.addOnly : x.editOnly)), [cfg, isEdit]);
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
      <PageTitle icon={Database}>{isEdit ? (cfg.editTitle || `Edit ${cfg.title.replace(' Master', '')}`) : (cfg.addTitle || cfg.addLabel)}</PageTitle>
      <Alert>{msg}</Alert>
      {isEdit && rec?.data?.code && <p style={{ textAlign: 'center' }} className="dms-muted">Code: <b>{rec.data.code}</b></p>}
      <form onSubmit={submit} noValidate={false}>
        <div className="dms-form">
          {fields.map((f) => <FormField key={f.name} def={f} values={values} setValues={setValues} errors={errors} opts={opts} isEdit={isEdit} />)}
        </div>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : isEdit ? (cfg.updateLabel || 'Update') : (cfg.submitLabel || 'Save')}</button>
          <BackBtn to={`/distributor/masters/${key}`} />
        </div>
      </form>
    </>
  );
}
