/* Customer Registration / Call Booking (reference complaint_create → complaint_make / amc_make / customer_add / acc_make). */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import {
  B, useLk, o, fmt, crm, crmApiError, useCrmMutation, PageTitle, Btn, Field, Input, Alert, Panel, FormGrid, DataTable, cols,
} from '../kit';

const CATS = ['ASP', 'Customer', 'Customer Unit At Dealer Location', 'Dealer', 'Distributor', 'Entity', 'VVIP'];
const CALL_TYPES = ['Repair', 'Installation', 'Re-installation', 'Demo', 'Stock Repair', 'Maintenance service'];
const CALL_SOURCES = ['Presidential', 'Social Media', 'Web', 'Call Center', 'Email', 'Dealer', 'Walk In', 'Whatsapp', 'App', 'Others'];
const SERVICE_TYPES = ['Pick and Drop', 'DoorStep', 'Walk in', 'Walk in Appointment'];
const addDays = (d, n) => (d ? new Date(new Date(d).getTime() + n * 86400000).toISOString().slice(0, 10) : '');

const stateO = (lk) => o.text(lk.states);
const cityO = (lk, v) => {
  const st = (lk.states || []).find((s) => s.name === v.state);
  return o.text((lk.cities || []).filter((c) => !st || String(c.parent?._id || c.parent) === String(st._id)));
};
const areaO = (lk, v) => (lk.pincode || []).filter((p) => !v.pincode || p.code === v.pincode).map((p) => ({ value: p.name, label: p.name }));
const modelO = (lk, v) => o.model((lk.models || []).filter((m) => (!v.brand || String(m.brand?._id) === v.brand) && (!v.product || String(m.product?._id) === v.product)));

const customerFields = (withAssign) => [
  { t: 'heading', label: 'Customer Details' },
  { n: 'customerCategory', label: 'Customer Category', t: 'select', o: CATS, req: true },
  { n: 'pincode', label: 'Pincode', req: true },
  { n: 'customerName', label: 'Customer Name', req: true },
  { n: 'state', label: 'State', t: 'select', o: stateO, req: true },
  { n: 'landmark', label: 'Landmark' },
  { n: 'city', label: 'City', t: 'select', o: cityO, req: true },
  { n: 'contactNo', label: 'Contact No.', req: true },
  { n: 'area', label: 'Area', t: 'select', o: areaO },
  { n: 'address', label: 'Address', t: 'textarea', req: true },
  { n: 'email', label: 'Email', t: 'email' },
  ...(withAssign ? [{ n: 'assignLocation', label: 'Assign Location', t: 'select', o: (lk) => o.loc(lk.asps), req: true }] : []),
  { n: 'residenceNo', label: 'Residence No.' },
  { n: 'gstNo', label: 'GST No.' },
  { n: 'registrationName', label: 'Registration Name.' },
  { n: 'dob', label: 'Date Of Birth.', t: 'date' },
  { n: 'marriageDate', label: 'Marriage Date.', t: 'date' },
  { n: 'altContactNo', label: 'Alternate Contact No.' },
];
const productFields = [
  { t: 'heading', label: 'Product Details' },
  { n: 'product', label: 'Product', t: 'select', ph: '--Select Product--', o: (lk) => o.named(lk.products), req: true },
  { n: 'brand', label: 'Brand', t: 'select', ph: '--Select Brand--', o: (lk) => o.named(lk.brands), req: true },
  { n: 'model', label: 'Model', t: 'select', ph: '--Select Model--', o: modelO, req: true },
  { n: 'serialNo', label: 'Serial No' },
  { n: 'purchaseDate', label: 'Bill Purchase Date', t: 'date', req: true },
  { n: 'warrantyEndDate', label: 'Warranty End Date', t: 'date', ro: true },
  { n: 'installationDate', label: 'Date Of Installation', t: 'date' },
];

function useAutoWarranty(v, setV, lk) {
  // Warranty end date and IN/OUT follow the model's customer warranty days.
  const m = (lk.models || []).find((x) => x._id === v.model);
  const end = m && v.purchaseDate ? addDays(v.purchaseDate, m.customerWarrantyDays || 365) : '';
  const status = end ? (new Date(end) >= new Date(new Date().toISOString().slice(0, 10)) ? 'IN' : 'OUT') : '';
  if (end && (v.warrantyEndDate !== end || v.warrantyStatus !== status)) setTimeout(() => setV((s) => ({ ...s, warrantyEndDate: end, warrantyStatus: status })), 0);
  return m;
}

function usePinMapping(v, setV, lk) {
  const pin = (lk.pincode || []).find((p) => p.code === v.pincode);
  if (pin && !v._pinApplied) {
    setTimeout(() => setV((s) => ({ ...s, _pinApplied: v.pincode, state: s.state || pin.state, city: s.city || pin.city, area: s.area || pin.name, assignLocation: s.assignLocation || pin.attrs?.aspId || '' })), 0);
  }
  if (v._pinApplied && v._pinApplied !== v.pincode) setTimeout(() => setV((s) => ({ ...s, _pinApplied: '' })), 0);
}

const required = (fields, v) => fields.filter((f) => f.req && (!f.when || f.when(v)) && (v[f.n] === undefined || v[f.n] === '' || (Array.isArray(v[f.n]) && !v[f.n].length))).map((f) => f.n);

function BookingForm({ kind, start, onDone }) {
  const lk = useLk();
  const nav = useNavigate();
  const [v, setV] = useState(start);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});
  useAutoWarranty(v, setV, lk);
  usePinMapping(v, setV, lk);
  const vocs = useMemo(() => (lk.voc || []).filter((x) => (!x.brand || String(x.brand?._id || x.brand) === v.brand) && (!x.product || String(x.product?._id || x.product) === v.product)), [lk.voc, v.brand, v.product]);

  const F = {
    complaint: {
      title: 'Enter Complaint Details', url: '/jobs',
      fields: [
        ...customerFields(true), ...productFields,
        { n: 'callType', label: 'Call Type', t: 'select', ph: '--Select Call Type--', o: CALL_TYPES, req: true },
        { n: 'warrantyStatus', label: 'Warranty status', ro: true, req: true },
        { n: 'dealerName', label: 'Dealer Name' }, { n: 'invoiceNo', label: 'Invoice No' },
        { n: 'callSource', label: 'Call source', t: 'select', ph: '--Select --', o: CALL_SOURCES, req: true },
        { n: 'purchaseFrom', label: 'Purchase From', t: 'select', ph: 'Others', o: (l) => o.text(l.purchaseFrom) },
        { n: 'accessories', label: 'Accessory Required', t: 'multi', o: (l, x) => (l.parts || []).filter((p) => p.partCategory === 'Accessory' && (!x.brand || String(p.brand?._id) === x.brand)).map((p) => p.partName) },
        { t: 'heading', label: 'Observation' },
        { n: 'serviceType', label: 'Service Type', t: 'select', ph: '--Select --', o: SERVICE_TYPES, req: true },
        { n: 'voc1', label: 'VOC', t: 'select', ph: '--Select VOC 1--', o: () => vocs.map((x) => x.name), req: true },
        { n: 'voc2', label: 'More VOC', t: 'multi', o: () => vocs.map((x) => x.name) },
        { n: 'vocText', label: 'VOC Remark' },
        { n: 'remark', label: 'Remark', t: 'textarea' },
      ],
      body: (x) => ({ ...x, customerId: x.customerObjId, vocs: [x.voc1, ...(x.voc2 || [])].filter(Boolean), purchaseFrom: x.purchaseFrom || 'Others' }),
    },
    accessory: {
      title: 'Enter Accessory Details', url: '/jobs',
      fields: [
        ...customerFields(true), ...productFields.filter((f) => !['purchaseDate', 'warrantyEndDate', 'installationDate'].includes(f.n)),
        { n: 'purchaseFrom', label: 'Entity Name', t: 'select', ph: 'Others', o: (l) => o.text(l.purchaseFrom) },
        { n: 'accessories', label: 'Accessory Required', t: 'multi', o: (l, x) => (l.parts || []).filter((p) => p.partCategory === 'Accessory' && (!x.brand || String(p.brand?._id) === x.brand)).map((p) => p.partName), req: true },
      ],
      body: (x) => ({ ...x, customerId: x.customerObjId, callType: 'Accessory', serviceType: 'Walk in', vocs: ['Accessory Required'], purchaseFrom: x.purchaseFrom || 'Others' }),
    },
    amc: {
      title: 'Enter AMC Details', url: '/customers/amc',
      fields: [
        ...customerFields(false).filter((f) => !['area', 'gstNo', 'registrationName', 'dob', 'marriageDate'].includes(f.n)),
        ...productFields.filter((f) => !['warrantyEndDate', 'installationDate'].includes(f.n)).map((f) => (f.n === 'serialNo' ? { ...f, req: true } : f.n === 'purchaseDate' ? { ...f, req: false } : f)),
        { n: 'amcDurationDays', label: 'AMC Duration.(In Days)', t: 'number', req: true },
        { n: 'amcStartDate', label: 'AMC Start Date', t: 'date', req: true },
        { n: 'amcExpiryDate', label: 'AMC Expiry Date', t: 'date', ro: true },
        { n: 'amcType', label: 'AMC Type', t: 'select', o: ['Comprehensive', 'Non Comprehensive'], req: true },
        { n: 'amcAmount', label: 'AMC Amount', t: 'number', req: true },
        { t: 'heading', label: 'Payment' },
        { n: 'amcPaymentMode', label: 'Payment Mode', t: 'select', o: ['Cash', 'Online', 'Cheque'], req: true },
        { n: 'purchaseFrom', label: 'Entity Name', t: 'select', ph: 'Others', o: (l) => o.text(l.purchaseFrom) },
        { n: 'amcPaymentRef', label: 'CR/Transaction Number', req: true, when: (x) => x.amcPaymentMode === 'Online' },
        { n: 'chequeNo', label: 'Cheque Number', req: true, when: (x) => x.amcPaymentMode === 'Cheque' },
        { n: 'chequeDate', label: 'Cheque Date', t: 'date', req: true, when: (x) => x.amcPaymentMode === 'Cheque' },
        { n: 'bank', label: 'Bank Name', req: true, when: (x) => x.amcPaymentMode === 'Cheque' },
        { n: 'payee', label: 'Payee Name', req: true, when: (x) => x.amcPaymentMode === 'Cheque' },
      ],
      body: (x) => ({
        ...x, customerId: x.customerObjId, name: x.customerName, phone: x.contactNo, category: x.customerCategory,
        amcPaymentRef: x.amcPaymentMode === 'Cheque' ? `${x.chequeNo} / ${x.chequeDate} / ${x.bank} / ${x.payee}` : x.amcPaymentRef,
      }),
    },
    customer: {
      title: 'Enter Customer/Product Details', url: '/customers',
      fields: [
        ...customerFields(false).filter((f) => !['dob', 'marriageDate'].includes(f.n)), ...productFields.map((f) => (f.n === 'serialNo' ? { ...f, req: true } : f)),
        { n: 'purchaseFrom', label: 'Entity Name', t: 'select', ph: 'Others', o: (l) => o.text(l.purchaseFrom) },
        { n: 'warrantyStatus', label: 'Warranty status', ro: true }, { n: 'dealerName', label: 'Dealer Name' }, { n: 'invoiceNo', label: 'Invoice No' },
      ],
      body: (x) => ({ ...x, name: x.customerName, phone: x.contactNo, altPhone: x.altContactNo, category: x.customerCategory }),
    },
  }[kind];

  if (kind === 'amc' && v.amcStartDate && v.amcDurationDays) {
    const exp = addDays(v.amcStartDate, Number(v.amcDurationDays));
    if (v.amcExpiryDate !== exp) setTimeout(() => setV((s) => ({ ...s, amcExpiryDate: exp })), 0);
  }

  const save = useCrmMutation((b) => crm.post(F.url, b), {
    onSuccess: (res) => {
      const d = res?.data;
      if (kind === 'complaint' || kind === 'accessory') nav(`${B}/jobs/view/${d._id}`);
      else onDone(res?.message);
    },
  });
  const submit = (e) => {
    e.preventDefault();
    const miss = required(F.fields, v);
    if (v.contactNo && !/^[6-9]\d{9}$/.test(v.contactNo)) miss.push('contactNo');
    if (v.pincode && !/^\d{6}$/.test(v.pincode)) miss.push('pincode');
    setErrors(Object.fromEntries(miss.map((n) => [n, n === 'contactNo' && v.contactNo ? 'Enter a valid 10 digit mobile number' : n === 'pincode' && v.pincode ? 'Enter a 6 digit pincode' : 'Required'])));
    if (miss.length) { setMsg('Please fill all required (*) fields correctly.'); return; }
    setMsg('');
    save.mutate(F.body(v), { onError: (err) => setMsg(crmApiError(err).message) });
  };
  return (
    <form onSubmit={submit} noValidate>
      <PageTitle icon={PhoneCall}>{F.title}</PageTitle>
      <Alert>{msg}</Alert>
      <FormGrid fields={F.fields} v={v} setV={setV} errors={errors} />
      <div className="dms-actions">
        <Btn variant="default" onClick={() => onDone()}>Back</Btn>
        <button type="submit" className="dms-btn" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function CallBookingPage() {
  const [q, setQ] = useState({ phone: '', customerId: '', email: '', serialNo: '' });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState(null);
  const filled = Object.entries(q).find(([, x]) => x.trim());
  const search = async (e) => {
    e?.preventDefault(); setErr(''); setOk('');
    if (!filled) { setErr('Enter Mobile Number, Customer ID, Email ID or Serial No.'); return; }
    try { setRes((await crm.get('/customers/search', { [filled[0]]: filled[1].trim() })).data); } catch (x) { setErr(crmApiError(x).message); }
  };
  const c = res?.customer;
  const base = (p) => ({
    customerObjId: c?._id, customerCategory: c?.category || 'Customer', customerName: c?.name || '', contactNo: c?.phone || (q.phone || ''), altContactNo: c?.altPhone || '', email: c?.email || q.email || '',
    address: c?.address || '', landmark: c?.landmark || '', state: c?.state || '', city: c?.city || '', area: c?.area || '', pincode: c?.pincode || '', residenceNo: c?.residenceNo || '', gstNo: c?.gstNo || '',
    callSource: 'Call Center', purchaseFrom: 'Others', serialNo: q.serialNo || '',
    ...(p ? { registeredProduct: p._id, product: p.product?._id, brand: p.brand?._id, model: p.model?._id, serialNo: p.serialNo, purchaseDate: fmt.date(p.purchaseDate), installationDate: fmt.date(p.installationDate), dealerName: p.dealerName, invoiceNo: p.invoiceNo, purchaseFrom: p.purchaseFrom || 'Others' } : {}),
  });
  if (form) return <BookingForm kind={form.kind} start={form.start} onDone={(m) => { setForm(null); if (m) { setOk(m); search(); } }} />;

  const one = (k) => (x) => setQ({ phone: '', customerId: '', email: '', serialNo: '', [k]: x });
  const dis = (k) => Boolean(filled) && filled[0] !== k;
  return (
    <div>
      <PageTitle icon={PhoneCall}>Customer Registration/Call Booking</PageTitle>
      <form className="dms-filter" onSubmit={search}>
        <Field label="Mobile Number"><Input value={q.phone} disabled={dis('phone')} inputMode="numeric" onChange={(e) => one('phone')(e.target.value)} /></Field>
        <Field label="Customer ID"><Input value={q.customerId} disabled={dis('customerId')} onChange={(e) => one('customerId')(e.target.value)} /></Field>
        <Field label="Email ID"><Input value={q.email} disabled={dis('email')} onChange={(e) => one('email')(e.target.value)} /></Field>
        <Field label="Serial No."><Input value={q.serialNo} disabled={dis('serialNo')} onChange={(e) => one('serialNo')(e.target.value)} /></Field>
        <button type="submit" className="dms-btn" disabled={!filled}>Search</button>
      </form>
      <Alert>{err}</Alert><Alert ok>{ok}</Alert>
      {res && (
        <>
          <div className="dms-toolbar">
            <Btn onClick={() => setForm({ kind: 'complaint', start: base() })}>New Complaint</Btn>
            <Btn variant="default" onClick={() => setForm({ kind: 'amc', start: base() })}>New AMC</Btn>
            <Btn variant="default" onClick={() => setForm({ kind: 'customer', start: base() })}>Add Customer/Product</Btn>
            <Btn variant="default" onClick={() => setForm({ kind: 'accessory', start: base() })}>Accessory Request</Btn>
          </div>
          <Panel title="Customer Details">
            {!c ? <p className="dms-muted">No customer found — use “New Complaint” or “Add Customer/Product” to register one.</p> : (
              <DataTable columns={cols([{ key: 'customerId', label: 'ID' }, { key: 'category', label: 'Customer Category' }, { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Mobile No.' }, { key: 'residenceNo', label: 'Residence No' }])} rows={[c]} />
            )}
          </Panel>
          <Panel title="Registered Product Details">
            <DataTable columns={cols([
              { key: 'serialNo', label: 'Serial No' }, { key: 'p', label: 'Product', render: (r) => r.product?.name }, { key: 'm', label: 'Model', render: (r) => r.model?.modelName },
              { key: 'purchaseDate', label: 'Purchase Date', t: 'date' }, { key: 'installationDate', label: 'Installation Date', t: 'date' }, { key: 'warrantyEndDate', label: 'Warranty End Date', t: 'date' },
              { key: 'warrantyStatus', label: 'Warranty Status' }, { key: 'amcNo', label: 'AMC No.' },
              { key: 'log', label: 'Call Log', sortable: false, render: (r) => <button type="button" className="dms-btn sm" onClick={() => setForm({ kind: 'complaint', start: base(r) })}>Call Log</button> },
            ])} rows={res.products || []} />
          </Panel>
          <Panel title="Complaint History">
            <DataTable columns={cols([
              { key: 'jobNo', label: 'Job No.', render: (r) => <Link to={`${B}/jobs/view/${r._id}`}>{r.jobNo}</Link> }, { key: 'modelName', label: 'Model' }, { key: 'serialNo', label: 'Serial No' },
              { key: 'callType', label: 'Call Type' }, { key: 'openDate', label: 'Open Date', t: 'date' }, { key: 'closeDate', label: 'Close Date', t: 'date' }, { key: 'statusText', label: 'Status' }, { key: 'assignLocationName', label: 'Assign location' },
            ])} rows={res.jobs || []} emptyText="No Record found" />
          </Panel>
        </>
      )}
    </div>
  );
}
