/* Job lists and job screens (Call Status, Jobs/Call Status, Acknowledge, Visit, Assign, Repair, Call Confirmation …). */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Eye, Printer, Wrench, CheckCircle2, MapPinned, UserPlus, Pencil } from 'lucide-react';
import {
  B, useLk, useMe, o, cols, fmt, crm, crmApiError, useCrmQuery, useCrmMutation, Filters, PageTitle, Toolbar, Btn, BackBtn, DataTable, Field, Input, Select, TextArea,
  Alert, Panel, KV, JobPanels, FormGrid,
} from '../kit';
import { Modal, exportCsv } from '../../components/ui';

const PRODUCT_F = [
  { n: 'product', label: 'Product', o: (lk) => o.named(lk.products) },
  { n: 'brand', label: 'Brand', o: (lk) => o.named(lk.brands) },
  { n: 'model', label: 'Model', o: (lk, v) => o.model((lk.models || []).filter((m) => !v.brand || String(m.brand?._id) === v.brand)) },
];
const DATE_F = { t: 'daterange', label: 'Date Range' };
const OPENCLOSE_F = { n: 'closed', label: 'Job Status', o: [{ value: '0', label: 'Open Call' }, { value: '1', label: 'Close Call' }] };
const CLOSED_STATES = ['Repair Done', 'Handover', 'Installation Done', 'Demo Done', 'Replacement', 'RWR', 'Cancel'];
const isOpen = (j) => !CLOSED_STATES.includes(j.status);
const icon = (Icon, title) => <Icon size={17} aria-label={title} />;

const C = {
  sno: { key: '#', label: 'S.No', sortable: false },
  jobNo: { key: 'jobNo', label: 'Job No.', render: (r) => <Link to={`${B}/jobs/view/${r._id}`}>{r.jobNo}</Link>, text: (r) => r.jobNo },
  custId: { key: 'customerIdCode', label: 'Customer Id.' },
  custName: { key: 'customerName', label: 'Customer Name' },
  contact: { key: 'contactNo', label: 'Contact No.' },
  brand: { key: 'brandName', label: 'Brand' },
  product: { key: 'productName', label: 'Product Category' },
  productP: { key: 'productName', label: 'Product' },
  model: { key: 'modelName', label: 'Model' },
  area: { key: 'areaType', label: 'Area Type' },
  serial: { key: 'serialNo', label: 'Serial No' },
  imei: { key: 'serialNo', label: 'IMEI/Serial No.' },
  callType: { key: 'callType', label: 'Call Type' },
  open: { key: 'openDate', label: 'Open Date', render: (r) => fmt.dmy(r.openDate), text: (r) => fmt.dmy(r.openDate) },
  close: { key: 'closeDate', label: 'Close Date', render: (r) => fmt.dmy(r.closeDate), text: (r) => fmt.dmy(r.closeDate) },
  aging: { key: 'aging', label: 'Aging', render: (r) => Math.floor(((r.closeDate ? new Date(r.closeDate) : new Date()) - new Date(r.openDate)) / 86400000) },
  status: { key: 'statusText', label: 'Status' },
  warranty: { key: 'warrantyStatus', label: 'Warranty Status' },
  loc: { key: 'assignLocationName', label: 'Assign location', render: (r) => r.assignLocation?.name || r.assignLocationName, text: (r) => r.assignLocation?.name || r.assignLocationName },
  locName: { key: 'assignLocationName', label: 'Location Name', render: (r) => r.assignLocation?.name || r.assignLocationName },
  eng: { key: 'engineerName', label: 'Engineer Name' },
  print: { key: 'print', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/job/${r._id}`} target="_blank" rel="noreferrer">{icon(Printer, 'Print')}</a> },
  view: { key: 'view', label: 'View', sortable: false, render: (r) => <Link className="dms-icon-btn" title="View" to={`${B}/jobs/view/${r._id}`}>{icon(Eye, 'View')}</Link> },
};
const STD = [C.jobNo, C.custId, C.custName, C.contact, C.brand, C.product, C.model, C.area, C.serial, C.callType, C.open, C.close];

/* small action modal */
function ActionModal({ title, fields, url, onClose, defaults = {}, toBody }) {
  const [v, setV] = useState(defaults);
  const [msg, setMsg] = useState('');
  const save = useCrmMutation((b) => crm.post(url, b), { onSuccess: onClose });
  const submit = () => {
    const miss = fields.find((f) => f.req && !v[f.n] && (!f.when || f.when(v)));
    if (miss) { setMsg(`${miss.label} is required`); return; }
    save.mutate(toBody ? toBody(v) : v, { onError: (e) => setMsg(crmApiError(e).message) });
  };
  return (
    <Modal open title={title} onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Close</Btn><button type="button" className="dms-btn" disabled={save.isPending} onClick={submit}>Save</button></>}>
      <Alert>{msg}</Alert>
      <FormGrid fields={fields} v={v} setV={setV} />
    </Modal>
  );
}

const MODES = {
  'call-status': { title: 'Complaint Status', filters: PRODUCT_F, cols: [...STD, C.status, C.print, C.loc, C.view] },
  search: { title: 'Complaint Status', filters: [...PRODUCT_F, { n: 'search', label: 'Job No / Mobile / Serial', t: 'text' }], cols: [...STD, C.status, C.loc, C.view] },
  reassign: { title: 'Reassgin Jobs', params: { rejected: '1', status: 'Open' }, cols: [C.jobNo, C.custId, C.custName, C.brand, C.product, C.model, C.serial, C.open, C.close, C.status], action: 'reassign' },
  happy: { title: 'Happy Calling', filters: [DATE_F, { n: 'status', label: 'Job Status', o: [{ value: 'Repair Done,Handover,Installation Done,Demo Done', label: 'Repair Done' }], ph: false }, ...PRODUCT_F], params: { happyCalling: '1' }, cols: [...STD, C.status], action: 'happy' },
  'request-approval': { title: 'REQUEST APPROVAL', filters: [DATE_F, { n: 'subStatus', label: 'Job Status', o: [{ value: 'Request Approved', label: 'Request Approved' }, { value: 'Other Approval', label: 'Request For Approval' }, { value: 'Request Rejected', label: 'Request Rejected' }] }, ...PRODUCT_F, { n: 'assignLocation', label: 'Location', o: (lk) => o.loc(lk.asps) }], params: { status: 'Request For Approval' }, cols: [...STD, C.locName, { key: 'requestFor', label: 'Request For', render: (r) => r.approvalRequest?.requestFor }, C.status], action: 'approve' },
  'status-change': { title: 'Job Status Change', cols: [C.jobNo, C.imei, C.productP, C.brand, C.model, C.open, C.close, C.custName, C.warranty, C.status], action: 'status' },
  asp: { title: 'Jobs/Call Status', filters: [DATE_F, OPENCLOSE_F, ...PRODUCT_F], cols: [...STD, C.aging, C.status], action: 'asp' },
  drop: { title: 'Drop Jobs', params: { serviceType: 'Walk in,Walk in Appointment' }, filters: [DATE_F, OPENCLOSE_F, ...PRODUCT_F], cols: [...STD, C.aging, C.status], action: 'asp' },
  pickup: { title: 'Pickup Call', params: { serviceType: 'Pick and Drop' }, filters: [DATE_F, OPENCLOSE_F, ...PRODUCT_F], cols: [...STD, C.aging, C.status], action: 'pickup' },
  reschedule: { title: 'Reschedule', params: { closed: '0' }, cols: [...STD, C.status], action: 'reschedule' },
  'out-warranty': { title: 'Make Invoice for OUT Warranty Jobs', params: { warranty: 'OUT', status: 'Repair Done,Handover,Replacement' }, cols: [C.jobNo, C.custName, C.brand, C.productP, C.model, C.serial, C.close, C.status], action: 'invoice' },
  'reassign-eng': { title: 'Reassign Call To Engineer', params: { status: 'Asigned,Appointment,Pending,PNA,EP,WIP' }, cols: [...STD, C.status, C.eng], action: 'reassign-eng' },
  'edit-list': { title: 'JOB DETAILS EDIT', params: { closed: '0' }, cols: [C.jobNo, C.custName, C.brand, C.product, C.model, C.serial, C.open, C.close, C.warranty, C.status], action: 'edit' },
};

export function JobListPage() {
  const { mode } = useParams();
  const m = MODES[mode] || MODES['call-status'];
  return <JobList key={mode} m={m} mode={mode} />;
}

function JobList({ m }) {
  const me = useMe();
  const lk = useLk();
  const [f, setF] = useState({});
  const [modal, setModal] = useState(null);
  const q = useCrmQuery(['jobs', m.title], '/jobs', { ...(m.params || {}), ...f });
  const rows = q.data?.data || [];
  const engineers = (lk.engineers || []).filter((e) => !me?.location || String(e.location?._id || e.location) === String(me.location._id));
  const pickupBoys = engineers.filter((e) => e.userType === 'Pickup Boy');
  const deliveryBoys = engineers.filter((e) => e.userType === 'Delivery boy');
  const fieldEngs = engineers.filter((e) => e.userType === 'Engineer');

  const actionCols = useMemo(() => {
    const a = m.action;
    const btn = (title, IconC, onClick) => <button type="button" className="dms-icon-btn" title={title} aria-label={title} onClick={onClick}>{icon(IconC, title)}</button>;
    if (a === 'asp' || a === 'pickup') {
      const list = [
        { key: 'ack', label: 'Acknowledgement', sortable: false, render: (r) => (r.ackStatus === 'Pending' ? <Link className="dms-icon-btn" title="Acknowledge" to={`${B}/jobs/ack/${r._id}`}>{icon(Wrench, 'Acknowledge')}</Link> : r.ackStatus) },
        { key: 'appt', label: 'Appointment/Receive', sortable: false, render: (r) => <span>{r.visitDate ? `${fmt.dmy(r.visitDate)}/${r.visitTime || ''}` : '00-00-0000/'}<br />{r.ackStatus === 'Accepted' && isOpen(r) && btn('Visit', MapPinned, () => setModal({ kind: 'visit', job: r }))}</span> },
      ];
      if (a === 'asp') {
        list.push(
          { key: 'assign', label: 'Assign', sortable: false, render: (r) => (r.engineerName || (r.ackStatus === 'Accepted' && isOpen(r) ? <Link className="dms-icon-btn" title="Assign" to={`${B}/jobs/assign/${r._id}`}>{icon(UserPlus, 'Assign')}</Link> : 'null')) },
          C.print,
          { key: 'action', label: 'Action', sortable: false, render: (r) => {
            if (['Repair Done', 'Replacement', 'Installation Done', 'Demo Done'].includes(r.status)) return <Link className="dms-icon-btn" title="Call Confirmation" to={`${B}/jobs/handover/${r._id}`}>{icon(CheckCircle2, 'Call Confirmation')}</Link>;
            if (r.engineer && isOpen(r) && !['Request For Approval', 'SFR'].includes(r.status)) return <Link className="dms-icon-btn" title="Job Repair" to={`${B}/jobs/repair/${r._id}`}>{icon(Wrench, 'Job Repair')}</Link>;
            return '';
          } },
          C.view,
        );
      } else {
        list.push(
          { key: 'pk', label: 'Assign To pickup', sortable: false, render: (r) => (r.subStatus === 'Registered' && r.ackStatus === 'Accepted' ? btn('Assign To pickup', UserPlus, () => setModal({ kind: 'pickup', job: r })) : r.pickupBoy ? 'Assigned' : '') },
          C.print,
          { key: 'rp', label: 'Received Pickup', sortable: false, render: (r) => (r.subStatus === 'Call Assigned to pickup Boy' ? <button type="button" className="dms-btn sm" onClick={() => crm.post(`/jobs/${r._id}/pickup`, { action: 'received' }).then(() => q.refetch())}>Receive</button> : r.subStatus === 'Pickup Received' ? 'Received' : '') },
          { key: 'db', label: 'Assign To Delivery Boy', sortable: false, render: (r) => (['Repair Done', 'Replacement'].includes(r.status) && r.subStatus !== 'Issue to Delivery Boy' ? btn('Assign To Delivery Boy', UserPlus, () => setModal({ kind: 'delivery', job: r })) : r.subStatus === 'Issue to Delivery Boy' ? 'Assigned' : '') },
          { key: 'dl', label: 'Delivered', sortable: false, render: (r) => (r.subStatus === 'Issue to Delivery Boy' ? <button type="button" className="dms-btn sm" onClick={() => crm.post(`/jobs/${r._id}/pickup`, { action: 'delivered' }).then(() => q.refetch())}>Delivered</button> : r.status === 'Handover' ? 'Delivered' : '') },
        );
      }
      return list;
    }
    if (a === 'reassign') return [{ key: 'ra', label: 'Reassign Job', sortable: false, render: (r) => btn('Reassign Job', UserPlus, () => setModal({ kind: 'reassign', job: r })) }];
    if (a === 'happy') return [{ key: 'hc', label: 'Calling', sortable: false, render: (r) => (r.handover?.happyCallDone ? 'Done' : btn('Calling', CheckCircle2, () => setModal({ kind: 'happy', job: r }))) }, C.view];
    if (a === 'approve') return [{ key: 'ap', label: 'View', sortable: false, render: (r) => <span style={{ display: 'flex', gap: 6 }}>{C.view.render(r)}{r.approvalRequest?.status === 'Pending' && btn('Approve / Reject', CheckCircle2, () => setModal({ kind: 'approve', job: r }))}</span> }];
    if (a === 'status') return [{ key: 'st', label: 'View', sortable: false, render: (r) => <span style={{ display: 'flex', gap: 6 }}>{C.view.render(r)}{btn('Change Status', Pencil, () => setModal({ kind: 'status', job: r }))}</span> }];
    if (a === 'reschedule') return [{ key: 'vs', label: 'Visit Schedule', sortable: false, render: (r) => btn('Visit Schedule', MapPinned, () => setModal({ kind: 'reschedule', job: r })) }];
    if (a === 'invoice') return [{ key: 'mi', label: 'Make Invoice', sortable: false, render: (r) => <button type="button" className="dms-btn sm" onClick={() => setModal({ kind: 'invoice', job: r })}>Make Invoice</button> }];
    if (a === 'reassign-eng') return [{ key: 're', label: 'Reassign', sortable: false, render: (r) => btn('Reassign', UserPlus, () => setModal({ kind: 'eng', job: r })) }];
    if (a === 'edit') return [{ key: 'ed', label: 'View', sortable: false, render: (r) => <Link className="dms-icon-btn" title="Edit" to={`${B}/jobs/edit/${r._id}`}>{icon(Pencil, 'Edit')}</Link> }];
    return [];
  }, [m.action, q]);

  const columns = useMemo(() => cols([...m.cols, ...actionCols]), [m.cols, actionCols]);
  const close = () => { setModal(null); q.refetch(); };
  const j = modal?.job;
  return (
    <div>
      <PageTitle icon={ClipboardList}>{m.title}</PageTitle>
      <Filters filters={m.filters} onGo={setF} />
      <Toolbar><Btn variant="default" onClick={() => exportCsv(m.title, m.cols.map((c) => ({ ...c, text: c.text || ((r) => r[c.key]) })), rows)}>Export Excel</Btn></Toolbar>
      {q.error && <Alert>{crmApiError(q.error).message}</Alert>}
      <DataTable columns={columns} rows={rows} loading={q.isLoading} />
      {modal?.kind === 'visit' && <ActionModal title={`Visit ${j.jobNo}`} url={`/jobs/${j._id}/appointment`} onClose={close} defaults={{ approvedBy: me?.displayName }}
        fields={[{ n: 'visitDate', label: 'Visit Date', t: 'date', req: true }, { n: 'visitTime', label: 'Visit Time', t: 'time', req: true }, { n: 'approvedBy', label: 'Approved By', req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'reschedule' && <ActionModal title={`Reschedule ${j.jobNo}`} url={`/jobs/${j._id}/reschedule`} onClose={close}
        fields={[{ n: 'visitDate', label: 'Visit Date', t: 'date', req: true }, { n: 'visitTime', label: 'Visit Time', t: 'time', req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'pickup' && <ActionModal title={`Assign To Pickup — ${j.jobNo}`} url={`/jobs/${j._id}/pickup`} onClose={close} toBody={(v) => ({ ...v, action: 'assign-pickup' })}
        fields={[{ n: 'userId', label: 'Pickup Boy', t: 'select', o: () => o.eng(pickupBoys), req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'delivery' && <ActionModal title={`Assign To Delivery Boy — ${j.jobNo}`} url={`/jobs/${j._id}/pickup`} onClose={close} toBody={(v) => ({ ...v, action: 'assign-delivery' })}
        fields={[{ n: 'userId', label: 'Delivery Boy', t: 'select', o: () => o.eng(deliveryBoys), req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'reassign' && <ActionModal title={`Reassign Job ${j.jobNo}`} url={`/jobs/${j._id}/assign`} onClose={close}
        fields={[{ n: 'assignLocationId', label: 'Assign Location', t: 'select', o: (l) => o.loc(l.asps), req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'eng' && <ActionModal title={`Reassign ${j.jobNo}`} url={`/jobs/${j._id}/assign`} onClose={close}
        fields={[{ n: 'engineerId', label: 'Engineer Name', t: 'select', o: () => o.eng(fieldEngs), req: true }, { n: 'remark', label: 'Remark' }]} />}
      {modal?.kind === 'happy' && <ActionModal title={`Happy Calling ${j.jobNo}`} url={`/jobs/${j._id}/happy-call`} onClose={close}
        fields={[{ n: 'rating', label: 'Service Rating', t: 'select', o: [['1', 'Poor (1)'], ['2', 'Average (2)'], ['3', 'Good (3)'], ['4', 'Very Good (4)'], ['5', 'Excellent (5)']].map(([value, label]) => ({ value, label })), req: true }, { n: 'remark', label: 'Feedback', t: 'select', o: (l) => o.text(l.feedback) }]} />}
      {modal?.kind === 'approve' && <ActionModal title={`Request Approval ${j.jobNo} — ${j.approvalRequest?.requestFor || ''}`} url={`/jobs/${j._id}/approve`} onClose={close}
        fields={[{ n: 'decision', label: 'Decision', t: 'select', o: ['Approved', 'Rejected'], req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]}
        toBody={(v) => ({ ...v, status: v.decision === 'Approved' ? 'Request For Approval' : 'Pending' })} />}
      {modal?.kind === 'status' && <ActionModal title={`Job Status Change ${j.jobNo}`} url={`/jobs/${j._id}/approve`} onClose={close} defaults={{ status: j.status }}
        fields={[{ n: 'status', label: 'Status', t: 'select', o: lk.jobStatuses || ['Open', 'Asigned', 'Pending', 'PNA', 'Repair Done', 'Handover', 'Cancel', 'RWR'], req: true }, { n: 'remark', label: 'Remark', t: 'textarea', req: true }]} />}
      {modal?.kind === 'invoice' && <ActionModal title={`Make Invoice ${j.jobNo}`} url={`/jobs/${j._id}/invoice`} onClose={close}
        fields={[{ n: 'serviceCharge', label: 'Service Charge', t: 'number' }]} />}
    </div>
  );
}

/* ───────────── Job screens ───────────── */
function useJob() {
  const { id } = useParams();
  const q = useCrmQuery(['job', id], `/jobs/${id}`);
  return { id, job: q.data?.data, q };
}

export function JobViewPage() {
  const { job, q } = useJob();
  const me = useMe();
  const [v, setV] = useState({ remark: '', priority: '' });
  const save = useCrmMutation((b) => crm.post(`/jobs/${job._id}/priority`, b), { onSuccess: () => { setV({ remark: '', priority: '' }); q.refetch(); } });
  const est = useCrmMutation((b) => crm.post(`/jobs/${job._id}/estimate`, b), { onSuccess: () => q.refetch() });
  if (q.error) return <Alert>{crmApiError(q.error).message}</Alert>;
  if (!job) return <div className="dms-loading">Loading…</div>;
  return (
    <div>
      <PageTitle icon={ClipboardList}>Complaint Details</PageTitle>
      <h3 style={{ margin: '0 0 10px' }}>Job No.- {job.jobNo}</h3>
      <JobPanels job={job} sections={['customer', 'product', 'observation', 'repair', 'history']} />
      {job.status === 'EP' && job.estimate?.status === 'Pending' && (
        <Panel title="Estimate">
          <KV pairs={[['Part Cost', fmt.money(job.estimate.partCost)], ['Tax Amt', fmt.money(job.estimate.taxAmt)], ['Service Charge', fmt.money(job.estimate.serviceCharge)], ['Total Amt', fmt.money(job.estimate.totalAmt)]]} />
          <div className="dms-actions"><button type="button" className="dms-btn" onClick={() => est.mutate({ decision: 'Accept' })}>Estimation Accept</button><Btn variant="default" onClick={() => est.mutate({ decision: 'Refuse' })}>Estimation Refused</Btn></div>
        </Panel>
      )}
      {['Admin', 'Call Center', 'ASP'].includes(me?.crmRole) && (
        <Panel title="Priority">
          <div className="dms-form">
            <Field label="Remark"><TextArea value={v.remark} onChange={(e) => setV((s) => ({ ...s, remark: e.target.value }))} /></Field>
            <Field label="Priority"><Select value={v.priority} placeholder="--Select Proiority--" options={['Normal', 'High']} onChange={(e) => setV((s) => ({ ...s, priority: e.target.value }))} /></Field>
          </div>
          <div className="dms-actions"><BackBtn /><button type="button" className="dms-btn" disabled={!v.priority} onClick={() => save.mutate(v)}>Save</button>
            <a className="dms-btn default" href={`${B}/print/job/${job._id}`} target="_blank" rel="noreferrer">Print Job Sheet</a></div>
        </Panel>
      )}
    </div>
  );
}

function JobForm({ title, sections, fields, url, toBody, defaults = {}, saveLabel = 'Update', children, extraValid }) {
  const { job, q } = useJob();
  const nav = useNavigate();
  const [v, setV] = useState(defaults);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});
  const save = useCrmMutation((b) => crm.post(url(job), b), { onSuccess: () => nav(-1) });
  if (q.error) return <Alert>{crmApiError(q.error).message}</Alert>;
  if (!job) return <div className="dms-loading">Loading…</div>;
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    for (const f of fields) if (f.req && (!f.when || f.when(v, job)) && (v[f.n] === undefined || v[f.n] === '')) er[f.n] = 'Required';
    const extra = extraValid?.(v, job);
    setErrors(er); setMsg(extra || (Object.keys(er).length ? 'Please fill all required (*) fields.' : ''));
    if (Object.keys(er).length || extra) return;
    save.mutate(toBody ? toBody(v, job) : v, { onError: (err) => setMsg(crmApiError(err).message) });
  };
  return (
    <form onSubmit={submit} noValidate>
      <PageTitle icon={Wrench}>{title}</PageTitle>
      <h3 style={{ margin: '0 0 10px' }}>Job No.- {job.jobNo}</h3>
      <JobPanels job={job} sections={sections} />
      <Panel title={title}>
        <Alert>{msg}</Alert>
        <FormGrid fields={fields.filter((f) => !f.when || f.when(v, job))} v={v} setV={setV} errors={errors} />
        {children?.(v, setV, job)}
      </Panel>
      <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>{saveLabel}</button><BackBtn /></div>
    </form>
  );
}

export function JobAckPage() {
  return <JobForm title="Job Acknowledged" sections={['customer', 'product']} url={(j) => `/jobs/${j._id}/acknowledge`}
    fields={[{ n: 'acknowledge', label: 'Acknowledge', t: 'select', o: ['Accepted', 'Rejected'], req: true }, { n: 'remark', label: 'Remarks' }]} />;
}

export function JobAssignPage() {
  const me = useMe();
  const lk = useLk();
  const engs = (lk.engineers || []).filter((e) => e.userType === 'Engineer' && (!me?.location || String(e.location?._id || e.location) === String(me.location._id)));
  return <JobForm title="Job Assign" sections={['customer', 'product']} url={(j) => `/jobs/${j._id}/assign`}
    fields={[{ n: 'engineerId', label: 'Engineer Name', t: 'select', o: () => o.eng(engs), req: true }, { n: 'remark', label: 'Remark' }]} />;
}

export function JobHandoverPage() {
  return <JobForm title="Call Confirmation" saveLabel="Confirm" sections={['customer', 'product', 'observation', 'history', 'repair']} url={(j) => `/jobs/${j._id}/handover`}
    fields={[{ n: 'confirmBy', label: 'Confirm By', req: true }, { n: 'contactNo', label: 'Contact No.', req: true }, { n: 'remark', label: 'Remark', req: true },
      { n: 'rating', label: 'Service Rating', t: 'select', ph: '--Select Feedback--', o: [['1', 'Poor (1)'], ['2', 'Average (2)'], ['3', 'Good (3)'], ['4', 'Very Good (4)'], ['5', 'Excellent (5)']].map(([value, label]) => ({ value, label })), req: true }]} />;
}

const REPAIR_STATUSES = ['Closed Without Repair', 'Estimate Pending For Cost', 'Pending', 'Repair Done', 'Request For Approval', 'Spare Part Unavailable', 'Cancel'];

export function JobRepairPage() {
  const lk = useLk();
  const { job } = useJob();
  const engStock = useCrmQuery(['eng-stock', job?.engineer?._id], '/engineer-stock', { engineer: job?.engineer?._id }, { enabled: Boolean(job?.engineer?._id) });
  const locStock = useCrmQuery(['loc-stock'], '/stock');
  const brandId = job?.brand?._id || job?.brand;
  const productId = job?.product?._id || job?.product;
  const modelId = job?.model?._id || job?.model;
  const byBP = (arr) => (arr || []).filter((x) => (!x.brand || String(x.brand?._id || x.brand) === String(brandId)) && (!x.product || String(x.product?._id || x.product) === String(productId)));
  const faults = byBP(lk.fault);
  const repairs = byBP(lk.repairAction);
  const parts = (lk.parts || []).filter((p) => String(p.brand?._id || p.brand) === String(brandId) && (!(p.models || []).length || (p.models || []).some((m) => String(m._id || m) === String(modelId))));
  const avl = (pid) => {
    const e = (engStock.data?.data || []).find((x) => String(x.part?._id) === pid)?.fresh || 0;
    const l = (locStock.data?.data || []).find((x) => String(x.part?._id) === pid)?.fresh || 0;
    return e + l;
  };
  const statuses = job?.approvalRequest?.status === 'Approved' && job?.approvalRequest?.requestFor === 'Replacement' ? [...REPAIR_STATUSES, 'Replacement'] : REPAIR_STATUSES;
  const done = (s) => ['Repair Done', 'Replacement'].includes(s);
  return (
    <JobForm title="Job Repair" sections={['customer', 'product', 'observation']} url={(j) => `/jobs/${j._id}/repair`} saveLabel="Save" defaults={{ rows: [{}], pend: [{}], est: [{}] }}
      fields={[
        { n: 'repairStatus', label: 'Repair Status', t: 'select', ph: '--Select Repair Result--', o: statuses, req: true },
        { n: 'remark', label: 'Repair Remark', t: 'textarea' },
        { n: 'closeType', label: 'Close Type', t: 'select', ph: '--Select Close Type--', o: ['Manufacturing date', 'Invoice', 'Warranty Card', 'Serial No', 'Nothing'], req: true, when: (v) => done(v.repairStatus) },
        { n: 'closeDocNo', label: 'Document No.', when: (v) => done(v.repairStatus) && v.closeType && v.closeType !== 'Nothing', req: true },
        { n: 'customerReadyToPay', label: 'Customer Ready to Pay', t: 'select', ph: '--Please select--', o: ['Yes', 'No'], when: (v) => v.repairStatus === 'Estimate Pending For Cost' },
        { n: 'pendingReason', label: 'Pending Reason', t: 'select', ph: '--Select Pending Reason--', o: (l) => o.text(l.pendingReason), req: true, when: (v) => v.repairStatus === 'Pending' },
        { n: 'closeReason', label: 'Close Reason', t: 'select', ph: '--Select Close Reason--', o: ['Repair At Field', 'Customer Refused', 'Product Not Repairable', 'Duplicate Call'], req: true, when: (v) => ['Closed Without Repair', 'Cancel'].includes(v.repairStatus) },
        { n: 'requestFor', label: 'Request For', t: 'select', ph: '--Select Request--', o: ['Deviation', 'Part Discount', 'Replacement', 'Call cancellation', 'Warranty Period Relaxation'], req: true, when: (v) => v.repairStatus === 'Request For Approval' },
        { n: 'serviceCharge', label: 'Service Charge', t: 'number', when: (v) => v.repairStatus === 'Estimate Pending For Cost' },
      ]}
      extraValid={(v) => {
        if (done(v.repairStatus) && !v.rows.some((r) => r.faultCode && r.repairCode)) return 'Select Defect Code and Repair Code';
        if (v.repairStatus === 'Spare Part Unavailable' && !v.pend.some((r) => r.part)) return 'Select at least one pending part';
        if (v.repairStatus === 'Estimate Pending For Cost' && !v.est.some((r) => r.part)) return 'Select at least one estimate part';
        const over = v.rows.find((r) => r.part && Number(r.qty || 1) > avl(r.part));
        if (done(v.repairStatus) && over) return 'Consumed quantity is more than the available stock';
        return '';
      }}
      toBody={(v, j) => {
        const status = v.repairStatus === 'Repair Done' && ['Installation', 'Re-installation'].includes(j.callType) ? 'Installation Done' : v.repairStatus === 'Repair Done' && j.callType === 'Demo' ? 'Demo Done' : v.repairStatus;
        return {
          repairStatus: status, remark: v.remark, closeType: v.closeType, closeDocNo: v.closeDocNo, customerReadyToPay: v.customerReadyToPay === 'Yes', pendingReason: v.pendingReason, closeReason: v.closeReason, requestFor: v.requestFor,
          repairDetails: v.rows.filter((r) => r.faultCode).map((r) => {
            const fa = faults.find((x) => x.code === r.faultCode); const ra = repairs.find((x) => x.code === r.repairCode);
            return { faultCode: r.faultCode, faultName: fa?.name, repairCode: r.repairCode, repairName: ra?.name, part: r.part || undefined, qty: Number(r.qty || 1) };
          }),
          pendingParts: v.pend.filter((r) => r.part).map((r) => ({ part: r.part, qty: Number(r.qty || 1) })),
          estimateParts: v.est.filter((r) => r.part).map((r) => {
            const p = parts.find((x) => x._id === r.part); const cost = Number(r.cost || p?.customerPrice || 0); const qty = Number(r.qty || 1); const tp = Number(r.taxPct ?? 18);
            const taxAmt = Math.round(cost * qty * tp) / 100;
            return { part: r.part, partcode: p?.partcode, partName: p?.partName, qty, cost, taxPct: tp, taxAmt, total: cost * qty + taxAmt };
          }),
          serviceCharge: Number(v.serviceCharge || 0),
        };
      }}>
      {(v, setV) => {
        const setArr = (k, i, x) => setV((s) => ({ ...s, [k]: s[k].map((r, j) => (j === i ? { ...r, ...x } : r)) }));
        const add = (k) => <Btn size="sm" onClick={() => setV((s) => ({ ...s, [k]: [...s[k], {}] }))}>Add Row</Btn>;
        if (done(v.repairStatus)) {
          return (
            <div className="dms-table-wrap"><table className="dms-table">
              <thead><tr><th>Defect Code</th><th>Repair Code</th><th>Part</th><th>Avl Qty</th><th>Qty</th><th>Part Price</th><th>Swap IMEI 1</th><th>Swap IMEI 2</th></tr></thead>
              <tbody>{v.rows.map((r, i) => (
                <tr key={i}>
                  <td><Select value={r.faultCode || ''} placeholder="Select Defect Code" options={faults.map((x) => ({ value: x.code, label: `${x.name} (${x.code})` }))} onChange={(e) => setArr('rows', i, { faultCode: e.target.value })} /></td>
                  <td><Select value={r.repairCode || ''} placeholder="Select Repair code" options={repairs.map((x) => ({ value: x.code, label: `${x.name} (${x.code})` }))} onChange={(e) => setArr('rows', i, { repairCode: e.target.value })} /></td>
                  <td><Select value={r.part || ''} placeholder="Select Part" options={o.part(parts)} onChange={(e) => setArr('rows', i, { part: e.target.value })} /></td>
                  <td className="r">{r.part ? avl(r.part) : ''}</td>
                  <td><Input type="number" min="1" style={{ width: 70 }} value={r.qty || ''} onChange={(e) => setArr('rows', i, { qty: e.target.value })} /></td>
                  <td className="r">{r.part ? fmt.money(parts.find((p) => p._id === r.part)?.customerPrice) : ''}</td>
                  <td><Input value={r.swap1 || ''} onChange={(e) => setArr('rows', i, { swap1: e.target.value })} /></td>
                  <td><Input value={r.swap2 || ''} onChange={(e) => setArr('rows', i, { swap2: e.target.value })} /></td>
                </tr>
              ))}</tbody>
            </table>{add('rows')}</div>
          );
        }
        if (v.repairStatus === 'Spare Part Unavailable') {
          return (
            <div className="dms-table-wrap"><table className="dms-table"><thead><tr><th>Pending Part</th><th>Qty</th><th>Available</th></tr></thead>
              <tbody>{v.pend.map((r, i) => <tr key={i}><td><Select value={r.part || ''} placeholder={`Select Pending Part-${i + 1}`} options={o.part(parts)} onChange={(e) => setArr('pend', i, { part: e.target.value })} /></td>
                <td><Input type="number" min="1" style={{ width: 80 }} value={r.qty || ''} onChange={(e) => setArr('pend', i, { qty: e.target.value })} /></td><td className="r">{r.part ? avl(r.part) : ''}</td></tr>)}</tbody>
            </table>{add('pend')}</div>
          );
        }
        if (v.repairStatus === 'Estimate Pending For Cost') {
          const tot = v.est.reduce((s, r) => { const p = parts.find((x) => x._id === r.part); const c = Number(r.cost || p?.customerPrice || 0) * Number(r.qty || 1); return s + c + (c * Number(r.taxPct ?? 18)) / 100; }, 0);
          return (
            <div className="dms-table-wrap"><table className="dms-table"><thead><tr><th>Estimate Part</th><th>Qty</th><th>Cost</th><th>Tax %</th></tr></thead>
              <tbody>{v.est.map((r, i) => <tr key={i}><td><Select value={r.part || ''} placeholder="Select Estimate Part" options={o.part(parts)} onChange={(e) => setArr('est', i, { part: e.target.value, cost: parts.find((p) => p._id === e.target.value)?.customerPrice })} /></td>
                <td><Input type="number" min="1" style={{ width: 70 }} value={r.qty || ''} onChange={(e) => setArr('est', i, { qty: e.target.value })} /></td>
                <td><Input type="number" min="0" style={{ width: 100 }} value={r.cost ?? ''} onChange={(e) => setArr('est', i, { cost: e.target.value })} /></td>
                <td><Input type="number" min="0" style={{ width: 70 }} value={r.taxPct ?? 18} onChange={(e) => setArr('est', i, { taxPct: e.target.value })} /></td></tr>)}</tbody>
            </table>{add('est')}<p style={{ textAlign: 'right' }}><b>Part Cost + Tax:</b> ₹ {fmt.money(tot)} &nbsp; <b>Total Amt:</b> ₹ {fmt.money(tot + Number(v.serviceCharge || 0))}</p></div>
          );
        }
        return null;
      }}
    </JobForm>
  );
}

export function JobEditPage() {
  const { job, q } = useJob();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const save = useCrmMutation((b) => crm.put(`/jobs/${job._id}`, b), { onSuccess: () => nav(-1) });
  if (!job) return q.error ? <Alert>{crmApiError(q.error).message}</Alert> : <div className="dms-loading">Loading…</div>;
  const val = v || { ...job, purchaseDate: fmt.date(job.purchaseDate), installationDate: fmt.date(job.installationDate), warrantyEndDate: fmt.date(job.warrantyEndDate) };
  const fields = [
    { n: 'customerName', label: 'Customer Name', req: true }, { n: 'contactNo', label: 'Contact No.', req: true }, { n: 'altContactNo', label: 'Alternate Contact No.' }, { n: 'email', label: 'Email' },
    { n: 'address', label: 'Address', t: 'textarea' }, { n: 'landmark', label: 'Landmark' }, { n: 'pincode', label: 'Pincode' }, { n: 'serialNo', label: 'Serial No' },
    { n: 'purchaseDate', label: 'Bill Purchase Date', t: 'date' }, { n: 'installationDate', label: 'Date Of Installation', t: 'date' }, { n: 'warrantyEndDate', label: 'Warranty End Date', t: 'date' },
    { n: 'warrantyStatus', label: 'Warranty status', t: 'select', o: ['IN', 'OUT'] }, { n: 'dealerName', label: 'Dealer Name' }, { n: 'invoiceNo', label: 'Invoice No' },
    { n: 'editRemark', label: 'Edit Remark', t: 'textarea' },
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(val); }}>
      <PageTitle icon={Pencil}>JOB DETAILS EDIT</PageTitle>
      <h3 style={{ margin: '0 0 10px' }}>Job No.- {job.jobNo}</h3>
      <FormGrid fields={fields} v={val} setV={(fn) => setV((s) => (typeof fn === 'function' ? fn(s || val) : fn))} />
      <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Update</button><BackBtn /></div>
    </form>
  );
}

/* ───────────── Job sheet print (Customer copy + Service centre copy) ───────────── */
const TERMS = [
  'The repair estimate will be provided on request and the charges will be 25% of labour charge, if the estimate is not approved.',
  'An advance of 50% of the approved estimate shall be collected before undertaking the repairs.',
  'All repairs (except for imported, tampered, mishandled products) are guaranteed for labour for one month from date of delivery.',
  'Imported products are accepted for repairs subject to availability of spare parts.',
  'Defective components for out warranty jobs shall be returned along with the repaired equipment.',
  'Reasonable care will be taken to the equipment given for repairs. However, we are not liable for any loss or damage arising from accident, fire, theft or any other cause beyond our control.',
  "Equipment's remaining uncollected for more than 30 days from the date of intimation for collection shall be disposed at the customer's risk.",
  'Equipment will be delivered only against this receipt.',
  'I agree to receive SMS notifications on my mobile related to the given Equipment.',
];

function Barcode({ value }) {
  // Code-39-like visual bars derived from the job number (scanner-agnostic visual reference)
  const bits = String(value).split('').flatMap((ch) => { const c = ch.charCodeAt(0); return [1, (c >> 1) & 1, 1, (c >> 2) & 1, (c >> 3) & 1, 0, 1, c & 1, 0]; });
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={bits.length * 2} height="46" aria-label={`Barcode ${value}`}>{bits.map((b, i) => (b ? <rect key={i} x={i * 2} y="0" width="2" height="46" fill="#000" /> : null))}</svg>
      <div style={{ fontSize: 11 }}>{value}</div>
    </div>
  );
}

function Copy({ job, service }) {
  const l = job.assignLocation || {};
  const voc = [...(job.vocs || []), job.vocText].filter(Boolean).join(' / ');
  const row = (a, b, c, d) => <tr><td className="k">{a}</td><td>{b}</td><td className="k">{c}</td><td>{d}</td></tr>;
  return (
    <div className="rp-copy">
      <div className="rp-hd">
        <div className="rp-logo"><b>HAION</b><span>CRM</span></div>
        <Barcode value={job.jobNo} />
        <div className="rp-asc">{l.name}<br />{l.address || ''}<br />City:{l.city},<br />Pincode:{l.pincode}<br />{l.email}<br />{l.phone}<br />Working time :- 10:00 AM TO 7:00 PM</div>
      </div>
      <h3 className="rp-ttl">{service ? 'SERVICE CENTRE COPY' : 'CUSTOMER COPY'}</h3>
      <table className="rp-t"><tbody>
        {row('Job No.', job.jobNo, 'Create Date', fmt.dt(job.openDate))}
        <tr><td colSpan={4} className="sec">CUSTOMER DETAIL</td></tr>
        {row('Customer Name', job.customerName, 'Contact No.', job.contactNo)}
        {row('Alternate No.', job.altContactNo, 'Email', job.email)}
        {row('Address', job.address, 'Pincode', job.pincode)}
        {!service && row('Recipient Name', job.handover?.confirmBy, 'Contact No.', job.handover?.contactNo)}
        <tr><td colSpan={4} className="sec">PRODUCT DETAIL</td></tr>
        {row('Product', job.productName, 'Brand', job.brandName)}
        {row('Model', job.modelName, 'Accessory', (job.accessories || []).join(', '))}
        {row('Serial No', job.serialNo, '', '')}
        {row('Job Type', job.callSource, 'Job For', job.callType)}
        {row('Purchase Date', fmt.date(job.purchaseDate), 'Warranty Status', job.warrantyStatus)}
        {!service && <tr><td colSpan={4} className="sec">PROBLEM REPORTED</td></tr>}
        <tr><td className="k">{service ? 'Defect reported' : 'Defect Reported (As per Customer)'}</td><td colSpan={3}>{voc}</td></tr>
        <tr><td className="k">Remark</td><td colSpan={3}>{job.remark}</td></tr>
        {service && <tr><td colSpan={4} className="sec">REPAIR STATUS</td></tr>}
        {service && <tr><td className="k">Fault Code</td><td>{(job.repairDetails || []).map((d) => d.faultName || d.faultCode).join(', ')}</td><td className="k">Repair Code</td><td>{(job.repairDetails || []).map((d) => d.repairName || d.repairCode).join(', ')}</td></tr>}
        {service && <tr><td className="k">Part Consume</td><td colSpan={3}>{(job.repairDetails || []).filter((d) => d.partcode).map((d) => `${d.partName} (${d.partcode}) x${d.qty}`).join(', ')}</td></tr>}
        {service && <tr><td className="k">Delivery Remark:</td><td colSpan={3}>{job.handover?.remark}</td></tr>}
        {service && <tr><td className="k">Billing (applicable for chargeable job only)</td><td colSpan={3}>Collected</td></tr>}
      </tbody></table>
      {!service && <div className="rp-terms"><b>Terms &amp; Conditions:</b><ol>{TERMS.map((t) => <li key={t}>{t}</li>)}</ol></div>}
      <div className="rp-sign"><span>____________________________<br />(Customer signature with full name)</span><span>____________________________<br />({service ? 'Location' : 'AVSC'} signature)</span></div>
      {service && <p style={{ fontSize: 12 }}>Unit has been repaired to my satisfaction</p>}
      <p style={{ fontSize: 12 }}>{service ? 'Receipt Date & Time' : 'Date & Time'} ____________________________</p>
    </div>
  );
}

export function JobPrintPage() {
  const { job, q } = useJob();
  if (q.error) return <p>{crmApiError(q.error).message}</p>;
  if (!job) return <p>Loading…</p>;
  return (
    <div className="crm-print">
      <style>{`
        .crm-print{max-width:820px;margin:0 auto;padding:16px;font:12px Arial,sans-serif;color:#000;background:#fff}
        .crm-print .rp-copy{border:1px solid #000;margin-bottom:22px;padding:10px;page-break-inside:avoid}
        .crm-print .rp-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .crm-print .rp-logo b{font-size:22px;font-style:italic}.crm-print .rp-logo span{font-size:22px;color:#22a84a;font-weight:700}
        .crm-print .rp-asc{font-size:11.5px;line-height:1.45}
        .crm-print .rp-ttl{text-align:center;text-decoration:underline;font-family:serif;margin:8px 0}
        .crm-print table.rp-t{width:100%;border-collapse:collapse}.crm-print .rp-t td{border:1px solid #000;padding:5px 6px}
        .crm-print .rp-t td.k{font-weight:700;width:18%}.crm-print .rp-t td.sec{font-weight:700;font-size:13px;background:#f4f4f4}
        .crm-print .rp-terms ol{margin:4px 0 0 18px;padding:0}.crm-print .rp-terms li{margin:2px 0}
        .crm-print .rp-sign{display:flex;justify-content:space-between;margin-top:26px;font-size:11.5px;text-align:center}
        .crm-print .no-print{text-align:center;margin-bottom:10px}
        @media print{.crm-print .no-print{display:none}}
      `}</style>
      <div className="no-print"><button type="button" className="dms-btn" onClick={() => window.print()}>Print</button></div>
      <Copy job={job} />
      <Copy job={job} service />
    </div>
  );
}
