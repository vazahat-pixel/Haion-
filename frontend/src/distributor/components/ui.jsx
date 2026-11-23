import { useMemo, useState, useEffect, isValidElement, Children } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Printer, Pencil, Trash2, X, Plus, ArrowLeft, Upload, Download, User, Phone, Mail, Lock, MapPin, Calendar, Package, Tag, Hash, IndianRupee, Percent, FileText, Building2, Truck, CreditCard, Activity, Globe, Clock, PencilLine } from 'lucide-react';
import { exportXlsx } from '../excel';

export function PageTitle({ icon: Icon, children }) {
  useEffect(() => {
    const prev = document.title;
    const text = [].concat(children).filter((c) => typeof c === 'string' || typeof c === 'number').join('');
    document.title = `${text || 'Distributor'} | DMS`;
    return () => { document.title = prev; };
  }, [children]);
  return <h1 className="dms-title">{Icon && <Icon />}{children}</h1>;
}

export function Toolbar({ children }) {
  return <div className="dms-toolbar">{children}</div>;
}

export function Btn({ to, variant, size, children, ...rest }) {
  const cls = ['dms-btn', variant, size].filter(Boolean).join(' ');
  // the label decides the icon, so every list and form gets it without touching each page
  const text = typeof children === 'string' ? children : '';
  const Ico = /^(add|new|create)\b/i.test(text) ? Plus : /^upload/i.test(text) ? Upload : /export|download/i.test(text) ? Download : /^back/i.test(text) ? ArrowLeft : null;
  const body = <>{Ico && <Ico className="dms-bi" size={16} strokeWidth={2.2} aria-hidden="true" />}{children}</>;
  if (to) return <Link className={cls} to={to}>{body}</Link>;
  return <button type="button" className={cls} {...rest}>{body}</button>;
}

export function BackBtn({ to }) {
  const nav = useNavigate();
  return <Btn variant="default" onClick={() => (to ? nav(to) : nav(-1))}>Back</Btn>;
}

export function Panel({ title, children, right }) {
  return (
    <div className="dms-panel">
      <div className="hd" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{title}</span>{right}</div>
      <div className="bd">{children}</div>
    </div>
  );
}

/** 4-column label/value table used on every detail page. pairs: [[label, value], …] */
export function KV({ pairs }) {
  const rows = [];
  for (let i = 0; i < pairs.length; i += 2) rows.push([pairs[i], pairs[i + 1]]);
  return (
    <table className="dms-kv"><tbody>
      {rows.map((r, i) => (
        <tr key={i}>
          <td className="k">{r[0]?.[0]}</td><td>{r[0]?.[1] ?? ''}</td>
          <td className="k">{r[1]?.[0] ?? ''}</td><td>{r[1]?.[1] ?? ''}</td>
        </tr>
      ))}
    </tbody></table>
  );
}

export function Status({ value }) {
  const label = { PFA: 'PFA', Approve: 'Approved', Reject: 'Rejected' }[value] || value;
  return <span className={`st-${value}`}>{label}</span>;
}

/** Icon shown inside a field, chosen from its label. */
const FIELD_ICONS = [
  [/password/i, Lock], [/e-?mail/i, Mail], [/phone|mobile|contact n|landline|fax/i, Phone], [/date|^from$|valid|dob|month|year/i, Calendar], [/time|days/i, Clock],
  [/%|percent|tds|\btax\b|gst %/i, Percent], [/amount|price|mrp|salary|balance|credit|rupee|value|discount|total|bonus/i, IndianRupee],
  [/bank|account|ifsc|cheque|payment|card/i, CreditCard], [/country|state|circle|region|zone/i, Globe], [/address|city|location|area|landmark|pincode|order (from|to)|billing (from|to)|transfer (from|to)/i, MapPin],
  [/vendor|organi|company|party|client|branch/i, Building2], [/courier|carrier|docket|dispatch|transport|shipment|vehicle/i, Truck], [/product|item|stock|warranty/i, Package],
  [/brand|categ|type|scheme|color|priority|source|mode/i, Tag], [/status/i, Activity], [/name|user|employee|executive|person|customer|manager|assign|gender/i, User],
  [/code|no\.?$|number|hsn|gst|pan|\bid\b|qty|serial/i, Hash], [/remark|descr|detail|narration|message|note|terms|feedback/i, FileText],
];
function fieldIcon(label, children) {
  const kid = Children.toArray(children).find((c) => isValidElement(c) && [Input, Select, TextArea].includes(c.type));
  if (!kid || typeof label !== 'string' || kid.props.multiple || ['file', 'checkbox'].includes(kid.props.type)) return null;
  return (FIELD_ICONS.find(([rx]) => rx.test(label)) || [null, PencilLine])[1];
}

export function Field({ label, required, error, children, full }) {
  const Ico = fieldIcon(label, children);
  return (
    <div className={[full && 'full', Ico && 'has-ico'].filter(Boolean).join(' ') || undefined}>
      {label && <label className="dms-label">{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {error && <div className="dms-field-err">{Array.isArray(error) ? error[0] : error}</div>}
      {Ico && <Ico className="dms-fi" size={17} strokeWidth={1.8} aria-hidden="true" />}
    </div>
  );
}

export const Input = ({ error, className = '', ...p }) => <input className={`dms-input ${error ? 'err' : ''} ${className}`} {...p} />;
export const TextArea = ({ error, ...p }) => <textarea className={error ? 'err' : ''} {...p} />;
export function Select({ options = [], placeholder = 'Please Select', error, ...p }) {
  return (
    <select className={error ? 'err' : ''} {...p}>
      {placeholder !== false && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'string'
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export const IconBtn = ({ icon: Icon, title, danger, ...p }) => (
  <button type="button" title={title} aria-label={title} className={`dms-icon-btn ${danger ? 'danger' : ''}`} {...p}><Icon /></button>
);
export const ViewLink = ({ to }) => <Link to={to} className="dms-icon-btn" title="View" aria-label="View"><Eye /></Link>;
export const EditLink = ({ to }) => <Link to={to} className="dms-icon-btn" title="Edit" aria-label="Edit"><Pencil /></Link>;
export const PrintLink = ({ to }) => <a href={to} target="_blank" rel="noreferrer" className="dms-icon-btn" title="Print" aria-label="Print"><Printer /></a>;
export const CancelBtn = (p) => <IconBtn icon={Trash2} title="Cancel" danger {...p} />;

export function Alert({ children, ok }) {
  if (!children) return null;
  return <div className={`dms-alert ${ok ? 'ok' : ''}`} role="alert">{children}</div>;
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="dms-modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dms-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="hd"><span>{title}</span><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="bd">{children}</div>
        {footer && <div className="ft">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * DataTables-style table.
 * Server mode: pass `total`, `page`, `perPage`, `onPage`, `onPerPage`, `search`, `onSearch`.
 * Client mode: omit `total` — rows are searched/sorted/paged locally.
 */
export function DataTable({ columns, rows = [], loading, total, page = 1, perPage = 10, onPage, onPerPage, search = '', onSearch, rowKey = '_id', emptyText = 'No data available in table', groups }) {
  const server = total !== undefined;
  const [lp, setLp] = useState(1);
  const [lpp, setLpp] = useState(10);
  const [ls, setLs] = useState('');
  const [sort, setSort] = useState(null);
  const [typed, setTyped] = useState(search);
  useEffect(() => setTyped(search), [search]);
  useEffect(() => {
    if (!server || typed === search) return undefined;
    const t = setTimeout(() => onSearch?.(typed), 350);
    return () => clearTimeout(t);
  }, [typed]); // eslint-disable-line react-hooks/exhaustive-deps

  const pg = server ? page : lp;
  const pp = server ? perPage : lpp;
  const view = useMemo(() => {
    let r = rows;
    if (!server && ls) {
      const s = ls.toLowerCase();
      r = r.filter((row) => columns.some((c) => String(c.text ? c.text(row) : row[c.key] ?? '').toLowerCase().includes(s)));
    }
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      const val = (row) => (c?.text ? c.text(row) : row[sort.key]);
      r = [...r].sort((a, b) => {
        const A = val(a); const B = val(b);
        const n = typeof A === 'number' && typeof B === 'number' ? A - B : String(A ?? '').localeCompare(String(B ?? ''), undefined, { numeric: true });
        return sort.dir === 'asc' ? n : -n;
      });
    }
    return r;
  }, [rows, ls, sort, columns, server]);
  const count = server ? total : view.length;
  const pageRows = server ? view : view.slice((pg - 1) * pp, pg * pp);
  const pages = Math.max(1, Math.ceil(count / pp));
  const start = count ? (pg - 1) * pp + 1 : 0;
  const end = Math.min(count, pg * pp);
  const goto = (p) => (server ? onPage?.(p) : setLp(p));

  const pageButtons = [];
  const lo = Math.max(1, Math.min(pg - 2, pages - 4));
  for (let i = lo; i <= Math.min(pages, lo + 4); i += 1) pageButtons.push(i);

  return (
    <div>
      <div className="dms-dt-top">
        <label>Show
          <select value={pp} onChange={(e) => { const v = Number(e.target.value); if (server) onPerPage?.(v); else { setLpp(v); setLp(1); } }}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>entries
        </label>
        <label>Search:
          <input className="dms-input" value={server ? typed : ls} onChange={(e) => (server ? setTyped(e.target.value) : (setLs(e.target.value), setLp(1)))} />
        </label>
      </div>
      <div className="dms-table-wrap">
        <table className="dms-table">
          <thead>{groups && <tr className="dms-group-row">{groups.map((g, i) => <th key={i} colSpan={g.span} className="c">{g.label}</th>)}</tr>}<tr>
            {columns.map((c) => (
              <th key={c.key} className={c.sortable === false ? '' : 'sortable'} style={c.width ? { width: c.width } : undefined}
                onClick={() => c.sortable !== false && setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                {c.label}{c.sortable !== false && <span className="sort">{sort?.key === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}</span>}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {loading && Array.from({ length: 6 }, (_, i) => <tr key={`sk${i}`} className="dms-sk" aria-hidden="true">{columns.map((c, j) => <td key={c.key}><i style={{ width: `${[60, 85, 70, 95][(i + j) % 4]}%` }} /></td>)}</tr>)}
            {!loading && pageRows.length === 0 && <tr className="empty"><td colSpan={columns.length}>{emptyText}</td></tr>}
            {!loading && pageRows.map((row, i) => (
              <tr key={row[rowKey] ?? i} style={i < 12 ? { '--i': i } : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={c.align || ''}>
                    {c.key === '#' ? start + i : c.render ? c.render(row, i) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dms-dt-bottom">
        <span>Showing {start} to {end} of {count} entries</span>
        <div className="dms-pager">
          <button type="button" disabled={pg <= 1} onClick={() => goto(pg - 1)}>Previous</button>
          {pageButtons.map((n) => <button type="button" key={n} className={n === pg ? 'cur' : ''} onClick={() => goto(n)}>{n}</button>)}
          <button type="button" disabled={pg >= pages} onClick={() => goto(pg + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}

/** Download rows as a formatted Excel (.xlsx) file. columns: [{label, key, text?}] */
export function exportCsv(name, columns, rows) {
  return exportXlsx(name, columns, rows, { title: `${name} — exported ${new Date().toLocaleString('en-IN')}` });
}

/** Server-side list state helper. */
export function useListState(initial = {}) {
  const [state, setState] = useState({ page: 1, perPage: 10, search: '', ...initial });
  return {
    params: state,
    tableProps: {
      page: state.page,
      perPage: state.perPage,
      search: state.search,
      onPage: (page) => setState((s) => ({ ...s, page })),
      onPerPage: (perPage) => setState((s) => ({ ...s, perPage, page: 1 })),
      onSearch: (search) => setState((s) => ({ ...s, search, page: 1 })),
    },
    setFilters: (f) => setState((s) => ({ ...s, ...f, page: 1 })),
  };
}

/** Option builders */
export const locOpt = (l) => ({ value: l._id, label: `${l.name} | ${l.city} | ${l.stateCode || l.state} | ${l.code}` });
export const prodOpt = (p) => ({ value: p._id, label: `${p.name} | ${p.color || 'NONE'} | ${p.productCode}` });
