import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingBasket, Monitor } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError, fmt } from '../api';
import {
  PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, Alert, Panel, KV, Status,
  ViewLink, EditLink, PrintLink, CancelBtn, Modal, locOpt,
} from '../components/ui';
import { LineItems, TotalsBox, emptyLine, previewTotals, toPayloadLines } from '../components/LineItems';

/** Shared form context: lookups + maps + stock of a location. */
export function useFormCtx(stockLocation) {
  const { data } = useLookups();
  const lk = data?.data;
  const productById = useMemo(() => new Map((lk?.products || []).map((p) => [p._id, p])), [lk]);
  const hsnByCode = useMemo(() => new Map((lk?.hsn || []).map((h) => [h.hsnCode, h])), [lk]);
  const locById = useMemo(() => new Map((lk?.allLocations || []).map((l) => [l._id, l])), [lk]);
  const { data: stock } = useDmsQuery('stock', '/reports/inventory', { location: stockLocation }, { enabled: Boolean(stockLocation) });
  const stockMap = useMemo(() => new Map((stock?.data || []).map((s) => [s.productId, s.okQty])), [stock]);
  return { lk, productById, hsnByCode, locById, stockOf: (pid) => stockMap.get(pid) ?? 0 };
}

const poBase = (vendor) => (vendor ? '/distributor/purchase/vendor' : '/distributor/purchase/po');

export function PoList({ vendor }) {
  const list = useListState();
  const { data, isFetching } = useDmsQuery('po', '/po', { ...list.params, poType: vendor ? 'VENDOR' : 'LOCATION' });
  const cancel = useDmsMutation((id) => dms.post(`/po/${id}/cancel`, {}));
  const [conf, setConf] = useState(null);
  const base = poBase(vendor);
  return (
    <>
      <PageTitle icon={ShoppingBasket}>{vendor ? 'Vendor Purchase List' : 'Purchase Order List'}</PageTitle>
      <Toolbar><Btn to={`${base}/new`}>Add New PO</Btn></Toolbar>
      <DataTable
        loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps}
        columns={[
          { key: '#', label: 'S.No' },
          { key: 'to', label: 'PO To', text: (r) => fmt.party(r.to), render: (r) => fmt.party(r.to) },
          { key: 'from', label: 'PO From', text: (r) => fmt.party(r.from), render: (r) => fmt.party(r.from) },
          { key: 'poNo', label: 'PO No.' },
          { key: 'poDate', label: 'PO Date', render: (r) => fmt.date(r.poDate) },
          { key: 'entryBy', label: 'Entry By' },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          { key: 'p', label: 'Print', sortable: false, align: 'c', render: (r) => <PrintLink to={`/distributor/print/po/${r._id}`} /> },
          { key: 'v', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/po/${r._id}`} /> },
          ...(vendor
            ? [{ key: 'rc', label: 'Receive', sortable: false, align: 'c', render: (r) => (r.status === 'Approved' ? <Btn size="sm" to={`/distributor/purchase/vendor/${r._id}/receive`}>Receive</Btn> : null) }]
            : [{ key: 'e', label: 'Edit', sortable: false, align: 'c', render: (r) => (r.status === 'PFA' ? <EditLink to={`${base}/${r._id}/edit`} /> : null) }]),
          { key: 'c', label: 'Cancel', sortable: false, align: 'c', render: (r) => ((vendor ? r.status === 'Approved' : r.status === 'PFA') ? <CancelBtn onClick={() => setConf(r)} /> : null) },
        ]}
      />
      <Modal open={Boolean(conf)} title="Cancel Purchase Order" onClose={() => setConf(null)}
        footer={<><Btn variant="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(conf._id, { onSuccess: () => setConf(null) })}>Yes, Cancel</Btn><Btn variant="default" onClick={() => setConf(null)}>Close</Btn></>}>
        Cancel purchase order <b>{conf?.poNo}</b>? This cannot be undone.
      </Modal>
    </>
  );
}

export function PoForm({ vendor }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const [v, setV] = useState({ fromLocation: '', toLocation: '', toVendor: '', salesExecutive: '', currency: 'INR', deliveryAddress: '', paymentTerms: '', remark: '', vendorTaxType: '', vendorTaxPer: '', vendorInvoiceNo: '', vendorInvoiceDate: '' });
  const { data: taxes } = useDmsQuery('othertax-active', '/masters/othertax', { status: 'Active', perPage: 200 }, { enabled: Boolean(vendor) });
  const [lines, setLines] = useState([emptyLine()]);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const ctx = useFormCtx(vendor ? v.fromLocation : v.toLocation);
  const { lk } = ctx;
  const { data: rec } = useDmsQuery('po-one', `/po/${id}`, undefined, { enabled: isEdit });
  useEffect(() => {
    const po = rec?.data;
    if (!po) return;
    setV({ fromLocation: po.from.location, toLocation: po.to.location || '', toVendor: po.to.vendor || '', salesExecutive: po.salesExecutive || '', currency: po.currency, deliveryAddress: po.deliveryAddress || '', paymentTerms: po.paymentTerms || '', remark: po.remark || '' });
    setLines(po.lines.map((l) => ({ product: l.product, qty: String(l.reqQty), price: String(l.price), discountPerUnit: String(l.discountPerUnit || ''), warrantyDays: l.warrantyDays, deliveryDate: fmt.date(l.deliveryDate) })));
  }, [rec]);
  const { data: credit } = useDmsQuery('credit', `/po/credit/${v.fromLocation}`, undefined, { enabled: Boolean(v.fromLocation) && !vendor });
  const from = ctx.locById.get(v.fromLocation);
  const toOptions = (lk?.allLocations || []).filter((l) => l._id !== v.fromLocation);
  const preview = previewTotals(lines, { ...ctx, interState: false, applyTax: false });
  const save = useDmsMutation(
    (b) => (isEdit ? dms.put(`/po/${id}`, b) : dms.post('/po', b)),
    { onSuccess: () => nav(poBase(vendor)) },
  );
  const submit = (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    save.mutate(
      { ...v, poType: vendor ? 'VENDOR' : 'LOCATION', salesExecutive: v.salesExecutive || undefined, lines: toPayloadLines(lines) },
      { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } },
    );
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageTitle icon={ShoppingBasket}>{vendor ? 'Add New Vendor Purchase Order' : isEdit ? 'Edit Purchase Order' : 'Add New Purchase Order'}</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          <Field label={vendor ? 'Purchase Order From' : 'Purhase Order From'} required>
            <Select required disabled={isEdit} value={v.fromLocation} options={(lk?.locations || []).filter((l) => !vendor || l.locationType === 'Head Office' || true).map(locOpt)}
              onChange={(e) => { const l = ctx.locById.get(e.target.value); setV({ ...v, fromLocation: e.target.value, deliveryAddress: l?.dispatchAddress || l?.billingAddress || '' }); }} />
          </Field>
          {vendor ? (
            <Field label="Purchase Order To" required>
              <Select required value={v.toVendor} options={(lk?.vendors || []).map((x) => ({ value: x._id, label: `${x.name} | ${x.city} | ${x.country} | ${x.code}` }))} onChange={set('toVendor')} />
            </Field>
          ) : (
            <Field label="Purhase Order To" required>
              <Select required value={v.toLocation} options={toOptions.map(locOpt)} onChange={set('toLocation')} />
              {from?.parent && !v.toLocation && <button type="button" className="dms-btn sm default" style={{ marginTop: 4 }} onClick={() => setV({ ...v, toLocation: from.parent })}>Use parent location</button>}
            </Field>
          )}
          {!vendor && (
            <Field label="Sales Executive">
              <Select value={v.salesExecutive} options={(lk?.executives || []).map((x) => ({ value: x._id, label: `${x.displayName} | ${x.loginId}` }))} onChange={set('salesExecutive')} />
            </Field>
          )}
          {vendor
            ? <Field label="Currency Type"><Select placeholder={false} value={v.currency} options={['INR', 'USD']} onChange={set('currency')} /></Field>
            : <Field label="Available Credit Balance"><Input readOnly value={credit?.data ? fmt.money(credit.data.available) : ''} /></Field>}
        </div>
        <LineItems lines={lines} setLines={setLines} products={lk?.products || []} cols={vendor ? ['delivery', 'stock'] : ['discount', 'warranty', 'delivery']} colLabels={vendor ? { price: 'Price ()', stock: 'Available Stock', delivery: 'Delivery Schedule' } : { discount: 'Discount' }} preview={preview} stockOf={ctx.stockOf} errors={errors} />
        <TotalsBox totals={preview.totals} />
        {vendor && (() => {
          // reference vendor PO: Tax Type (Tax Master) → Tax %, Tax Total and Grand Total; vendor's Invoice No. / Date
          const taxable = (preview.totals?.subTotal || 0) - (preview.totals?.discount || 0);
          const taxTotal = Math.round(taxable * (Number(v.vendorTaxPer) || 0)) / 100;
          return (
            <div className="dms-form two" style={{ marginTop: 12 }}>
              <Field label="Tax Type"><Select value={v.vendorTaxType} options={(taxes?.data || []).map((t) => t.name)} onChange={(e) => { const t = (taxes?.data || []).find((x) => x.name === e.target.value); setV({ ...v, vendorTaxType: e.target.value, vendorTaxPer: t ? String(t.attrs?.percent ?? '') : v.vendorTaxPer }); }} /></Field>
              <Field label="Tax %" error={errors.vendorTaxPer}><Input type="number" min="0" max="100" step="any" value={v.vendorTaxPer} onChange={set('vendorTaxPer')} /></Field>
              <Field label="Tax Total"><Input readOnly value={fmt.money(taxTotal)} /></Field>
              <Field label="Grand Total"><Input readOnly value={fmt.money((preview.totals?.grand || 0) + taxTotal)} /></Field>
              <Field label="Invoice No."><Input value={v.vendorInvoiceNo} onChange={set('vendorInvoiceNo')} /></Field>
              <Field label="Invoice Date"><Input type="date" value={v.vendorInvoiceDate} onChange={set('vendorInvoiceDate')} /></Field>
            </div>
          );
        })()}
        <div className="dms-form" style={{ marginTop: 12 }}>
          <Field label="Delivery Address" required><TextArea required value={v.deliveryAddress} onChange={set('deliveryAddress')} /></Field>
          <Field label="Remark"><TextArea value={v.remark} onChange={set('remark')} /></Field>
          <Field label="Payment Terms" full><TextArea value={v.paymentTerms} onChange={set('paymentTerms')} /></Field>
        </div>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
          <BackBtn to={poBase(vendor)} />
        </div>
      </form>
    </>
  );
}

function PoItems({ po, extra }) {
  return (
    <div className="dms-table-wrap"><table className="dms-table">
      <thead><tr><th>#</th><th>Product</th><th>Req. Qty</th>{extra && <><th>Billed</th><th>Pending</th></>}<th>Price</th><th>Value</th><th>Discount/Unit</th><th>Total</th></tr></thead>
      <tbody>{po.lines.map((l, i) => (
        <tr key={l._id}><td>{i + 1}</td><td>{l.productName} | {l.color} | {l.productCode}</td><td className="r">{fmt.money(l.reqQty)}</td>
          {extra && <><td className="r">{l.billedQty}</td><td className="r">{l.pendingQty}</td></>}
          <td className="r">{fmt.money(l.price)}</td><td className="r">{fmt.money(l.value)}</td><td className="r">{fmt.money(l.discountPerUnit)}</td><td className="r">{fmt.money(l.afterDiscount)}</td></tr>
      ))}</tbody>
    </table></div>
  );
}

function PoPartyAndAmount({ po }) {
  return (
    <>
      <Panel title="Party Information">
        <KV pairs={[
          ['Purchase Order To', fmt.party(po.to) + (po.to.state ? `,${po.to.state}` : '')], ['Purchase Order From', fmt.party(po.from) + (po.from.state ? `,${po.from.state}` : '')],
          ['Purchase Order No.', po.poNo], ['Purchase Order Date', fmt.date(po.poDate)],
          ['Entry By', po.entryBy], ['Status', <Status key="s" value={po.status} />],
          ['Discount Type', po.discountType], ['Sales Executive', po.salesExecutiveName || ''],
        ]} />
      </Panel>
      <Panel title="Items Information"><PoItems po={po} extra={po.lines[0]?.pendingQty !== undefined} /></Panel>
      <Panel title="Amount Information">
        <KV pairs={[['Sub Total', fmt.money(po.subTotal)], ['Total Discount', fmt.money(po.totalDiscount)], ['Grand Total', fmt.money(po.grandTotal)], ['Total Qty', po.totalQty], ['Delivery Address', po.deliveryAddress], ['Remark', po.remark], ['Payment Terms', po.paymentTerms], ['Currency', po.currency]]} />
      </Panel>
    </>
  );
}

function ActionLog({ actions }) {
  return (
    <Panel title="Approval Action">
      <table className="dms-kv"><tbody>
        <tr><td className="k">Action Date &amp; Time</td><td className="k">Action Taken By</td><td className="k">Action</td><td className="k">Action Remark</td></tr>
        {(actions || []).map((a, i) => <tr key={i}><td>{fmt.dt(a.at)}</td><td>{a.by}</td><td>{a.action}</td><td>{a.remark}</td></tr>)}
      </tbody></table>
    </Panel>
  );
}
export { ActionLog };

export function PoView() {
  const { id } = useParams();
  const { data, isLoading, error } = useDmsQuery('po-one', `/po/${id}`);
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  if (error) return <Alert>{apiError(error).message}</Alert>;
  const po = data.data;
  return (
    <>
      <PageTitle icon={ShoppingBasket}>Purchase Order Details</PageTitle>
      <PoPartyAndAmount po={po} />
      {po.invoiceList?.length > 0 && (
        <Panel title="Invoices">
          <table className="dms-kv"><tbody>{po.invoiceList.map((i) => <tr key={i._id}><td><a href={`/distributor/doc/${i._id}`}>{i.invoiceNo}</a></td><td>{fmt.date(i.invoiceDate)}</td><td><Status value={i.status} /></td><td>{fmt.money(i.grandTotal)}</td></tr>)}</tbody></table>
        </Panel>
      )}
      <ActionLog actions={po.actions} />
      <div className="dms-actions"><BackBtn /></div>
    </>
  );
}

export function PoApprovalList() {
  const list = useListState();
  const { data, isFetching } = useDmsQuery('po-approval', '/po', { ...list.params, queue: 'approval' });
  return (
    <>
      <PageTitle icon={ShoppingBasket}>Purchase Order Approval</PageTitle>
      <DataTable loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps}
        columns={[
          { key: '#', label: 'S.No' }, { key: 'to', label: 'PO To', render: (r) => fmt.party(r.to) }, { key: 'from', label: 'PO From', render: (r) => fmt.party(r.from) },
          { key: 'poNo', label: 'PO No.' }, { key: 'poDate', label: 'PO Date', render: (r) => fmt.date(r.poDate) }, { key: 'entryBy', label: 'Entry By' },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          { key: 'v', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/po/${r._id}/approve`} /> },
        ]} />
    </>
  );
}

export function PoApprove() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('po-one', `/po/${id}`);
  const [v, setV] = useState({ action: 'Approved', remark: '' });
  const [msg, setMsg] = useState('');
  const act = useDmsMutation((b) => dms.post(`/po/${id}/approve`, b), { onSuccess: () => nav('/distributor/purchase/po-approval') });
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  const po = data.data;
  return (
    <>
      <PageTitle icon={ShoppingBasket}>Purchase Order Approval</PageTitle>
      <PoPartyAndAmount po={po} />
      <Panel title="Approval Action">
        <Alert>{msg}</Alert>
        {po.status === 'PFA' ? (
          <form onSubmit={(e) => { e.preventDefault(); setMsg(''); act.mutate(v, { onError: (err) => setMsg(apiError(err).message) }); }}>
            <div className="dms-form">
              <Field label="Action Taken" required><Select required placeholder={false} value={v.action} options={['Approved', 'Rejected']} onChange={(e) => setV({ ...v, action: e.target.value })} /></Field>
              <Field label="Remark" required><TextArea required value={v.remark} onChange={(e) => setV({ ...v, remark: e.target.value })} /></Field>
            </div>
            <div className="dms-actions"><button type="submit" className="dms-btn" disabled={act.isPending}>Update</button><BackBtn to="/distributor/purchase/po-approval" /></div>
          </form>
        ) : <p>This order is already <b>{po.status}</b>.</p>}
      </Panel>
    </>
  );
}

/* ── Corporate invoicing ── */
export function CorporateQueue() {
  const list = useListState();
  const { data, isFetching } = useDmsQuery('po-inv', '/po', { ...list.params, queue: 'invoicing' });
  return (
    <>
      <PageTitle icon={Monitor}>Corporate</PageTitle>
      <Toolbar><Btn to="/distributor/invoicing/upload-billing">Upload Billing</Btn><Btn to="/distributor/invoicing/invoices">Invoice list</Btn></Toolbar>
      <DataTable loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps}
        columns={[
          { key: '#', label: 'S.No' }, { key: 'to', label: 'PO To', render: (r) => fmt.party(r.to) }, { key: 'from', label: 'PO From', render: (r) => fmt.party(r.from) },
          { key: 'poNo', label: 'PO No.' }, { key: 'poDate', label: 'PO Date', render: (r) => fmt.date(r.poDate) }, { key: 'entryBy', label: 'Entry By' },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          { key: 'v', label: 'PO View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/po/${r._id}`} /> },
          { key: 'i', label: 'Invoicing', sortable: false, align: 'c', render: (r) => <Btn size="sm" to={`/distributor/invoicing/corporate/${r._id}`}>Process</Btn> },
        ]} />
    </>
  );
}

export function InvoiceAgainstPo() {
  const { poId } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('po-one', `/po/${poId}`);
  const po = data?.data;
  const ctx = useFormCtx(po?.to?.location);
  const [rows, setRows] = useState([]);
  const [v, setV] = useState({ docType: 'INVOICE', remark: '', deliveryAddress: '', marginAmount: '' });
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (po) {
      setRows(po.lines.map((l) => ({ lineId: l._id, product: l.product, reqQty: l.reqQty, pendingQty: l.pendingQty, qty: String(l.pendingQty || ''), price: String(l.price), discountPerUnit: String(l.discountPerUnit || 0), serialsText: '', scheme: '' })));
      setV((s) => ({ ...s, deliveryAddress: po.deliveryAddress || '' }));
    }
  }, [po]);
  const fromLoc = ctx.locById.get(po?.to?.location);
  const toLoc = ctx.locById.get(po?.from?.location);
  const preview = previewTotals(rows.filter((r) => Number(r.qty) > 0), { ...ctx, interState: fromLoc && toLoc && fromLoc.stateCode !== toLoc.stateCode, applyTax: true });
  const save = useDmsMutation((b) => dms.post(`/invoices/against-po/${poId}`, b), { onSuccess: (res) => nav(`/distributor/doc/${res.data._id}`) });
  if (isLoading || !po) return <div className="dms-loading">Loading…</div>;
  const set = (i, k, val) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  const submit = (e) => {
    e.preventDefault(); setMsg(''); setErrors({});
    const lines = rows.filter((r) => Number(r.qty) > 0).map((r) => ({
      lineId: r.lineId, qty: Number(r.qty), discountPerUnit: Number(r.discountPerUnit || 0), scheme: r.scheme || undefined,
      serials: r.serialsText ? r.serialsText.split(/[\s,;]+/).map((s) => s.trim().toUpperCase()).filter(Boolean) : undefined,
    }));
    save.mutate({ ...v, marginAmount: Number(v.marginAmount || 0), lines }, { onError: (err) => { const a = apiError(err); setMsg(a.message); setErrors(a.fieldErrors); } });
  };
  return (
    <>
      <PageTitle icon={Monitor}>Corporate Invoicing against PO</PageTitle>
      <Alert>{msg}</Alert>
      <Panel title="Party Information">
        <KV pairs={[['Invoice From', fmt.party(po.to)], ['Invoice To', fmt.party(po.from)], ['PO No.', po.poNo], ['PO Date', fmt.date(po.poDate)], ['PO Status', po.status], ['Discount Type', po.discountType]]} />
      </Panel>
      <form onSubmit={submit}>
        <Panel title="Items Information">
          <div style={{ maxWidth: 260, marginBottom: 10 }}>
            <Field label="Document Type"><Select placeholder={false} value={v.docType} options={[{ value: 'INVOICE', label: 'Invoice' }, { value: 'DELIVERY CHALLAN', label: 'Delivery Challan' }]} onChange={(e) => setV({ ...v, docType: e.target.value })} /></Field>
          </div>
          <div className="dms-table-wrap"><table className="dms-table">
            <thead><tr><th>Product</th><th>Req. Qty</th><th>Pending</th><th>Avl Stock</th><th>Bill Qty</th><th>Price</th><th>Value</th><th>Discount/Unit</th><th>After Discount Value</th><th>SGST(%)</th><th>SGST Amt</th><th>CGST(%)</th><th>CGST Amt</th><th>IGST(%)</th><th>IGST Amt</th><th>Total</th><th>Scheme</th><th>Serial / IMEI</th></tr></thead>
            <tbody>{rows.map((r, i) => {
              const p = ctx.productById.get(r.product);
              const pv = previewTotals([r], { ...ctx, interState: fromLoc && toLoc && fromLoc.stateCode !== toLoc.stateCode, applyTax: true }).rows[0];
              return (
                <tr key={r.lineId}>
                  <td>{p ? `${p.name} | ${p.productCode}` : r.product}{errors[p?.productCode] && <div className="dms-field-err">{errors[p.productCode][0]}</div>}</td>
                  <td className="r">{r.reqQty}</td><td className="r">{r.pendingQty}</td><td className="r">{ctx.stockOf(r.product)}</td>
                  <td><input className="dms-input" type="number" min="0" max={r.pendingQty} style={{ width: 75 }} value={r.qty} onChange={(e) => set(i, 'qty', e.target.value)} /></td>
                  <td className="r">{fmt.money(r.price)}</td><td className="r">{fmt.money(pv.value)}</td>
                  <td><input className="dms-input" type="number" min="0" step="any" style={{ width: 80 }} value={r.discountPerUnit} onChange={(e) => set(i, 'discountPerUnit', e.target.value)} /></td>
                  <td className="r">{fmt.money(pv.after)}</td>
                  <td className="r">{pv.sgstPer}</td><td className="r">{fmt.money(pv.sgst)}</td><td className="r">{pv.cgstPer}</td><td className="r">{fmt.money(pv.cgst)}</td><td className="r">{pv.igstPer}</td><td className="r">{fmt.money(pv.igst)}</td>
                  <td className="r">{fmt.money(pv.total)}</td>
                  <td><select value={r.scheme} onChange={(e) => set(i, 'scheme', e.target.value)}><option value="">None</option>{(ctx.lk?.schemes || []).filter((s) => !s.products?.length || s.products.includes(r.product)).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></td>
                  <td><textarea rows={1} placeholder={p?.isSerialized ? 'Required' : 'Optional'} value={r.serialsText} onChange={(e) => set(i, 'serialsText', e.target.value)} /></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </Panel>
        <Panel title="Amount Information">
          <TotalsBox totals={preview.totals} showTax />
          <div className="dms-form" style={{ marginTop: 12 }}>
            <Field label="Delivery Address"><TextArea value={v.deliveryAddress} onChange={(e) => setV({ ...v, deliveryAddress: e.target.value })} /></Field>
            <Field label="Remark"><TextArea value={v.remark} onChange={(e) => setV({ ...v, remark: e.target.value })} /></Field>
            <Field label="Margin Amount"><Input type="number" step="any" value={v.marginAmount} onChange={(e) => setV({ ...v, marginAmount: e.target.value })} /></Field>
          </div>
        </Panel>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Processing…' : 'Process'}</button><BackBtn to="/distributor/invoicing/corporate" /></div>
      </form>
    </>
  );
}
