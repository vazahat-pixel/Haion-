import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDmsQuery, useLookups, fmt, apiError } from '../api';
import '../dms.css';

/* Indian-system amount in words, e.g. 230100 → "Two Lakh Thirty Thousand One Hundred Only" */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function two(n) { return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`; }
function three(n) { const h = Math.floor(n / 100); const r = n % 100; return [h ? `${ONES[h]} Hundred` : '', r ? two(r) : ''].filter(Boolean).join(' '); }
export function inWords(amount) {
  let n = Math.floor(Math.abs(Number(amount) || 0));
  const paise = Math.round(((Number(amount) || 0) - Math.floor(Number(amount) || 0)) * 100);
  if (n === 0 && !paise) return 'Zero Only';
  const parts = [];
  const cr = Math.floor(n / 10000000); n %= 10000000;
  const lk = Math.floor(n / 100000); n %= 100000;
  const th = Math.floor(n / 1000); n %= 1000;
  if (cr) parts.push(`${three(cr)} Crore`);
  if (lk) parts.push(`${two(lk)} Lakh`);
  if (th) parts.push(`${two(th)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(' ')}${paise ? ` and ${two(paise)} Paise` : ''} Only`;
}

function usePrintWhenReady(ready) {
  useEffect(() => { if (ready && !new URLSearchParams(window.location.search).has('noprint')) { const t = setTimeout(() => window.print(), 400); return () => clearTimeout(t); } return undefined; }, [ready]);
}
const Bar = () => (
  <div className="no-print" style={{ textAlign: 'right', marginBottom: 8 }}>
    <button type="button" className="dms-btn" onClick={() => window.print()}>Print</button>{' '}
    <button type="button" className="dms-btn default" onClick={() => window.close()}>Close</button>
  </div>
);

export function PrintDoc() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('doc-one', `/invoices/${id}`);
  const { data: lk } = useLookups();
  const doc = data?.data;
  usePrintWhenReady(Boolean(doc && lk));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!doc || !lk) return <div className="dms-print">Loading…</div>;
  const locs = new Map((lk.data.allLocations || []).map((l) => [l._id, l]));
  const fromLoc = locs.get(doc.from.location);
  const inter = doc.lines.some((l) => l.igstAmt);
  const title = doc.docType === 'DELIVERY CHALLAN' ? 'DELIVERY CHALLAN' : ['STN', 'JOBWORK'].includes(doc.kind) ? 'STOCK TRANSFER NOTE' : ['PRN', 'VENDOR_RETURN', 'CUSTOMER_RETURN'].includes(doc.kind) ? 'RETURN NOTE' : doc.kind === 'OPENING' ? 'OPENING STOCK CHALLAN' : 'TAX INVOICE';
  const serials = doc.lines.flatMap((l) => l.serials || []);
  return (
    <div className="dms-print">
      <Bar />
      <h2>{title}</h2>
      <table><tbody>
        <tr>
          <td style={{ width: '50%' }}><b>Seller</b><br />{doc.from.name}<br />{doc.from.address || fromLoc?.billingAddress}<br />State: {doc.from.state} &nbsp; GST No.: {doc.from.gstNo || 'NA'}</td>
          <td><b>Invoice No.</b> {doc.invoiceNo}<br /><b>Invoice Date</b> {fmt.date(doc.invoiceDate)}<br />{doc.poNo && <><b>PO No.</b> {doc.poNo}<br /></>}{doc.refNo && <><b>Ref. No.</b> {doc.refNo}<br /></>}
            {doc.logistic?.docketNo && <>Transporter: {doc.logistic.courierName} &nbsp; Docket No: {doc.logistic.docketNo} &nbsp; Docket Date: {fmt.date(doc.logistic.dispatchDate)} &nbsp; E-Way No.: {doc.logistic.ewayBillNo || ''}</>}
          </td>
        </tr>
        <tr>
          <td><b>Details of Receiver (Bill To)</b><br />{doc.to.name}<br />{doc.to.address}<br />State: {doc.to.state} &nbsp; GST No.: {doc.to.gstNo || ''}</td>
          <td><b>Details of Consignee (Ship To)</b><br />{doc.to.name}<br />{doc.deliveryAddress}<br />{doc.logistic?.transportMode && <>Transportation Mode: {doc.logistic.transportMode} &nbsp; Vehicle/Carrier: {doc.logistic.carrierNo}</>}</td>
        </tr>
      </tbody></table>
      <table style={{ marginTop: 6 }}>
        <thead><tr><th>S.No.</th><th>Item Code</th><th>Description Of Goods</th><th>HSN/SAC</th><th>Qty</th><th>UOM</th><th>Rate/Unit</th><th>Discount/Unit</th><th>Taxable Value</th>
          {inter ? <><th>IGST %</th><th>IGST Amt</th></> : <><th>CGST %</th><th>CGST Amt</th><th>SGST %</th><th>SGST Amt</th></>}<th>Total</th><th>Scheme</th></tr></thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={l._id}><td>{i + 1}</td><td>{l.productCode}</td><td>{l.productName} | {l.color}</td><td>{l.hsnCode}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.qty)}</td><td>EA</td>
              <td style={{ textAlign: 'right' }}>{fmt.money(l.price)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.discountPerUnit)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.afterDiscount)}</td>
              {inter ? <><td>{l.igstPer}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.igstAmt)}</td></> : <><td>{l.cgstPer}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.cgstAmt)}</td><td>{l.sgstPer}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.sgstAmt)}</td></>}
              <td style={{ textAlign: 'right' }}>{fmt.money(l.total)}</td><td>{l.schemeName ? `${l.schemeName} ${l.schemeCode}` : ''}</td></tr>
          ))}
          <tr><td colSpan={4}><b>Total</b></td><td style={{ textAlign: 'right' }}><b>{fmt.money(doc.totalQty)}</b></td><td colSpan={3} /><td style={{ textAlign: 'right' }}>{fmt.money(doc.subTotal - doc.totalDiscount)}</td>
            {inter ? <><td /><td style={{ textAlign: 'right' }}>{fmt.money(doc.totalIgst)}</td></> : <><td /><td style={{ textAlign: 'right' }}>{fmt.money(doc.totalCgst)}</td><td /><td style={{ textAlign: 'right' }}>{fmt.money(doc.totalSgst)}</td></>}
            <td style={{ textAlign: 'right' }}><b>{fmt.money(doc.grandTotal)}</b></td><td /></tr>
        </tbody>
      </table>
      <table style={{ marginTop: 6 }}><tbody>
        <tr><td><b>Total Amount ({doc.currency}):</b> {fmt.money(doc.grandTotal)}{doc.roundOff ? ` (Round off ${fmt.money(doc.roundOff)})` : ''}<br /><b>Amount in Words:</b> {inWords(doc.grandTotal)}<br /><b>Total Tax in Words:</b> {inWords(doc.taxAmount)}</td></tr>
        {serials.length > 0 && <tr><td><b>Dispatched Serial No. Detail:</b> {serials.map((s, i) => `${i + 1}-${s}`).join('  ')}</td></tr>}
        <tr><td style={{ fontSize: 10 }}>*Goods once sold shall not be taken back. *Certified that the particulars given above are true and correct.<br />Remarks: {doc.remark}</td></tr>
      </tbody></table>
      <table className="noborder" style={{ marginTop: 30 }}><tbody><tr><td>Receiver&apos;s Signature</td><td style={{ textAlign: 'right' }}>For {doc.from.name?.toUpperCase()}<br /><br />Authorised Signatory</td></tr></tbody></table>
      <p style={{ textAlign: 'center', fontSize: 10 }}>This is an electronically generated document.</p>
    </div>
  );
}

export function PrintPo() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('po-one', `/po/${id}`);
  const po = data?.data;
  usePrintWhenReady(Boolean(po));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!po) return <div className="dms-print">Loading…</div>;
  return (
    <div className="dms-print">
      <Bar />
      <p style={{ textAlign: 'center' }}><b>{po.from.name}</b><br />{po.from.address}</p>
      <h2>PURCHASE ORDER</h2>
      <table><tbody>
        <tr><td style={{ width: '50%' }}><b>Ship From (Consignor):</b><br />{po.from.name}<br />{po.from.address}<br />{po.from.state}</td><td><b>PO No.</b> {po.poNo}<br /><b>PO Date</b> {fmt.date(po.poDate)}</td></tr>
        <tr><td><b>Bill To:</b><br />{po.to.name}<br />{po.to.address}<br />{po.to.state}</td><td><b>Ship To:</b><br />{po.to.name}<br />{po.deliveryAddress}</td></tr>
      </tbody></table>
      <table style={{ marginTop: 6 }}>
        <thead><tr><th>S.No.</th><th>Description Of Goods</th><th>Qty</th><th>Price</th><th>Value</th><th>Discount/Unit</th><th>Amount</th></tr></thead>
        <tbody>
          {po.lines.map((l, i) => <tr key={l._id}><td>{i + 1}</td><td>{l.productName} | {l.productCode}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.reqQty)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.price)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.value)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.discountPerUnit)}</td><td style={{ textAlign: 'right' }}>{fmt.money(l.afterDiscount)}</td></tr>)}
          <tr><td colSpan={6} style={{ textAlign: 'right' }}>Sub Total</td><td style={{ textAlign: 'right' }}>{fmt.money(po.subTotal)}</td></tr>
          <tr><td colSpan={6} style={{ textAlign: 'right' }}>Total Discount</td><td style={{ textAlign: 'right' }}>{fmt.money(po.totalDiscount)}</td></tr>
          <tr><td colSpan={6} style={{ textAlign: 'right' }}>Total Qty {po.totalQty} — Total Amount</td><td style={{ textAlign: 'right' }}><b>{fmt.money(po.grandTotal)}</b></td></tr>
        </tbody>
      </table>
      <p><b>Amount in Words:</b> {inWords(po.grandTotal)}<br /><b>Remarks:</b> {po.remark}<br /><b>Payment Terms:</b> {po.paymentTerms}</p>
      <p style={{ textAlign: 'right', marginTop: 40 }}>{po.from.name}<br />Authorised Signatory</p>
    </div>
  );
}

export function PrintPayment() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('pay-one', `/payments/${id}`);
  const p = data?.data;
  usePrintWhenReady(Boolean(p));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!p) return <div className="dms-print">Loading…</div>;
  return (
    <div className="dms-print">
      <Bar />
      <h2>{p.kind === 'ADJUSTMENT' ? `ACCOUNT ADJUSTMENT (${p.adjustType})` : 'PAYMENT RECEIPT'}</h2>
      <table><tbody>
        <tr><td><b>Receipt No.</b> {p.docNo}</td><td><b>Date</b> {fmt.date(p.paymentDate)}</td></tr>
        <tr><td><b>Received From</b> {p.fromLocation?.name}, {p.fromLocation?.city}</td><td><b>Received By</b> {p.toLocation?.name}, {p.toLocation?.city}</td></tr>
        <tr><td><b>Amount</b> {fmt.money(p.amount)}</td><td><b>Status</b> {p.status}{p.status === 'Approve' ? ` (Received ${fmt.money(p.receivedAmount)})` : ''}</td></tr>
        <tr><td><b>Mode</b> {p.payMode} {p.bankName} {p.ddChequeNo}</td><td><b>Txn Id</b> {p.transactionId}</td></tr>
        <tr><td colSpan={2}><b>Amount in Words:</b> {inWords(p.amount)}<br /><b>Remark:</b> {p.remark}</td></tr>
      </tbody></table>
      <p style={{ textAlign: 'right', marginTop: 40 }}>Authorised Signatory</p>
    </div>
  );
}
