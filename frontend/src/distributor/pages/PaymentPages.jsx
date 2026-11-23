import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError, fmt } from '../api';
import { PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, TextArea, Alert, Panel, KV, Status, ViewLink, PrintLink, CancelBtn, Modal, locOpt } from '../components/ui';

const CFG = {
  RECEIPT: { title: 'Payment List', add: 'Add New Payment', base: '/distributor/payment/receive' },
  ADJUSTMENT: { title: 'A/C Adjustment', add: 'Add A/C Adjustment', base: '/distributor/payment/adjustment' },
};

export function PaymentList({ kind = 'RECEIPT', approval }) {
  const list = useListState();
  const { data, isFetching } = useDmsQuery(`pay-${kind}-${approval}`, '/payments', { ...list.params, kind, ...(approval ? { queue: 'approval' } : {}) });
  const [conf, setConf] = useState(null);
  const cancel = useDmsMutation((id) => dms.post(`/payments/${id}/cancel`, {}));
  const cfg = CFG[kind];
  return (
    <>
      <PageTitle icon={Briefcase}>{approval ? 'Payment Approval List' : cfg.title}</PageTitle>
      {!approval && <Toolbar><Btn to={`${cfg.base}/new`}>{cfg.add}</Btn></Toolbar>}
      <DataTable loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps}
        columns={[
          { key: '#', label: 'S.No' },
          { key: 'f', label: 'From Location', render: (r) => `${r.fromLocation?.name},${r.fromLocation?.city}` },
          { key: 't', label: 'To Location', render: (r) => `${r.toLocation?.name},${r.toLocation?.city}` },
          { key: 'docNo', label: 'Document No' },
          { key: 'amount', label: 'Amount', align: 'r', render: (r) => fmt.money(r.amount) },
          { key: 'paymentDate', label: 'Payment Date', render: (r) => fmt.date(r.paymentDate) },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          approval
            ? { key: 'ap', label: 'Approve', sortable: false, align: 'c', render: (r) => <Btn size="sm" to={`/distributor/payment/${r._id}/approve`}>Approve</Btn> }
            : kind === 'RECEIPT'
              ? { key: 'v', label: 'View/Edit/Delete', sortable: false, align: 'c', render: (r) => <span className="dms-row-acts"><ViewLink to={`/distributor/payment/${r._id}`} />{r.status === 'PFA' && <CancelBtn onClick={() => setConf(r)} />}</span> }
              : { key: 'v', label: 'View', sortable: false, align: 'c', render: (r) => <ViewLink to={`/distributor/payment/${r._id}`} /> },
          ...(!approval && kind !== 'RECEIPT' ? [{ key: 'p', label: 'Print', sortable: false, align: 'c', render: (r) => <PrintLink to={`/distributor/print/payment/${r._id}`} /> }] : []),
        ]} />
      <Modal open={Boolean(conf)} title="Cancel Payment" onClose={() => setConf(null)}
        footer={<><Btn variant="danger" onClick={() => cancel.mutate(conf._id, { onSuccess: () => setConf(null) })}>Yes, Cancel</Btn><Btn variant="default" onClick={() => setConf(null)}>Close</Btn></>}>
        Cancel payment <b>{conf?.docNo}</b> of {fmt.money(conf?.amount)}?
      </Modal>
    </>
  );
}

export function PaymentForm({ kind = 'RECEIPT' }) {
  const nav = useNavigate();
  const { data } = useLookups();
  const lk = data?.data;
  const cfg = CFG[kind];
  const [v, setV] = useState({ fromLocation: '', toLocation: '', adjustType: '', payMode: '', bankName: '', bankBranch: '', ddChequeNo: '', ddChequeDate: '', receiptNo: '', transactionId: '', amount: '', paymentDate: fmt.date(new Date()), remark: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const save = useDmsMutation((b) => dms.post('/payments', b), { onSuccess: () => nav(cfg.base) });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const bankish = ['BANK', 'CHEQUE'].includes(v.payMode);
  const from = (lk?.allLocations || []).find((l) => l._id === v.fromLocation);
  const toOptions = (lk?.allLocations || []).filter((l) => l._id !== v.fromLocation);
  return (
    <>
      <PageTitle icon={Briefcase}>{kind === 'ADJUSTMENT' ? 'Account Adjust' : 'Payment Receive'}</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={(e) => { e.preventDefault(); setErrors({}); setMsg(''); save.mutate({ ...v, kind, amount: Number(v.amount) }, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } }); }}>
        <div className="dms-form">
          <Field label="From Location" required error={errors.fromLocation}>
            <Select required value={v.fromLocation} options={(lk?.locations || []).map(locOpt)} onChange={(e) => { const l = (lk?.allLocations || []).find((x) => x._id === e.target.value); setV({ ...v, fromLocation: e.target.value, toLocation: l?.parent || '' }); }} />
          </Field>
          <Field label="To Location" required error={errors.toLocation}>
            <Select required value={v.toLocation} options={toOptions.map(locOpt)} onChange={set('toLocation')} />
            {from && !from.parent && <span className="dms-muted">Selected location has no parent; choose the receiver.</span>}
          </Field>
          {kind === 'ADJUSTMENT' && <Field label="Adjustment Type" required error={errors.adjustType}><Select required value={v.adjustType} options={[{ value: 'CR', label: 'CR (credit the account)' }, { value: 'DR', label: 'DR (debit the account)' }]} onChange={set('adjustType')} /></Field>}
          <Field label="Payment Mode" required error={errors.payMode}><Select required value={v.payMode} options={['BANK', 'CASH', 'PAYTM', 'CHEQUE', 'OTHER']} onChange={set('payMode')} /></Field>
          <Field label="Bank Name" required={bankish} error={errors.bankName}><Input required={bankish} value={v.bankName} onChange={set('bankName')} /></Field>
          <Field label="Bank Branch/IFSC Code"><Input value={v.bankBranch} onChange={set('bankBranch')} /></Field>
          <Field label="DD/Cheque No" required={v.payMode === 'CHEQUE'} error={errors.ddChequeNo}><Input required={v.payMode === 'CHEQUE'} value={v.ddChequeNo} onChange={set('ddChequeNo')} /></Field>
          <Field label="DD/Cheque Date"><Input type="date" value={v.ddChequeDate} onChange={set('ddChequeDate')} /></Field>
          <Field label="Bank Receipt No/Ref No."><Input value={v.receiptNo} onChange={set('receiptNo')} /></Field>
          <Field label="Transaction Id" required={['BANK', 'PAYTM'].includes(v.payMode)} error={errors.transactionId}><Input required={['BANK', 'PAYTM'].includes(v.payMode)} value={v.transactionId} onChange={set('transactionId')} /></Field>
          <Field label="Receiving Amount" required error={errors.amount}><Input type="number" step="any" min="0.01" required value={v.amount} onChange={set('amount')} /></Field>
          <Field label="Payment Date" required><Input type="date" required value={v.paymentDate} onChange={set('paymentDate')} /></Field>
          <Field label="Remark" full><TextArea value={v.remark} onChange={set('remark')} /></Field>
        </div>
        <div className="dms-actions"><button type="submit" className="dms-btn" disabled={save.isPending}>Save</button><BackBtn to={cfg.base} /></div>
      </form>
    </>
  );
}

function PaymentInfo({ p }) {
  return (
    <Panel title="Payment Information">
      <KV pairs={[
        ['From Location', `${p.fromLocation?.name},${p.fromLocation?.city},${p.fromLocation?.state}`], ['To Location', `${p.toLocation?.name},${p.toLocation?.city},${p.toLocation?.state}`],
        ['Document No.', p.docNo], ['Amount', fmt.money(p.amount)], ['Received Amount', fmt.money(p.receivedAmount)], ['Status', <Status key="s" value={p.status} />],
        ['Payment Mode', p.payMode], ['Payment Date', fmt.date(p.paymentDate)], ['Bank Name', p.bankName], ['Bank Branch', p.bankBranch],
        ['DD/Cheque No', p.ddChequeNo], ['DD/Cheque Date', fmt.date(p.ddChequeDate)], ['Receipt/Ref No.', p.receiptNo], ['Transaction Id', p.transactionId],
        ['Remark', p.remark], ['Adjustment Type', p.adjustType], ['Entry By', p.entryBy], ['Entry Date & Time', fmt.dt(p.createdAt)],
        ['Approve By', p.approveBy], ['Approve Date & Time', fmt.dt(p.approveAt)], ['Approve Remark', p.approveRemark], ['', ''],
      ]} />
    </Panel>
  );
}

export function PaymentView() {
  const { id } = useParams();
  const { data, isLoading, error } = useDmsQuery('pay-one', `/payments/${id}`);
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  if (error) return <Alert>{apiError(error).message}</Alert>;
  return (<><PageTitle icon={Briefcase}>Payment Details</PageTitle><PaymentInfo p={data.data} /><div className="dms-actions"><BackBtn /></div></>);
}

export function PaymentApprove() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useDmsQuery('pay-one', `/payments/${id}`);
  const [v, setV] = useState({ receivedAmount: '', action: '', remark: '' });
  const [msg, setMsg] = useState('');
  const act = useDmsMutation((b) => dms.post(`/payments/${id}/approve`, b), { onSuccess: () => nav('/distributor/payment/approval') });
  if (isLoading) return <div className="dms-loading">Loading…</div>;
  const p = data.data;
  return (
    <>
      <PageTitle icon={Briefcase}>Payment Details</PageTitle>
      <PaymentInfo p={p} />
      <Panel title="Payment Approval">
        <Alert>{msg}</Alert>
        {p.status === 'PFA' ? (
          <form onSubmit={(e) => { e.preventDefault(); setMsg(''); act.mutate({ ...v, receivedAmount: Number(v.receivedAmount || p.amount) }, { onError: (err) => setMsg(apiError(err).message) }); }}>
            <div className="dms-form">
              <Field label="Received Amount" required><Input type="number" step="any" min="0" max={p.amount} required placeholder={fmt.money(p.amount)} value={v.receivedAmount} onChange={(e) => setV({ ...v, receivedAmount: e.target.value })} /></Field>
              <Field label="Action" required><Select required value={v.action} options={['Approve', 'Reject']} onChange={(e) => setV({ ...v, action: e.target.value })} /></Field>
              <Field label="Remark" required full><TextArea required value={v.remark} onChange={(e) => setV({ ...v, remark: e.target.value })} /></Field>
            </div>
            <div className="dms-actions"><button type="submit" className="dms-btn" disabled={act.isPending}>Save</button><BackBtn to="/distributor/payment/approval" /></div>
          </form>
        ) : <p>Already <b>{p.status}</b>.</p>}
      </Panel>
    </>
  );
}
