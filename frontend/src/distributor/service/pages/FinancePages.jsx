/* Accounts, payments, expenses, CN, reconciliation and claims (reference My Account / Account / Approvals menus). */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet, Landmark, ShieldCheck, Receipt, Printer, Truck } from 'lucide-react';
import {
  B, useLk, useMe, o, cols, fmt, crm, crmApiError, useCrmQuery, useCrmMutation, ListPage, ActionForm, PageTitle, Toolbar, Btn, DataTable, Field, Input, Select, TextArea, Alert, MONTHS, YEARS, Filters,
} from '../kit';
import { Modal } from '../../components/ui';

const DATE = { t: 'daterange', label: 'Date Range' };
const inRange = (d, f) => (!f.from || new Date(d) >= new Date(f.from)) && (!f.to || new Date(d) <= new Date(`${f.to}T23:59:59`));
const money = (k, label) => ({ key: k, label, render: (r) => fmt.money(r[k]), text: (r) => fmt.money(r[k]) });

function SimpleModal({ title, fields, onSave, onClose, defaults = {} }) {
  const [v, setV] = useState(defaults);
  const [msg, setMsg] = useState('');
  return (
    <Modal open title={title} onClose={onClose} footer={<><Btn variant="default" onClick={onClose}>Close</Btn><button type="button" className="dms-btn" onClick={() => {
      const miss = fields.find((f) => f.req && !v[f.n]); if (miss) { setMsg(`${miss.label} is required`); return; }
      onSave(v).then(onClose).catch((e) => setMsg(crmApiError(e).message));
    }}>Save</button></>}>
      <Alert>{msg}</Alert>
      <div className="dms-form">{fields.map((f) => (
        <Field key={f.n} label={f.label} required={f.req}>
          {f.o ? <Select value={v[f.n] || ''} options={f.o} onChange={(e) => setV((s) => ({ ...s, [f.n]: e.target.value }))} /> : <Input type={f.t || 'text'} value={v[f.n] || ''} readOnly={f.ro} onChange={(e) => setV((s) => ({ ...s, [f.n]: e.target.value }))} />}
        </Field>
      ))}</div>
    </Modal>
  );
}

/* ───────────── Expense ───────────── */
export function ExpensePage() {
  const nav = useNavigate();
  const me = useMe();
  const [f, setF] = useState({});
  const q = useCrmQuery(['expenses'], '/expenses');
  const st = useCrmMutation(({ id, status }) => crm.post(`/expenses/${id}/status`, { status }));
  const rows = (q.data?.data || []).filter((r) => inRange(r.expenseDate, f) && (!f.status || r.status === f.status) && (!f.voucherType || r.voucherType === f.voucherType));
  return (
    <div>
      <PageTitle icon={Wallet}>Expense Detail</PageTitle>
      <Filters filters={[DATE, { n: 'voucherType', label: 'Voucher Type', o: (lk) => o.text(lk.voucherMaster), ph: '--Select Voucher Type--' }, { n: 'status', label: 'Status', o: ['Paid', 'Unpaid', 'Pending For Approval', 'PartialPaid', 'Cancelled', 'Rejected'] }]} onGo={setF} />
      {me?.crmRole !== 'Admin' && <Toolbar><Btn onClick={() => nav(`${B}/expenses/new`)}>Add New Expense</Btn></Toolbar>}
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'payeeName', label: 'Payee Name' }, { key: 'voucherType', label: 'Voucher Type/Account Head' }, { key: 'by', label: 'Entry By', render: (r) => r.location?.name }, { key: 'refNo', label: 'System Ref No.' },
        { key: 'expenseDate', label: 'Expense Date', render: (r) => fmt.dmy(r.expenseDate) }, money('amount', 'Amount'), { key: 'status', label: 'Status' },
        { key: 'attachment', label: 'Attachments', render: (r) => (r.attachment ? <a href={r.attachment} target="_blank" rel="noreferrer">View</a> : '') },
        ...(me?.isAdmin ? [{ key: 'ac', label: 'Action', sortable: false, render: (r) => (r.status === 'Pending For Approval' ? <span style={{ display: 'flex', gap: 6 }}><button type="button" className="dms-btn sm" onClick={() => st.mutate({ id: r._id, status: 'Paid' })}>Approve</button><button type="button" className="dms-btn sm default" onClick={() => st.mutate({ id: r._id, status: 'Rejected' })}>Reject</button></span> : '') }] : []),
      ])} />
    </div>
  );
}
export function ExpenseAddPage() {
  const me = useMe();
  const [items, setItems] = useState([{ description: '', amount: '' }]);
  return (
    <ActionForm title="Add New Expense" icon={Wallet} url="/expenses" saveLabel="Process" defaults={{ location: me?.location?._id, expenseDate: new Date().toISOString().slice(0, 10) }}
      fields={[{ n: 'location', label: 'Select Location', t: 'select', o: () => (me?.location ? [{ value: me.location._id, label: `${me.location.name} | ${me.location.code}` }] : []), req: true },
        { n: 'payeeName', label: 'Payee Name', req: true }, { n: 'voucherType', label: 'Voucher Type', t: 'select', o: (lk) => (lk.voucherMaster || []).map((x) => ({ value: x.name, label: `${x.name} | ${x.attrs?.section || ''}` })), req: true },
        { n: 'billNo', label: 'Ref No.', req: true }, { n: 'expenseDate', label: 'Expense Date', t: 'date', req: true }, { n: 'attachment', label: 'Attachment (link)', req: true }, { n: 'remark', label: 'Remark', t: 'textarea' }]}
      extraValid={() => (items.some((i) => i.description && Number(i.amount) > 0) ? '' : 'Add at least one description with amount')}
      toBody={(v) => ({ ...v, items: items.filter((i) => i.description && Number(i.amount) > 0).map((i) => ({ description: i.description, amount: Number(i.amount) })) })}
      onDone={(r, nav) => nav(`${B}/expenses`)}>
      {() => (
        <div className="dms-table-wrap" style={{ marginTop: 10 }}><table className="dms-table"><thead><tr><th>Sno</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>{items.map((it, i) => <tr key={i}><td>{i + 1}</td><td><TextArea rows={1} value={it.description} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} /></td>
            <td><Input type="number" min="0" value={it.amount} onChange={(e) => setItems((s) => s.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} /></td></tr>)}</tbody></table>
          <Btn size="sm" onClick={() => setItems((s) => [...s, { description: '', amount: '' }])}>Add Row</Btn> <b style={{ float: 'right' }}>Total: ₹ {fmt.money(items.reduce((s, i) => s + Number(i.amount || 0), 0))}</b></div>
      )}
    </ActionForm>
  );
}

/* ───────────── Payments ───────────── */
export function AddPaymentPage() {
  const [form, setForm] = useState(false);
  const q = useCrmQuery(['payments'], '/payments');
  if (form) {
    return (
      <ActionForm title="Payment Details" icon={Wallet} url="/payments" saveLabel="Submit" onDone={() => { setForm(false); q.refetch(); }}
        fields={[{ n: 'amount', label: 'Amount', t: 'number', req: true }, { n: 'mode', label: 'Payment Mode', t: 'select', o: ['Cash', 'DD', 'Cheque', 'NEFT', 'RTGS'], req: true },
          { n: 'bankName', label: 'Bank Name', t: 'select', o: ['Punjab National Bank', 'State Bank of India', 'Punjab & Sindh Bank', 'ICICI Bank', 'HDFC Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Yes Bank', 'IDFC First Bank'], when: (v) => v.mode && v.mode !== 'Cash' },
          { n: 'accountNo', label: 'Bank Account No.', when: (v) => v.mode && v.mode !== 'Cash' }, { n: 'ddChequeNo', label: 'DD/Cheque No.', when: (v) => ['DD', 'Cheque'].includes(v.mode), req: true }, { n: 'ddDate', label: 'DD Date', t: 'date', when: (v) => ['DD', 'Cheque'].includes(v.mode) },
          { n: 'courierName', label: 'Courier Name' }, { n: 'docketNo', label: 'Docket No.' }, { n: 'courierDate', label: 'Courier Date', t: 'date' }, { n: 'attachment', label: 'Attachment (link)' },
          { n: 'toLocation', label: 'Send To', t: 'select', o: (lk) => o.loc(lk.whs), req: true }]}>
        {() => <Btn variant="default" onClick={() => setForm(false)}>Cancel</Btn>}
      </ActionForm>
    );
  }
  return (
    <div>
      <PageTitle icon={Wallet}>Add Payment</PageTitle>
      <Toolbar><Btn onClick={() => setForm(true)}>Add New Payment</Btn></Toolbar>
      <DataTable rows={q.data?.data || []} loading={q.isLoading} columns={cols([
        { key: 't', label: 'To Location', render: (r) => r.toLocation?.name }, { key: 'docNo', label: 'Document No.' }, { key: 'createdAt', label: 'Document Date', render: (r) => fmt.dmy(r.createdAt) },
        { key: 'mode', label: 'Payment Mode' }, money('amount', 'Amount'), { key: 'status', label: 'Status' }, { key: 'attachment', label: 'Attachment', render: (r) => (r.attachment ? <a href={r.attachment} target="_blank" rel="noreferrer">View</a> : '') }])} />
    </div>
  );
}
export function PaymentReceivePage() {
  const q = useCrmQuery(['payments'], '/payments');
  const rec = useCrmMutation(({ id, decision }) => crm.post(`/payments/${id}/receive`, { decision }), { onSuccess: () => q.refetch() });
  return (
    <div>
      <PageTitle icon={Landmark}>Payment Details</PageTitle>
      <DataTable rows={q.data?.data || []} loading={q.isLoading} columns={cols([
        { key: 'f', label: 'From Location', render: (r) => `${r.fromLocation?.name || ''} (${r.fromLocation?.code || ''})` }, { key: 'docNo', label: 'Document No.' }, { key: 'createdAt', label: 'Document Date', render: (r) => fmt.dmy(r.createdAt) },
        { key: 'mode', label: 'Payment Mode' }, money('amount', 'Amount'), { key: 'status', label: 'Status' }, { key: 'attachment', label: 'Attachment', render: (r) => (r.attachment ? <a href={r.attachment} target="_blank" rel="noreferrer">View</a> : '') },
        { key: 'rc', label: 'Receive', sortable: false, render: (r) => (r.status === 'Pending' ? <span style={{ display: 'flex', gap: 6 }}><button type="button" className="dms-btn sm" onClick={() => rec.mutate({ id: r._id, decision: 'Received' })}>Receive</button><button type="button" className="dms-btn sm default" onClick={() => rec.mutate({ id: r._id, decision: 'Rejected' })}>Reject</button></span> : r.status) }])} />
    </div>
  );
}

/* ───────────── Accounts ───────────── */
const ledgerLink = (r, type, nav) => <button type="button" className="dms-btn sm default" onClick={() => nav(`${B}/ledger?location=${r._id}&accountType=${type}`)}>Download</button>;
export function AccountStatusPage() {
  const nav = useNavigate();
  return (
    <ListPage title="Party Account" icon={Landmark} url="/accounts/status"
      columns={[{ key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'name', label: 'Location Name' }, { key: 'code', label: 'Location Code' }, money('claimAc', 'Claim A/C'), money('mainAc', 'Main A/C'), money('securityAc', 'Security A/C'),
        { key: 'l1', label: 'Download Ledger(Claim)', sortable: false, render: (r) => ledgerLink(r, 'Claim', nav) }, { key: 'l2', label: 'Download Ledger(Main)', sortable: false, render: (r) => ledgerLink(r, 'Main', nav) }, { key: 'l3', label: 'Download Ledger(Security)', sortable: false, render: (r) => ledgerLink(r, 'Security', nav) }]} />
  );
}
export function LedgerPage() {
  const me = useMe();
  const sp = new URLSearchParams(window.location.search);
  const fixed = { location: sp.get('location') || undefined, accountType: sp.get('accountType') || undefined };
  return (
    <ListPage title="Party Ledger" icon={Landmark} report="party-ledger" params={fixed}
      filters={[DATE, ...(me?.crmRole === 'ASP' ? [] : [{ n: 'location', label: 'Location', o: (lk) => o.loc(lk.locations), ph: '--Please Select-' }]), { n: 'accountType', label: 'Account', o: ['Main', 'Security', 'Claim'] }]}
      columns={[{ key: 'details', label: 'Trasaction Details' }, { key: 'type', label: 'Trsacation Type' }, { key: 'date', label: 'Trasaction Date', t: 'date' }, { key: 'cr', label: 'Amount Cr', t: 'money' }, { key: 'dr', label: 'Amount Dr', t: 'money' }, { key: 'location', label: 'Location' }]} />
  );
}
export function TransferPage() {
  const q = useCrmQuery(['acc-status'], '/accounts/status');
  const [modal, setModal] = useState(null);
  const [loc, setLoc] = useState('');
  const rows = (q.data?.data || []).filter((r) => !loc || r._id === loc);
  return (
    <div>
      <PageTitle icon={Landmark}>Transfer to Other A/C</PageTitle>
      <Filters filters={[{ n: 'location', label: 'Location', o: (lk) => o.loc(lk.locations), req: true, ph: '--Please Select-' }]} onGo={(f) => setLoc(f.location || '')} />
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'state', label: 'State' }, { key: 'city', label: 'City' }, { key: 'name', label: 'Location Name' }, { key: 'code', label: 'Location Code' }, money('mainAc', 'Main A/C'), money('securityAc', 'Security A/C'), money('claimAc', 'Claim A/C'),
        { key: 't1', label: 'Transfer to Security', sortable: false, render: (r) => <button type="button" className="dms-btn sm" onClick={() => setModal({ r, from: 'Main', to: 'Security' })}>Transfer</button> },
        { key: 't2', label: 'Transfer Claim to main', sortable: false, render: (r) => <button type="button" className="dms-btn sm" onClick={() => setModal({ r, from: 'Claim', to: 'Main' })}>Transfer</button> }])} />
      {modal && <SimpleModal title={`Transfer ${modal.from} → ${modal.to} (${modal.r.name})`} onClose={() => { setModal(null); q.refetch(); }}
        fields={[{ n: 'amount', label: 'Amount', t: 'number', req: true }, { n: 'remark', label: 'Remark' }]}
        onSave={(v) => crm.post('/accounts/transfer', { locationId: modal.r._id, fromAccount: modal.from, toAccount: modal.to, ...v })} />}
    </div>
  );
}
export function AdjustmentPage() {
  const q = useCrmQuery(['acc-status'], '/accounts/status');
  const [loc, setLoc] = useState('');
  const cur = (q.data?.data || []).find((r) => r._id === loc);
  return (
    <ActionForm title="Account Adjustment" icon={Landmark} url="/accounts/adjustment" onDone={() => q.refetch()}
      fields={[{ n: 'type', label: 'Adjustment Type', t: 'select', o: ['CR', 'DR'], req: true }, { n: 'amount', label: 'Adjustment Amt', t: 'number', req: true }, { n: 'remark', label: 'Remark', t: 'textarea', req: true }]}
      extraValid={() => (loc ? '' : 'Select Location')} toBody={(v) => ({ ...v, locationId: loc, accountType: 'Main' })}>
      {() => (
        <div className="dms-form" style={{ marginTop: 8 }}>
          <Field label="Location" required><Select value={loc} options={(q.data?.data || []).map((r) => ({ value: r._id, label: `${r.name} (${r.code})` }))} onChange={(e) => setLoc(e.target.value)} /></Field>
          <Field label="Current Amount"><Input readOnly value={cur ? fmt.money(cur.mainAc) : ''} /></Field>
        </div>
      )}
    </ActionForm>
  );
}
export function CnPage() {
  const me = useMe();
  const q = useCrmQuery(['cn-docs'], '/dispatches', { docType: 'Purchase Return,Faulty Dispatch' });
  const cn = useCrmMutation((id) => crm.post(`/dispatches/${id}/cn`), { onSuccess: () => q.refetch() });
  const rows = (q.data?.data || []).filter((r) => me?.isAdmin || String(r.toLocation?._id) === String(me?.location?._id));
  return (
    <div>
      <PageTitle icon={Receipt}>CN Generate Against Part</PageTitle>
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'f', label: 'From Location Name', render: (r) => r.fromLocation?.name }, { key: 't', label: 'To Location Name', render: (r) => r.toLocation?.name }, { key: 'docNo', label: 'Challan No.' },
        { key: 'createdAt', label: 'Entry Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'status', label: 'Status' }, { key: 'docType', label: 'Type' },
        { key: 'p', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/doc/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> },
        { key: 'a', label: 'Action', sortable: false, render: (r) => (r.status === 'Received' ? <button type="button" className="dms-btn sm" onClick={() => cn.mutate(r._id)}>Generate CN</button> : 'Receive first') }])} />
    </div>
  );
}
export function ReconciliationPage() {
  const q = useCrmQuery(['reco'], '/reconciliation');
  const act = useCrmMutation(({ id, action }) => crm.post(`/reconciliation/${id}`, { action }), { onSuccess: () => q.refetch() });
  const [f, setF] = useState({});
  const rows = (q.data?.data || []).filter((r) => !f.status || (f.status === 'missing' ? r.items.some((i) => i.missingQty) : r.items.some((i) => i.damageQty)));
  return (
    <div>
      <PageTitle icon={Landmark}>Missing / Damage Reconciliation Request</PageTitle>
      <Filters filters={[{ n: 'status', label: 'Status', o: [{ value: 'missing', label: 'Request For Missing' }, { value: 'damage', label: 'Move Damage Stock to Faulty' }], ph: '--Please Select--' }]} onGo={setF} />
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'f', label: 'From Location Name', render: (r) => r.fromLocation?.name }, { key: 't', label: 'To Location Name', render: (r) => r.toLocation?.name }, { key: 'docNo', label: 'Challan No.' }, { key: 'status', label: 'Status' }, { key: 'docType', label: 'Type' },
        { key: 'mv', label: 'Missing Reconciliation View', render: (r) => r.items.map((i) => `${i.partcode}: D${i.damageQty}/M${i.missingQty}`).join(', ') },
        { key: 'a', label: 'Action', sortable: false, render: (r) => <span style={{ display: 'flex', gap: 6 }}>
          {r.items.some((i) => i.damageQty) && <button type="button" className="dms-btn sm" onClick={() => act.mutate({ id: r._id, action: 'damage-to-faulty' })}>Damage → Faulty</button>}
          {r.items.some((i) => i.missingQty) && <button type="button" className="dms-btn sm default" onClick={() => act.mutate({ id: r._id, action: 'missing' })}>Close Missing</button>}</span> }])} />
    </div>
  );
}

/* ───────────── Claims ───────────── */
export function ClaimGeneratePage() {
  const { type } = useParams();
  const title = { Labour: 'Claim Generate', Travel: 'Travel Claim Generate', Partner: 'Claim Generate For Partner' }[type] || 'Claim Generate';
  return (
    <ActionForm key={type} title={title} icon={ShieldCheck} url="/claims/generate" saveLabel="GO" onDone={(r, nav) => nav(`${B}/claims/approval`)}
      fields={[{ n: 'month', label: 'Month', t: 'select', o: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })), req: true }, { n: 'year', label: 'Year', t: 'select', o: YEARS, req: true },
        { n: 'locationId', label: 'Location', t: 'select', o: (lk) => o.loc(type === 'Partner' ? lk.whs : lk.asps), req: true }]}
      toBody={(v) => ({ ...v, claimType: type })} />
  );
}
export function ClaimApprovalPage() {
  const q = useCrmQuery(['claims'], '/claims');
  const ap = useCrmMutation((id) => crm.post(`/claims/${id}/approve`), { onSuccess: () => q.refetch() });
  const [f, setF] = useState({});
  const rows = (q.data?.data || []).filter((r) => inRange(r.createdAt, f) && (!f.location || String(r.location?._id) === f.location));
  return (
    <div>
      <PageTitle icon={ShieldCheck}>Claim Approval</PageTitle>
      <Filters filters={[DATE, { n: 'location', label: 'Location Name', o: (lk) => o.loc(lk.locations) }]} onGo={setF} />
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'docNo', label: 'Document No.' }, { key: 'claimType', label: 'Claim Type' }, { key: 'm', label: 'Claim month', render: (r) => `${MONTHS[r.month - 1]} ${r.year}` }, { key: 'l', label: 'Location Name', render: (r) => r.location?.name },
        { key: 'jobs', label: 'Jobs', render: (r) => r.jobs.length }, money('totalAmount', 'Claim Amount'), { key: 'status', label: 'Status' },
        { key: 'a', label: 'Action', sortable: false, render: (r) => (r.status === 'Generated' ? <button type="button" className="dms-btn sm" onClick={() => ap.mutate(r._id)}>Approve</button> : '') },
        { key: 'p', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/claim/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> }])} />
    </div>
  );
}
export function ClaimInvoicePage() {
  const q = useCrmQuery(['claims'], '/claims');
  const [modal, setModal] = useState(null);
  const [f, setF] = useState({});
  const rows = (q.data?.data || []).filter((r) => r.status !== 'Generated' && (!f.month || String(r.month) === f.month) && (!f.year || String(r.year) === f.year) && (!f.location || String(r.location?._id) === f.location));
  return (
    <div>
      <PageTitle icon={Receipt}>ASP Claim Invoices</PageTitle>
      <Filters filters={[{ n: 'month', label: 'Month', o: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) }, { n: 'year', label: 'Year', o: YEARS }, { n: 'location', label: 'Location Name', o: (lk) => o.loc(lk.asps) }]} onGo={setF} />
      <DataTable rows={rows} loading={q.isLoading} columns={cols([
        { key: 'docNo', label: 'Document No.' }, { key: 'createdAt', label: 'Document Date', render: (r) => fmt.dmy(r.createdAt) }, { key: 'claimType', label: 'Document Type' }, { key: 'lc', label: 'Location Code', render: (r) => r.location?.code },
        { key: 'ln', label: 'Location Name', render: (r) => r.location?.name }, { key: 'm', label: 'Claim month', render: (r) => `${MONTHS[r.month - 1]} ${r.year}` }, money('totalAmount', 'Claim Release'), { key: 'status', label: 'Status' },
        { key: 'p', label: 'Print', sortable: false, render: (r) => <a className="dms-icon-btn" title="Print" href={`${B}/print/claim/${r._id}`} target="_blank" rel="noreferrer"><Printer size={17} /></a> },
        { key: 'u', label: 'Update Dispatch', sortable: false, render: (r) => <button type="button" className="dms-icon-btn" title="Update Dispatch Details" onClick={() => setModal(r)}><Truck size={17} /></button> }])} />
      {modal && <SimpleModal title="Update Dispatch Details" defaults={{ courierName: modal.courierName, docketNo: modal.docketNo }} onClose={() => { setModal(null); q.refetch(); }}
        fields={[{ n: 'courierName', label: 'Courier Name', req: true }, { n: 'docketNo', label: 'Docket No', req: true }]} onSave={(v) => crm.post(`/claims/${modal._id}/dispatch`, v)} />}
    </div>
  );
}
export function ClaimPrintPage() {
  const { id } = useParams();
  const q = useCrmQuery(['claims'], '/claims');
  const c = (q.data?.data || []).find((x) => x._id === id);
  useLk();
  if (!c) return <p>{q.isLoading ? 'Loading…' : 'Claim not found'}</p>;
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16, font: '12px Arial, sans-serif', color: '#000', background: '#fff' }}>
      <style>{'table{width:100%;border-collapse:collapse}td,th{border:1px solid #000;padding:5px 6px;text-align:left}.r{text-align:right}@media print{.no-print{display:none}}'}</style>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 10 }}><button type="button" className="dms-btn" onClick={() => window.print()}>Print</button></div>
      <h2 style={{ textAlign: 'center' }}>{c.claimType.toUpperCase()} CLAIM INVOICE</h2>
      <table><tbody><tr><td><b>Document No.:</b> {c.docNo}<br /><b>Date:</b> {fmt.dmy(c.createdAt)}</td><td><b>Location:</b> {c.location?.name} ({c.location?.code})<br /><b>Claim Month:</b> {MONTHS[c.month - 1]} {c.year}</td></tr></tbody></table>
      <table style={{ marginTop: 8 }}><thead><tr><th>#</th><th>Job No.</th><th className="r">Amount</th></tr></thead>
        <tbody>{c.jobs.map((j, i) => <tr key={j.jobNo}><td>{i + 1}</td><td>{j.jobNo}</td><td className="r">{fmt.money(j.amount)}</td></tr>)}
          <tr><td colSpan={2} className="r"><b>Total</b></td><td className="r"><b>{fmt.money(c.totalAmount)}</b></td></tr></tbody></table>
      <p>Status: {c.status} {c.courierName ? `— Dispatched by ${c.courierName} (${c.docketNo})` : ''}</p>
    </div>
  );
}
