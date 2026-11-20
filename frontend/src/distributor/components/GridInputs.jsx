/**
 * Table inputs used by generic records, laid out like the reference forms:
 *  - QuoteLines: Product | Qty | Price | Value | Tax Type | Tax % | Tax Amt | Total, with Sub Total / Total Qty /
 *    Total Tax / Grand Total (reference "Add New Quote"). Tax types come from the Tax (Other Tax) Master.
 *  - GridInput: rows of simple columns (claim travel / fooding lines, target products), with add / remove row.
 * The server recomputes every amount; these are previews.
 */
import { Plus, Trash2 } from 'lucide-react';
import { useDmsQuery, fmt } from '../api';
import { prodOpt } from './ui';

const n = (v) => Number(v) || 0;
export const emptyQuoteLine = () => ({ product: '', qty: '', price: '', taxType: '', taxPer: '' });

export function QuoteLines({ lines, setLines, products }) {
  const { data: taxes } = useDmsQuery('othertax-active', '/masters/othertax', { status: 'Active', perPage: 200 });
  const taxList = (taxes?.data || []).map((t) => ({ name: t.name, percent: n(t.attrs?.percent) }));
  const set = (i, k, v) => setLines((ls) => ls.map((l, j) => {
    if (j !== i) return l;
    const next = { ...l, [k]: v };
    if (k === 'taxType') next.taxPer = String(taxList.find((t) => t.name === v)?.percent ?? '');
    return next;
  }));
  const rows = lines.map((l) => { const value = n(l.qty) * n(l.price); const taxAmt = (value * n(l.taxPer)) / 100; return { value, taxAmt, total: value + taxAmt }; });
  const tot = rows.reduce((t, r, i) => ({ sub: t.sub + r.value, qty: t.qty + n(lines[i].qty), tax: t.tax + r.taxAmt, grand: t.grand + r.total }), { sub: 0, qty: 0, tax: 0, grand: 0 });
  return (
    <div>
      <div className="dms-table-wrap"><table className="dms-table dms-lines">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Value</th><th>Tax Type</th><th>Tax %</th><th>Tax Amt</th><th>Total</th><th aria-label="Remove" /></tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ minWidth: 220 }}>
                <select aria-label={`Product ${i + 1}`} value={l.product} onChange={(e) => set(i, 'product', e.target.value)}>
                  <option value="">--None--</option>
                  {products.map((p) => { const o = prodOpt(p); return <option key={o.value} value={o.value}>{o.label}</option>; })}
                </select>
              </td>
              <td><input aria-label={`Qty ${i + 1}`} type="number" min="1" value={l.qty} onChange={(e) => set(i, 'qty', e.target.value)} /></td>
              <td><input aria-label={`Price ${i + 1}`} type="number" min="0" step="any" value={l.price} onChange={(e) => set(i, 'price', e.target.value)} /></td>
              <td className="r">{fmt.money(rows[i].value)}</td>
              <td>
                <select aria-label={`Tax Type ${i + 1}`} value={l.taxType} onChange={(e) => set(i, 'taxType', e.target.value)}>
                  <option value="">--Select Tax--</option>
                  {taxList.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </td>
              <td><input aria-label={`Tax % ${i + 1}`} type="number" min="0" max="100" step="any" value={l.taxPer} onChange={(e) => set(i, 'taxPer', e.target.value)} /></td>
              <td className="r">{fmt.money(rows[i].taxAmt)}</td>
              <td className="r">{fmt.money(rows[i].total)}</td>
              <td>{lines.length > 1 && <button type="button" className="dms-icon-btn danger" aria-label={`Remove row ${i + 1}`} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 size={15} /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <button type="button" className="dms-btn sm" onClick={() => setLines((ls) => [...ls, emptyQuoteLine()])}><Plus size={13} /> Add Row</button>
      <table className="dms-kv dms-totals"><tbody>
        <tr><td className="k">Sub Total</td><td className="r">{fmt.money(tot.sub)}</td><td className="k">Total Qty</td><td className="r">{tot.qty}</td></tr>
        <tr><td className="k">Total Tax</td><td className="r">{fmt.money(tot.tax)}</td><td className="k">Grand Total</td><td className="r"><b>{fmt.money(tot.grand)}</b></td></tr>
      </tbody></table>
    </div>
  );
}

export function GridInput({ fd, value, onChange, products }) {
  const rows = Array.isArray(value) && value.length ? value : [{}];
  const set = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const input = (c, r, i) => {
    const common = { 'aria-label': `${c.l} ${i + 1}`, value: r[c.n] ?? '', onChange: (e) => set(i, c.n, e.target.value) };
    if (c.t === 'select') return <select {...common}><option value="">Please Select</option>{c.opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
    if (c.t === 'product') return <select {...common}><option value="">--None--</option>{(products || []).map((p) => { const o = prodOpt(p); return <option key={o.value} value={o.value}>{o.label}</option>; })}</select>;
    return <input {...common} type={c.t === 'number' ? 'number' : c.t === 'date' ? 'date' : 'text'} min={c.t === 'number' ? 0 : undefined} step={c.t === 'number' ? 'any' : undefined} />;
  };
  const sum = fd.sumCol ? rows.reduce((t, r) => t + n(r[fd.sumCol]), 0) : null;
  return (
    <div>
      <div className="dms-table-wrap"><table className="dms-table dms-lines">
        <thead><tr>{fd.cols.map((c) => <th key={c.n}>{c.l}</th>)}<th aria-label="Remove" /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {fd.cols.map((c) => <td key={c.n}>{input(c, r, i)}</td>)}
              <td>{rows.length > 1 && <button type="button" className="dms-icon-btn danger" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 size={15} /></button>}</td>
            </tr>
          ))}
          {sum !== null && <tr><td colSpan={fd.cols.length - 1} className="r"><b>Total</b></td><td className="r"><b>{fmt.money(sum)}</b></td><td /></tr>}
        </tbody>
      </table></div>
      <button type="button" className="dms-btn sm" onClick={() => onChange([...rows, {}])}><Plus size={13} /> Add Row</button>
    </div>
  );
}

/** Read-only table of grid rows for detail pages. */
export function GridView({ fd, rows }) {
  if (!rows?.length) return null;
  return (
    <div className="dms-table-wrap"><table className="dms-table">
      <thead><tr><th>#</th>{fd.cols.map((c) => <th key={c.n}>{c.l}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}><td>{i + 1}</td>{fd.cols.map((c) => <td key={c.n} className={c.t === 'number' ? 'r' : undefined}>{r[`${c.n}_label`] || r[c.n] || ''}</td>)}</tr>)}</tbody>
    </table></div>
  );
}
