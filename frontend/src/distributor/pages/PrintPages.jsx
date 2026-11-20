import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDmsQuery, useLookups, fmt, apiError, BRAND } from '../api';
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
  <div className="no-print rp-bar">
    <button type="button" onClick={() => window.print()}>Print</button>
    <button type="button" className="alt" onClick={() => window.close()}>Close</button>
  </div>
);

/* ───────────── Reference document layouts (CANSALE print_invoice.php / print_po.php, inspected 20-Nov-2026) ───────────── */
const dmy = (d) => (d ? new Date(d).toISOString().slice(0, 10).split('-').reverse().join('-') : '');
const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '0000-00-00');
const RS = '₹';
/** Reference spells a zero amount as "zero Only". */
const words = (n) => (Math.round(Number(n) || 0) === 0 ? 'zero Only' : inWords(n));
const withCity = (p) => (p.city && !String(p.address).toLowerCase().includes(p.city.toLowerCase()) ? [p.address, p.city].filter(Boolean).join(', ') : p.address);
const Logo = () => <div className="rp-logo"><b>{BRAND.name}<span>{BRAND.accent}</span></b></div>;

/** Party details for printing: the live location/vendor master when available, else the document snapshot. */
function useParty(lk) {
  const locs = new Map((lk?.data?.allLocations || []).map((l) => [l._id, l]));
  const vendors = new Map((lk?.data?.vendors || []).map((v) => [v._id, v]));
  return (p, preferDispatch = false) => {
    const m = (p?.location && locs.get(p.location)) || (p?.vendor && vendors.get(p.vendor)) || {};
    const address = (preferDispatch && m.dispatchAddress) || m.billingAddress || m.address || p?.address || '';
    return { name: p?.name || m.name || '', address, city: p?.city || m.city || '', state: p?.state || m.state || '', stateCode: p?.stateCode || m.stateCode || '', gstNo: p?.gstNo || m.gstNo || '', panNo: m.panNo || '', pincode: m.pincode || '', cstNo: m.cstNo || '', stNo: m.stNo || '' };
  };
}

function PartyBlock({ p, deliveryAddress }) {
  return (
    <td className="rp-party">
      <b>Name &amp; Address : {p.name}</b><br />
      {deliveryAddress || p.address}<br />
      {p.state}<br />
      <b>GST No.:</b> {p.gstNo || 'NA'}<br />
      <b>State.:</b> {p.state}<br />
      <b>State Code:</b> {p.stateCode}<br />
      <b>PAN No.:</b> {p.panNo || 'NA'}
    </td>
  );
}

export function PrintDoc() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('doc-one', `/invoices/${id}`);
  const { data: lk } = useLookups();
  const party = useParty(lk);
  const doc = data?.data;
  usePrintWhenReady(Boolean(doc && lk));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!doc || !lk) return <div className="dms-print">Loading…</div>;
  const seller = party(doc.from);
  const buyer = party(doc.to);
  const shipTo = doc.deliveryAddress || doc.logistic?.deliveryAddress || party(doc.to, true).address;
  const inter = doc.lines.some((l) => l.igstAmt) || (!doc.lines.some((l) => l.cgstAmt || l.sgstAmt) && seller.state && buyer.state && seller.state !== buyer.state);
  // The reference prints stock transfers and challans with the "Delivery Challan" title, everything else as "TAX INVOICE".
  const title = doc.docType === 'DELIVERY CHALLAN' || ['STN', 'JOBWORK', 'OPENING'].includes(doc.kind) ? 'Delivery Challan'
    : ['PRN', 'VENDOR_RETURN', 'CUSTOMER_RETURN'].includes(doc.kind) ? 'RETURN NOTE' : 'TAX INVOICE';
  const lg = doc.logistic || {};
  const sum = (k) => doc.lines.reduce((n, l) => n + (Number(l[k]) || 0), 0);
  const taxable = sum('afterDiscount');
  const tax = inter ? sum('igstAmt') : sum('sgstAmt') + sum('cgstAmt');
  const cols = inter ? 15 : 17;
  return (
    <div className="rp-wrap rp-inv">
      <Bar />
      <table className="rp-doc"><tbody><tr><td>
        <table className="rp-t"><tbody><tr>
          <td className="rp-logo-cell"><Logo /></td>
          <td className="rp-title">{title}</td>
        </tr></tbody></table>
        <table className="rp-t rp-head"><tbody>
          <tr><td style={{ width: '35.7%' }} /><td colSpan={2} className="rp-cap">Seller</td></tr>
          <tr>
            <td className="rp-big"><b>Invoice No.&nbsp; {doc.invoiceNo}</b><br /><b>Invoice Date&nbsp; {dmy(doc.invoiceDate)}</b></td>
            <td className="rp-party" style={{ width: '35.3%' }}>
              <b>Name &amp; Address :</b><br /><b>{seller.name}</b><br />{seller.address}<br />{seller.state}<br />
              <b>GST No.:</b> {seller.gstNo}<br /><b>State.:</b> {seller.state}<br /><b>State Code:</b> {seller.stateCode}<br /><b>PAN No.:</b> {seller.panNo}
            </td>
            <td className="rp-small">
              <span className="rp-mid"><b>Transporter Name &amp; Address</b> &nbsp; :</span><br /><span className="rp-mid">{lg.courierName}</span><br /><br />
              <b>Docket No:</b> {lg.docketNo}<br /><b>Docket Date:</b> {ymd(lg.dispatchDate)}<br /><b>E-Ways No.:</b> {lg.ewayBillNo}
            </td>
          </tr>
          <tr><td className="rp-cap">Details of Receiver (Bill To)</td><td className="rp-cap">Details of Consignee (Ship To)</td><td className="rp-cap">Details</td></tr>
          <tr>
            <PartyBlock p={buyer} />
            <PartyBlock p={buyer} deliveryAddress={shipTo} />
            <td className="rp-small">
              <b>Transportation Mode :</b> {lg.transportMode}<br /><b>Vehicle No./CourierName:</b> {lg.carrierNo || lg.courierName}<br />
              <b>LR No./Docket No.:</b> {lg.docketNo}<br /><b>Docket Date:</b> {ymd(lg.dispatchDate)}
            </td>
          </tr>
        </tbody></table>
        <table className="rp-t rp-items"><tbody>
          <tr className="rp-ih">
            <td>S.No.</td><td>Item Code</td><td>Description Of Goods/ Services</td><td>HSN/SAC</td><td>Qty</td><td>UOM</td><td>Rate/Unit</td><td>Discount</td><td>Rate/Unit (Inc. Tax)</td><td>Taxable Value</td>
            {inter ? <><td>IGST %</td><td>IGST Amount</td></> : <><td>SGST/UGST %</td><td>SGST/UGST Amount</td><td>CGST %</td><td>CGST Amount</td></>}
            <td>Total Amount (Inc Tax)</td><td>Scheme</td><td>Scheme Code</td>
          </tr>
          {doc.lines.map((l, i) => (
            <tr key={l._id} className="rp-row">
              <td className="c">{i + 1}</td><td>{l.productCode}</td><td>{l.productName}{l.color ? ` | ${l.color}` : ''}</td><td className="r">{l.hsnCode}</td><td className="r">{fmt.money(l.qty)}</td><td className="r rp-arial">EA</td>
              <td className="r">{fmt.money(l.price)}</td><td className="r">{fmt.money(l.discountPerUnit)}</td><td className="r">{fmt.money(l.qty ? l.total / l.qty : 0)}</td><td className="r">{fmt.money(l.afterDiscount)}</td>
              {inter ? <><td className="r">{fmt.money(l.igstPer)}</td><td className="r">{fmt.money(l.igstAmt)}</td></>
                : <><td className="r">{fmt.money(l.sgstPer)}</td><td className="r">{fmt.money(l.sgstAmt)}</td><td className="r">{fmt.money(l.cgstPer)}</td><td className="r">{fmt.money(l.cgstAmt)}</td></>}
              <td className="r">{fmt.money(l.total)}</td><td>{l.schemeName || ''}</td><td>{l.schemeCode || ''}</td>
            </tr>
          ))}
          <tr className="rp-fill">{Array.from({ length: cols }, (_, k) => <td key={k} />)}</tr>
          <tr className="rp-tot">
            <td colSpan={4} className="r"><b>Total</b></td><td>{fmt.money(doc.totalQty ?? sum('qty'))}</td><td /><td /><td /><td />
            <td className="r">{RS} {fmt.money(taxable)}</td>
            {inter ? <><td /><td className="r">{RS} {fmt.money(sum('igstAmt'))}</td></>
              : <><td /><td className="r">{RS} {fmt.money(sum('sgstAmt'))}</td><td /><td className="r">{RS} {fmt.money(sum('cgstAmt'))}</td></>}
            <td>{RS} {fmt.money(doc.grandTotal)}</td><td /><td />
          </tr>
        </tbody></table>
        <table className="rp-t rp-sum"><tbody><tr>
          <td style={{ width: '37.5%' }}><b>Total Weight</b></td>
          <td><b>Total Quantity:</b>{fmt.money(doc.totalQty ?? sum('qty'))}</td>
          <td className="r" style={{ width: '17%' }}><b>Total Amount(INR):</b>{fmt.money(doc.grandTotal)}</td>
        </tr></tbody></table>
        <table className="rp-t rp-foot"><tbody>
          <tr>
            <td className="rp-decl">
              <b>Amount in Words</b> {RS} {inWords(doc.grandTotal)}<br /><b>Total Tax in Words</b> {RS} {words(tax)}<br /><br /><br />
              <span className="rp-light">*Disputes,If any Shall be Subjected to Court of Delhi only.<br />*Goods once sold Shall not be taken Back.<br />*Certified that the particular above are true and correct.</span><br /><br />
              <b>Registered Office:</b>{seller.address}<br />{[seller.state, seller.pincode].filter(Boolean).join('-')}.<br />
              <b>CIN No.: ,PAN No.: {seller.panNo},GSTIN: {seller.gstNo}</b><br />
              <b>Sender Remark:</b> {doc.remark}
            </td>
            <td className="rp-sign">
              <b>For {seller.name.toUpperCase()}</b><br /><br /><b>Pre Authorized Signatory</b><br /><br /><br />
              <b>Receiver Remark</b><br /><b>Received Date &amp; Time</b><br /><b>Signature</b><br /><b>Remark</b>
            </td>
          </tr>
          <tr><td colSpan={2} className="rp-egen"><b>This Invoice is electronically generated and no signature is required.</b></td></tr>
        </tbody></table>
      </td></tr></tbody></table>
    </div>
  );
}

export function PrintPo() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('po-one', `/po/${id}`);
  const { data: lk } = useLookups();
  const party = useParty(lk);
  const po = data?.data;
  usePrintWhenReady(Boolean(po && lk));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!po || !lk) return <div className="dms-print">Loading…</div>;
  const from = party(po.from);
  const to = party(po.to);
  const shipTo = party(po.to, true).address; // reference: Ship To repeats the supplier (To party)
  const Addr = ({ p, address }) => (<><b>{p.name}</b><br />{address || p.address}<br />{p.state}<br /><b>CST N0.:</b> {p.cstNo}<br /><b>ST N0.:</b> {p.stNo}</>);
  return (
    <div className="rp-wrap rp-po">
      <Bar />
      <table className="rp-doc"><tbody><tr><td>
        <table className="rp-t"><tbody><tr>
          <td className="rp-logo-cell"><Logo /></td>
          <td className="rp-pohead"><b>{from.name}</b><br /><b>{withCity(from)}</b><br /><b>PURCHASE ORDER</b></td>
        </tr></tbody></table>
        <table className="rp-t rp-head"><tbody>
          <tr>
            <td style={{ width: '50.5%', height: 104 }}><b>Ship From(Consignor) :</b><br /><br /><Addr p={from} /></td>
            <td><b>PO No. {po.poNo}</b><br /><b>PO Date&nbsp; {dmy(po.poDate)}</b></td>
          </tr>
          <tr>
            <td><b>Bill To:</b><br /><br /><Addr p={to} /></td>
            <td><b>Ship To:</b><br /><br /><Addr p={to} address={shipTo} /></td>
          </tr>
        </tbody></table>
        <table className="rp-t rp-items rp-poitems"><tbody>
          <tr className="rp-ih"><td style={{ width: 56 }}>S.No.</td><td style={{ width: 184 }}>Description Of Goods</td><td style={{ width: 88 }}>Qty</td><td style={{ width: 80 }}>Price</td><td style={{ width: 128 }}>Value</td><td style={{ width: 120 }}>Discount/Unit</td><td>Amount</td></tr>
          {po.lines.map((l, i) => (
            <tr key={l._id} className="rp-row">
              <td className="c">{i + 1}</td><td>{l.productName}</td><td className="r">{fmt.money(l.reqQty)}</td><td className="r"><span className="rp-arial">{RS}</span> {fmt.money(l.price)}</td>
              <td className="r">{fmt.money(l.value)}</td><td className="r">{fmt.money(l.discountPerUnit)}</td><td className="r">{fmt.money(l.afterDiscount)}</td>
            </tr>
          ))}
          <tr className="rp-fill">{Array.from({ length: 7 }, (_, k) => <td key={k} />)}</tr>
          <tr className="rp-potot"><td colSpan={6} className="r rp-nb"><b>Sub Total</b><br /><b>Total Discount</b></td><td className="r">{RS}{fmt.money(po.subTotal)}<br />{RS}{fmt.money(po.totalDiscount)}</td></tr>
          <tr className="rp-potot"><td colSpan={3} className="r"><b>Total Qty</b></td><td>{fmt.money(po.totalQty)}</td><td colSpan={2} className="r"><b>Total Amount</b></td><td className="r">{RS}{fmt.money(po.grandTotal)}</td></tr>
        </tbody></table>
        <table className="rp-t rp-pofoot"><tbody>
          <tr>
            <td rowSpan={2} style={{ width: '50.3%' }}><span className="rp-mid"><b>Amount in Words</b> {RS} {inWords(po.grandTotal)}</span><br /><br /><span className="rp-mid">Remarks : {po.remark}</span></td>
            <td className="r"><b>Total Amount:</b></td><td className="r rp-mono">{RS} {fmt.money(po.grandTotal)}</td>
          </tr>
          <tr><td colSpan={2} className="rp-posign"><div><b className="rp-mid">{from.name}</b><span>Authorised Signatory</span></div></td></tr>
        </tbody></table>
      </td></tr></tbody></table>
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

/** Serial (IMEI) list attached to an invoice, laid out like the reference print_imei.php (800px). */
export function PrintImei() {
  const { id } = useParams();
  const { data, error } = useDmsQuery('doc-one', `/invoices/${id}`);
  const { data: lk } = useLookups();
  const party = useParty(lk);
  const doc = data?.data;
  usePrintWhenReady(Boolean(doc && lk));
  if (error) return <div className="dms-print">{apiError(error).message}</div>;
  if (!doc || !lk) return <div className="dms-print">Loading…</div>;
  const from = party(doc.from);
  const to = party(doc.to);
  const shipTo = doc.deliveryAddress || doc.logistic?.deliveryAddress || party(doc.to, true).address;
  const serials = doc.lines.flatMap((l) => l.serials || []);
  const Addr = ({ p, address }) => (<><b>{p.name}</b><br /><br />{address || p.address}<br />{p.state}<br /><b>GST No.:</b> {p.gstNo}</>);
  return (
    <div className="rp-wrap rp-po">
      <Bar />
      <table className="rp-doc"><tbody><tr><td>
        <table className="rp-t"><tbody><tr>
          <td className="rp-logo-cell"><Logo /></td>
          <td className="rp-pohead"><b>{from.name}</b><br /><b>{withCity(from)}</b><br /><b>INVOICE</b></td>
        </tr></tbody></table>
        <table className="rp-t rp-head"><tbody>
          <tr>
            <td style={{ width: '52.6%', height: 104 }}><b>Ship From(Consignor) :</b><br /><br /><Addr p={from} /></td>
            <td><b>Invoice No.&nbsp; {doc.invoiceNo}</b><br /><b>Invoice Date&nbsp; {dmy(doc.invoiceDate)}</b></td>
          </tr>
          <tr>
            <td><b>Bill To:</b><br /><br /><Addr p={to} /></td>
            <td><b>Ship To:</b><br /><br /><Addr p={to} address={shipTo} /></td>
          </tr>
          <tr><td colSpan={2} className="rp-small" style={{ height: 18, verticalAlign: 'middle' }}><b>Dispatched Serial No. Detail:</b></td></tr>
          <tr><td colSpan={2} className="rp-serials">{serials.length ? serials.map((s, i) => <span key={s}><b>{i + 1}</b>-{s}</span>) : 'No serial numbers attached.'}</td></tr>
        </tbody></table>
        <table className="rp-t rp-pofoot"><tbody><tr>
          <td style={{ width: '52%', height: 80 }}><span className="rp-mid">Remarks : {doc.remark}</span></td>
          <td className="rp-posign"><div><b className="rp-mid">{from.name}</b><span>Authorised Signatory</span></div></td>
        </tr></tbody></table>
      </td></tr></tbody></table>
    </div>
  );
}
