import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError } from '../api';
import { PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, EditLink, Alert, Status, locOpt } from '../components/ui';
import { MENU } from '../menu';
import { FilterBar } from './MasterPages';

export function UserList() {
  const list = useListState();
  const [f, setF] = useState({});
  const { data: lk } = useLookups();
  const { data, isFetching } = useDmsQuery('users', '/users', { ...list.params, ...f });
  return (
    <>
      <PageTitle icon={Users}>Admin/Users Master</PageTitle>
      <FilterBar
        defs={[{ name: 'status', label: 'Status', options: ['Active', 'Deactive'] }, { name: 'userType', label: 'User Type', options: lk?.data?.userTypes || [] }]}
        opts={(d) => d.options} onGo={setF}
      />
      <Toolbar><Btn to="/distributor/masters/users/new">Add User</Btn></Toolbar>
      <DataTable
        loading={isFetching && !data} rows={data?.data} total={data?.pagination?.total ?? 0} {...list.tableProps}
        columns={[
          { key: '#', label: 'S.No' }, { key: 'loginId', label: 'Login Id' }, { key: 'displayName', label: 'User Name' },
          { key: 'userType', label: 'User Type' }, { key: 'loc', label: 'Location', render: (r) => r.location?.name },
          { key: 'ph', label: 'Phone No.', render: (r) => r.user?.phone }, { key: 'em', label: 'Email-id', render: (r) => r.user?.email },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          { key: 'e', label: 'View/Edit', sortable: false, align: 'c', render: (r) => <EditLink to={`/distributor/masters/users/${r._id}`} /> },
        ]}
      />
    </>
  );
}

export function UserForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const nav = useNavigate();
  const { data: lk } = useLookups();
  const { data: rec } = useDmsQuery('user-one', `/users/${id}`, undefined, { enabled: Boolean(isEdit) });
  const [v, setV] = useState({ status: 'Active', pages: [] });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const r = rec?.data;
    if (r) setV({ ...r, location: r.location?._id || '', phone: r.user?.phone, email: r.user?.email, pages: r.pages || [] });
  }, [rec, id]);
  const save = useDmsMutation((b) => (isEdit ? dms.put(`/users/${id}`, b) : dms.post('/users', b)), { onSuccess: () => nav('/distributor/masters/users') });
  const toggle = (p) => setV((s) => ({ ...s, pages: s.pages.includes(p) ? s.pages.filter((x) => x !== p) : [...s.pages, p] }));
  const submit = (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    const { _id, user, createdAt, updatedAt, __v, ...body } = v;
    save.mutate(body, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } });
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <>
      <PageTitle icon={Users}>Admin/Users Details</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form">
          <Field label="User Name" required error={errors.displayName}><Input required value={v.displayName || ''} onChange={set('displayName')} /></Field>
          <Field label="Login Id" error={errors.loginId}><Input value={v.loginId || ''} disabled={isEdit} placeholder="Auto-generated if blank" onChange={set('loginId')} /></Field>
          <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} required={!isEdit} error={errors.password}>
            <Input type="password" minLength={8} required={!isEdit} value={v.password || ''} autoComplete="new-password" onChange={set('password')} />
          </Field>
          <Field label="User Type" required error={errors.userType}><Select required value={v.userType || ''} options={lk?.data?.userTypes || []} onChange={set('userType')} /></Field>
          <Field label="Mobile No." required error={errors.phone}><Input required pattern="\d{10}" value={v.phone || ''} onChange={set('phone')} /></Field>
          <Field label="Email-id" required error={errors.email}><Input type="email" required disabled={isEdit} value={v.email || ''} onChange={set('email')} /></Field>
          <Field label="Location" required={v.userType !== 'Admin'} error={errors.location}>
            <Select required={v.userType !== 'Admin'} value={v.location || ''} options={(lk?.data?.allLocations || []).map(locOpt)} onChange={set('location')} />
          </Field>
          <Field label="Status"><Select placeholder={false} value={v.status} options={['Active', 'Deactive']} onChange={set('status')} /></Field>
          <Field label="Page Rights" full>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 4, border: '1px solid #ddd', padding: 8, borderRadius: 3 }}>
              {MENU.flatMap((g) => (g.items ? g.items.map((i) => ({ ...i, group: g.label })) : g.page ? [{ ...g, group: '' }] : [])).map((i) => (
                <label key={i.page} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                  <input type="checkbox" checked={v.pages.includes(i.page)} onChange={() => toggle(i.page)} />
                  {i.group ? `${i.group} › ` : ''}{i.label}
                </label>
              ))}
            </div>
            <p className="dms-muted">Admin users without any ticked page get access to every page.</p>
          </Field>
        </div>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{isEdit ? 'Update' : 'ADD'}</button>
          <BackBtn to="/distributor/masters/users" />
        </div>
      </form>
    </>
  );
}
