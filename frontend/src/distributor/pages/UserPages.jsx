import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { dms, useDmsQuery, useDmsMutation, useLookups, apiError } from '../api';
import { PageTitle, Toolbar, Btn, BackBtn, DataTable, useListState, Field, Input, Select, EditLink, Alert, Status, locOpt } from '../components/ui';
import { MENU } from '../menu';
import { FilterBar } from './MasterPages';

/*
 * Admin/Users, laid out like the reference (adminusermgt.php / addAdminUser.php / update_permission.php / emp_history.php):
 *  - list: Login Id, User Name, User Type, Phone No., Email-id, Status, View/Edit, History
 *  - add / edit: two-column form; edit adds "User Id" and the "Update Rights" button
 *  - Update User Permission: tabs Master / Region, Processes, Locations, Product Category, Brand
 */
const typeLabel = (t, codes) => (codes?.[t] ? `${t} ( ${codes[t]} )` : t);
const STATUS_OPTS = [{ value: 'Active', label: 'Activate' }, { value: 'Deactive', label: 'Deactivate' }];

export function UserList() {
  const list = useListState();
  const [f, setF] = useState({});
  const { data: lk } = useLookups();
  const codes = lk?.data?.userTypeCodes;
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
          { key: 'userType', label: 'User Type', render: (r) => typeLabel(r.userType, codes) },
          { key: 'ph', label: 'Phone No.', render: (r) => r.user?.phone }, { key: 'em', label: 'Email-id', render: (r) => r.user?.email },
          { key: 'status', label: 'Status', render: (r) => <Status value={r.status} /> },
          { key: 'e', label: 'View/Edit', sortable: false, align: 'c', render: (r) => <EditLink to={`/distributor/masters/users/${r._id}`} /> },
          { key: 'h', label: 'History', sortable: false, align: 'c', render: (r) => <Link to={`/distributor/masters/users/${r._id}/history`} className="dms-icon-btn" title="History" aria-label={`History of ${r.loginId}`}><i className="fa fa-history fa-lg" aria-hidden="true" /></Link> },
        ]}
      />
    </>
  );
}

/** Reads an image file into a data URL; the reference asks for a 220 x 220 image. */
function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) { reject(new Error('Profile Img must be a PNG, JPG, GIF or WEBP image')); return; }
    if (file.size > 220 * 1024) { reject(new Error('Profile Img is too large (use a 220 x 220 image)')); return; }
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the image'));
    r.readAsDataURL(file);
  });
}

export function UserForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'new';
  const nav = useNavigate();
  const { data: lk } = useLookups();
  const codes = lk?.data?.userTypeCodes;
  const { data: rec } = useDmsQuery('user-one', `/users/${id}`, undefined, { enabled: Boolean(isEdit) });
  const [v, setV] = useState({ status: 'Active', pages: [] });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const r = rec?.data;
    if (r) setV({ displayName: r.displayName, loginId: r.loginId, userType: r.userType, status: r.status, location: r.location?._id || '', phone: r.user?.phone, email: r.user?.email, profileImg: r.profileImg || '' });
  }, [rec, id]);
  const save = useDmsMutation((b) => (isEdit ? dms.put(`/users/${id}`, b) : dms.post('/users', b)), { onSuccess: () => nav('/distributor/masters/users') });
  const submit = (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    const { loginId, ...rest } = v;
    const body = isEdit ? rest : { ...rest, ...(loginId ? { loginId } : {}) };
    save.mutate(body, { onError: (err) => { const a = apiError(err); setErrors(a.fieldErrors); setMsg(a.message); } });
  };
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const onImg = async (e) => {
    try { setErrors((x) => ({ ...x, profileImg: undefined })); setV({ ...v, profileImg: await readImage(e.target.files?.[0]) }); } catch (err) { setErrors((x) => ({ ...x, profileImg: err.message })); e.target.value = ''; }
  };
  const needsLocation = v.userType && v.userType !== 'Admin';
  return (
    <>
      <PageTitle icon={Users}>Admin/Users Details</PageTitle>
      <Alert>{msg}</Alert>
      <form onSubmit={submit}>
        <div className="dms-form two">
          <Field label="User Name" error={errors.displayName}><Input required value={v.displayName || ''} onChange={set('displayName')} /></Field>
          {isEdit ? <Field label="User Id"><Input value={v.loginId || ''} readOnly /></Field> : <div aria-hidden="true" />}
          <Field label="Password" error={errors.password}>
            <Input type="password" minLength={8} required={!isEdit} value={v.password || ''} autoComplete="new-password" placeholder={isEdit ? 'Leave blank to keep' : ''} onChange={set('password')} />
          </Field>
          <Field label="User Type" error={errors.userType}>
            <Select required placeholder="--Please Select--" value={v.userType || ''} options={(lk?.data?.userTypes || []).map((t) => ({ value: t, label: typeLabel(t, codes) }))} onChange={set('userType')} />
          </Field>
          <Field label="Mobile No." error={errors.phone}><Input required pattern="\d{10}" title="10 digits" value={v.phone || ''} onChange={set('phone')} /></Field>
          <Field label="Email-Id" error={errors.email}><Input type="email" required disabled={isEdit} value={v.email || ''} onChange={set('email')} /></Field>
          <Field label="Status"><Select placeholder={false} value={v.status} options={STATUS_OPTS} onChange={set('status')} /></Field>
          <Field label="Profile Img." error={errors.profileImg}>
            <div>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={onImg} aria-label="Profile Img." />
              <div className="dms-img-note">Use (220px X 220px) Image Only</div>
              {v.profileImg && <img src={v.profileImg} alt="Profile" className="dms-profile-img" />}
            </div>
          </Field>
          {/* A Location User belongs to one location; other user types may instead be limited by Region / Location Type rights. */}
          {needsLocation && (
            <Field label="Location" required={v.userType === 'Location User'} error={errors.location}>
              <Select required={v.userType === 'Location User'} value={v.location || ''} options={(lk?.data?.allLocations || []).map(locOpt)} onChange={set('location')} />
            </Field>
          )}
        </div>
        <div className="dms-actions">
          <button type="submit" className="dms-btn" disabled={save.isPending}>{isEdit ? 'Update' : 'ADD'}</button>
          {isEdit && <Btn to={`/distributor/masters/users/${id}/permission`}>Update Rights</Btn>}
          <BackBtn to="/distributor/masters/users" />
        </div>
      </form>
    </>
  );
}

/* Menu groups on the first two tabs of the reference "Update User Permission" page. */
const MASTER_GROUPS = ['Home', 'Dashboard', 'Master Management', 'Report Master'];
const TABS = [
  { key: 'master', label: 'Master / Region', fa: 'fa-database' },
  { key: 'process', label: 'Processes', fa: 'fa-cogs' },
  { key: 'loc', label: 'Locations', fa: 'fa-university' },
  { key: 'cat', label: 'Product Category', fa: 'fa-suitcase' },
  { key: 'brand', label: 'Brand', fa: 'fa-tag' },
];

function CheckGrid({ title, items, checked, onToggle }) {
  if (!items.length) return null;
  return (
    <div className="dms-perm-group">
      {title && <h4>{title}</h4>}
      <div className="dms-perm-grid">
        {items.map((i) => (
          <label key={i.value}><input type="checkbox" checked={checked.includes(i.value)} onChange={() => onToggle(i.value)} /> {i.label}</label>
        ))}
      </div>
    </div>
  );
}

export function UserPermission() {
  const { id } = useParams();
  const { data: lk } = useLookups();
  const { data: rec, refetch } = useDmsQuery('user-one', `/users/${id}`);
  const [tab, setTab] = useState(0);
  const [pages, setPages] = useState([]);
  const [scopes, setScopes] = useState({ regions: [], locationTypes: [], categories: [], brands: [] });
  const [msg, setMsg] = useState({ text: '', ok: false });
  useEffect(() => {
    const r = rec?.data;
    if (r) {
      setPages(r.pages || []);
      setScopes({ regions: r.scopes?.regions || [], locationTypes: r.scopes?.locationTypes || [], categories: (r.scopes?.categories || []).map(String), brands: (r.scopes?.brands || []).map(String) });
    }
  }, [rec]);
  const groups = useMemo(() => {
    const seen = new Set();
    return MENU.map((g) => ({
      label: g.label,
      items: (g.items || (g.page ? [g] : [])).filter((i) => i.page && !seen.has(i.page) && seen.add(i.page)).map((i) => ({ value: i.page, label: i.label })),
    })).filter((g) => g.items.length);
  }, []);
  const save = useDmsMutation((b) => dms.put(`/users/${id}`, b), { onSuccess: () => { setMsg({ text: 'Rights updated successfully', ok: true }); refetch(); } });
  const r = rec?.data;
  const tg = (list, setList) => (val) => setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  const tgScope = (k) => (val) => setScopes((s) => ({ ...s, [k]: s[k].includes(val) ? s[k].filter((x) => x !== val) : [...s[k], val] }));
  const cats = [...(lk?.data?.categories || []), ...(lk?.data?.subcategories || [])].map((c) => ({ value: c._id, label: c.name }));
  const brands = (lk?.data?.brands || []).map((b) => ({ value: b._id, label: b.name }));
  const tabPages = (k) => groups.filter((g) => (k === 'master' ? MASTER_GROUPS.includes(g.label) : !MASTER_GROUPS.includes(g.label))).flatMap((g) => g.items.map((i) => i.value));
  const setAll = (on) => {
    const t = TABS[tab].key;
    if (t === 'master' || t === 'process') {
      const keys = tabPages(t);
      setPages((p) => (on ? [...new Set([...p, ...keys])] : p.filter((x) => !keys.includes(x))));
      if (t === 'master') setScopes((s) => ({ ...s, regions: on ? [...(lk?.data?.regions || [])] : [] }));
    } else {
      const map = { loc: ['locationTypes', lk?.data?.locationTypes || []], cat: ['categories', cats.map((c) => c.value)], brand: ['brands', brands.map((b) => b.value)] }[t];
      setScopes((s) => ({ ...s, [map[0]]: on ? [...map[1]] : [] }));
    }
  };
  const submit = () => { setMsg({ text: '', ok: false }); save.mutate({ pages, scopes }, { onError: (err) => setMsg({ text: apiError(err).message, ok: false }) }); };
  const t = TABS[tab].key;
  return (
    <>
      <PageTitle icon={Users}>Update User Permission</PageTitle>
      {r && <p className="dms-perm-user">{r.displayName} ({r.loginId})</p>}
      {msg.text && <div className={`dms-alert ${msg.ok ? 'ok' : ''}`} role="status">{msg.text}</div>}
      <ul className="dms-tabs" role="tablist">
        {TABS.map((x, i) => (
          <li key={x.key}><button type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'active' : ''} onClick={() => setTab(i)}><i className={`fa ${x.fa}`} aria-hidden="true" /> {x.label}</button></li>
        ))}
      </ul>
      <div className="dms-perm-pane">
        <div className="dms-perm-tools">
          <button type="button" className="dms-btn" onClick={() => setAll(true)}>Check All</button>
          <button type="button" className="dms-btn" onClick={() => setAll(false)}>Uncheck All</button>
        </div>
        {(t === 'master' || t === 'process') && groups.filter((g) => (t === 'master' ? MASTER_GROUPS.includes(g.label) : !MASTER_GROUPS.includes(g.label))).map((g) => (
          <CheckGrid key={g.label} title={g.label} items={g.items} checked={pages} onToggle={tg(pages, setPages)} />
        ))}
        {t === 'master' && <CheckGrid title="Region" items={(lk?.data?.regions || []).map((x) => ({ value: x, label: x }))} checked={scopes.regions} onToggle={tgScope('regions')} />}
        {t === 'loc' && <CheckGrid title="Location Type" items={(lk?.data?.locationTypes || []).map((x) => ({ value: x, label: x }))} checked={scopes.locationTypes} onToggle={tgScope('locationTypes')} />}
        {t === 'cat' && <CheckGrid items={cats} checked={scopes.categories} onToggle={tgScope('categories')} />}
        {t === 'brand' && <CheckGrid items={brands} checked={scopes.brands} onToggle={tgScope('brands')} />}
        <p className="dms-muted">{t === 'master' || t === 'process' ? 'Ticked pages appear in the user\'s menu. An Admin user with no ticked page can open every page.' : 'Nothing ticked = no restriction. Product Category and Brand limit the products offered in the user\'s forms.'}</p>
        <div className="dms-actions">
          {tab > 0 && <button type="button" className="dms-btn" onClick={() => setTab(tab - 1)}>Previous</button>}
          <button type="button" className="dms-btn" disabled={save.isPending} onClick={submit}>Save</button>
          {tab < TABS.length - 1 && <button type="button" className="dms-btn" onClick={() => setTab(tab + 1)}>Next</button>}
          <BackBtn to={`/distributor/masters/users/${id}`} />
        </div>
      </div>
    </>
  );
}

export function UserHistory() {
  const { id } = useParams();
  const { data, isLoading } = useDmsQuery('user-history', `/users/${id}/history`);
  const d = data?.data;
  return (
    <>
      <PageTitle icon={Users}>History</PageTitle>
      {d && <p className="dms-perm-user">{d.displayName} ({d.loginId})</p>}
      <DataTable
        loading={isLoading} rows={(d?.history || []).map((h, i) => ({ _id: String(i), ...h }))}
        columns={[
          { key: '#', label: 'S.No' },
          { key: 'at', label: 'Date & Time', render: (h) => (h.at ? new Date(h.at).toLocaleString('en-IN') : '') },
          { key: 'by', label: 'Changed By' },
          { key: 'change', label: 'Change' },
        ]}
      />
      <div className="dms-actions"><BackBtn to="/distributor/masters/users" /></div>
    </>
  );
}
