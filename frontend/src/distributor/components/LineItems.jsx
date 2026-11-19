import { Plus, Trash2 } from 'lucide-react';
import { prodOpt } from './ui';

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const emptyLine = () => ({ product: '', qty: '', price: '', discountPerUnit: '', serialsText: '' });

/** Client-side preview that mirrors the server's computeDocument (server stays authoritative). */
export function previewTotals(lines, { hsnByCode, productById, interState, applyTax, roundOff }) {
  const t = { subTotal: 0, qty: 0, discount: 0, tax: 0, grand: 0 };
  const rows = lines.map((l) => {
    const p = productById.get(l.product);
    const qty = Number(l.qty) || 0; const price = Number(l.price) || 0; const disc = Number(l.discountPerUnit) || 0;
    const value = r2(qty * price); const after = r2(qty * (price - disc));
    const h = applyTax && p ? hsnByCode.get(p.hsnCode) : null;
    const sgst = h && !interState ? r2((after * h.sgst) / 100) : 0;
    const cgst = h && !interState ? r2((after * h.cgst) / 100) : 0;
    const igst = h && interState ? r2((after * h.igst) / 100) : 0;
    const total = r2(after + sgst + cgst + igst);
    t.subTotal += value; t.qty += qty; t.discount += qty * disc; t.tax += sgst + cgst + igst;
    return { value, after, sgst, cgst, igst, total, sgstPer: h && !interState ? h.sgst : 0, cgstPer: h && !interState ? h.cgst : 0, igstPer: h && interState ? h.igst : 0 };
  });
  const raw = r2(t.subTotal - t.discount + t.tax);
  const ro = roundOff ? r2(Math.round(raw) - raw) : 0;
  return { rows, totals: { subTotal: r2(t.subTotal), qty: t.qty, discount: r2(t.discount), tax: r2(t.tax), roundOff: ro, grand: r2(raw + ro) } };
}

export const splitSerials = (txt) => String(txt || '').split(/[\s,;]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);

/**
 * Editable line grid.
 * cols: subset of ['discount','tax','serials','okdm','warranty','delivery','scheme','stock']
 */
export function LineItems({ lines, setLines, products = [], cols = [], preview, schemes = [], stockOf, errors = {} }) {
  const has = (c) => cols.includes(c);
  const set = (i, k, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const pmap = new Map(products.map((p) => [p._id, p]));
  return (
    <div className="dms-table-wrap" style={{ margin: '14px 0' }}>
      <table className="dms-table">
        <thead><tr>
          <th style={{ minWidth: 220 }}>Product</th>
          {has('okdm') ? <><th>Ok Qty</th><th>Damage Qty</th><th>Missing Qty</th></> : <th>Qty</th>}
          <th>Price</th><th>Value</th>
          {has('discount') && <><th>Discount/Unit</th><th>After Discount Value</th></>}
          {has('tax') && <><th>SGST(%)</th><th>SGST Amt</th><th>CGST(%)</th><th>CGST Amt</th><th>IGST(%)</th><th>IGST Amt</th></>}
          <th>Total</th>
          {has('stock') && <th>Avl Stock</th>}
          {has('scheme') && <th>Scheme</th>}
          {has('warranty') && <th>Warranty Days</th>}
          {has('delivery') && <th>Delivery Date</th>}
          {has('serials') && <th style={{ minWidth: 200 }}>Serial / IMEI No.</th>}
          <th />
        </tr></thead>
        <tbody>
          {lines.map((l, i) => {
            const pv = preview?.rows[i] || {};
            const p = pmap.get(l.product);
            const okdmQty = (Number(l.okQty) || 0) + (Number(l.damageQty) || 0) + (Number(l.missingQty) || 0);
            return (
              <tr key={i}>
                <td>
                  <select aria-label={`Product row ${i + 1}`} required value={l.product} onChange={(e) => set(i, 'product', e.target.value)}>
                    <option value="">--None--</option>
                    {products.map((x) => { const o = prodOpt(x); return <option key={o.value} value={o.value}>{o.label}</option>; })}
                  </select>
                  {errors[l.product] && <div className="dms-field-err">{errors[l.product][0]}</div>}
                </td>
                {has('okdm') ? (
                  <>
                    {['okQty', 'damageQty', 'missingQty'].map((k) => (
                      <td key={k}><input className="dms-input" type="number" min="0" style={{ width: 80 }} value={l[k] ?? ''}
                        onChange={(e) => setLines((ls) => ls.map((x, j) => {
                          if (j !== i) return x;
                          const nx = { ...x, [k]: e.target.value };
                          nx.qty = String((Number(nx.okQty) || 0) + (Number(nx.damageQty) || 0) + (Number(nx.missingQty) || 0));
                          return nx;
                        }))} /></td>
                    ))}
                  </>
                ) : (
                  <td><input className="dms-input" aria-label={`Qty row ${i + 1}`} type="number" min="1" required style={{ width: 80 }} value={l.qty} onChange={(e) => set(i, 'qty', e.target.value)} /></td>
                )}
                <td><input className="dms-input" aria-label={`Price row ${i + 1}`} type="number" min="0" step="any" required style={{ width: 100 }} value={l.price} onChange={(e) => set(i, 'price', e.target.value)} /></td>
                <td className="r">{(pv.value ?? 0).toFixed(2)}</td>
                {has('discount') && <>
                  <td><input className="dms-input" type="number" min="0" step="any" style={{ width: 90 }} value={l.discountPerUnit} onChange={(e) => set(i, 'discountPerUnit', e.target.value)} /></td>
                  <td className="r">{(pv.after ?? 0).toFixed(2)}</td>
                </>}
                {has('tax') && <>
                  <td className="r">{pv.sgstPer ?? 0}</td><td className="r">{(pv.sgst ?? 0).toFixed(2)}</td>
                  <td className="r">{pv.cgstPer ?? 0}</td><td className="r">{(pv.cgst ?? 0).toFixed(2)}</td>
                  <td className="r">{pv.igstPer ?? 0}</td><td className="r">{(pv.igst ?? 0).toFixed(2)}</td>
                </>}
                <td className="r">{(pv.total ?? 0).toFixed(2)}{has('okdm') && okdmQty === 0 ? '' : ''}</td>
                {has('stock') && <td className="r">{l.product ? (stockOf?.(l.product) ?? '…') : ''}</td>}
                {has('scheme') && (
                  <td>
                    <select value={l.scheme || ''} onChange={(e) => set(i, 'scheme', e.target.value)} style={{ minWidth: 120 }}>
                      <option value="">None</option>
                      {schemes.filter((s) => !l.product || !s.products?.length || s.products.includes(l.product)).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </td>
                )}
                {has('warranty') && <td><input className="dms-input" type="number" min="0" style={{ width: 80 }} value={l.warrantyDays ?? (p?.warrantyDays || '')} onChange={(e) => set(i, 'warrantyDays', e.target.value)} /></td>}
                {has('delivery') && <td><input className="dms-input" type="date" value={l.deliveryDate || ''} onChange={(e) => set(i, 'deliveryDate', e.target.value)} /></td>}
                {has('serials') && (
                  <td>
                    <textarea rows={1} aria-label={`Serials row ${i + 1}`} placeholder={p?.isSerialized ? 'Required: one per line' : 'Optional'} value={l.serialsText || ''} onChange={(e) => set(i, 'serialsText', e.target.value)} />
                    <span className="dms-muted">{splitSerials(l.serialsText).length} entered{p?.isSerialized ? ' (serialized)' : ''}</span>
                  </td>
                )}
                <td className="c">
                  {lines.length > 1 && <button type="button" className="dms-icon-btn danger" aria-label="Remove row" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Trash2 /></button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="dms-btn sm" style={{ marginTop: 6 }} onClick={() => setLines((ls) => [...ls, emptyLine()])}><Plus size={13} /> Add Row</button>
    </div>
  );
}

export function TotalsBox({ totals, showTax, roundOff }) {
  if (!totals) return null;
  const rows = [['Total Qty', totals.qty], ['Sub Total', totals.subTotal.toFixed(2)], ['Total Discount', totals.discount.toFixed(2)]];
  if (showTax) rows.push(['Tax Amount', totals.tax.toFixed(2)]);
  if (roundOff) rows.push(['Round Off', totals.roundOff.toFixed(2)]);
  rows.push(['Grand Total', totals.grand.toFixed(2)]);
  return (
    <table className="dms-kv" style={{ maxWidth: 360, marginLeft: 'auto' }}><tbody>
      {rows.map(([k, v]) => <tr key={k}><td className="k">{k}</td><td className="r" style={{ textAlign: 'right' }}>{v}</td></tr>)}
    </tbody></table>
  );
}

export function toPayloadLines(lines, extra = {}) {
  return lines.filter((l) => l.product).map((l) => ({
    product: l.product,
    qty: Number(l.qty),
    price: Number(l.price),
    discountPerUnit: Number(l.discountPerUnit || 0),
    ...(l.okQty !== undefined ? { okQty: Number(l.okQty || 0), damageQty: Number(l.damageQty || 0), missingQty: Number(l.missingQty || 0) } : {}),
    ...(l.serialsText ? { serials: splitSerials(l.serialsText) } : {}),
    ...(l.scheme ? { scheme: l.scheme } : {}),
    ...(l.warrantyDays ? { warrantyDays: Number(l.warrantyDays) } : {}),
    ...(l.deliveryDate ? { deliveryDate: l.deliveryDate } : {}),
    ...extra,
  }));
}
