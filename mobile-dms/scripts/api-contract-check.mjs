/**
 * Exercises every backend call the mobile app makes, against a running backend (demo data), signed in as a field user.
 *   API=http://127.0.0.1:3000/api LOGIN=kma@demo.haion.local PASSWORD=DmsDemo@123 node scripts/api-contract-check.mjs
 * Writes demo records (attendance, feedback, TA/DA, a beat visit) — run only against the demo database.
 */
const API = (process.env.API || 'http://127.0.0.1:3000/api').replace(/\/$/, '');
const LOGIN = process.env.LOGIN || 'kma@demo.haion.local';
const PASSWORD = process.env.PASSWORD || 'DmsDemo@123';
if (!/127\.0\.0\.1|localhost|10\.0\.2\.2|192\.168\./.test(API)) { console.error('Refusing: point API at a local/demo backend.'); process.exit(1); }

let token = '';
const rows = [];
const call = async (method, path, body, isForm) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (!isForm) headers['Content-Type'] = 'application/json';
  const r = await fetch(API + path, { method, headers, body: isForm ? body : body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const check = (name, ok, detail = '') => rows.push({ step: name, result: ok ? 'PASS' : 'FAIL', detail: String(detail).slice(0, 90) });

const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: LOGIN, password: PASSWORD }) });
const lj = await login.json();
check('login (Login ID or e-mail)', login.status === 200 && lj.data?.accessToken, login.status);
token = lj.data.accessToken;
const me = await call('GET', '/dms/me');
check('GET /dms/me (pages decide which tiles show)', me.status === 200, `${me.json?.data?.loginId} ${me.json?.data?.pages?.length} pages`);

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const fd = new FormData();
fd.append('photo', new Blob([png], { type: 'image/png' }), 'selfie.png');
const up = await call('POST', '/dms/entities/attendance-photo', fd, true);
check('selfie upload → /uploads URL', up.status === 201 && /^\/uploads\//.test(up.json?.data?.url || ''), up.json?.data?.url || up.json?.message);

const today = await call('GET', '/dms/entities/attendance-today');
check('attendance-today', today.status === 200, today.json?.data ? 'already punched today' : 'not punched');
if (!today.json?.data) {
  const pin = await call('POST', '/dms/entities/attendance-punch', { kind: 'in', address: 'Contract check, Agra', lat: 27.1767, lng: 78.0081, image: up.json?.data?.url, capturedAt: new Date(Date.now() - 600000).toISOString() });
  check('punch IN with selfie + GPS + capturedAt (offline-style)', pin.status === 201 && pin.json?.data?.data?.inLat === 27.1767, pin.status + ' ' + (pin.json?.message || ''));
  const again = await call('POST', '/dms/entities/attendance-punch', { kind: 'in' });
  check('second IN refused (queue moves it to "refused")', again.status === 422, again.json?.message);
}
const beats = await call('GET', '/dms/entities/beat?view=mine&perPage=50&sortBy=date');
check('my beat plan', beats.status === 200, `${beats.json?.data?.length} beats`);
const sched = (beats.json?.data || []).find((b) => b.status === 'Scheduled');
if (sched) { const v = await call('POST', `/dms/entities/beat/${sched._id}/action`, { action: 'visit' }); check('mark beat visited', v.status === 200, v.json?.data?.status); }
const tasks = await call('GET', '/dms/entities/apptask?view=mine&perPage=50');
check('my tasks (assignee view)', tasks.status === 200, `${tasks.json?.data?.length} tasks`);
const lt = await call('GET', '/dms/entities/options/leavetype');
check('leave types for the picker', lt.status === 200 && lt.json?.data?.length > 0, lt.json?.data?.map((x) => x.label).join(', '));
const leaves = await call('GET', '/dms/entities/leave?view=mine&perPage=50');
check('my leaves', leaves.status === 200, `${leaves.json?.data?.length}`);
const td = await call('POST', '/dms/entities/tada', { date: new Date().toISOString().slice(0, 10), fromPlace: 'Agra', toPlace: 'Mathura', distanceKm: 58, travelAmount: 464, daAmount: 500 });
check('TA/DA claim', td.status === 201, td.json?.data?.docNo || td.json?.message);
const fb = await call('POST', '/dms/entities/appfeedback', { feedbackType: 'General', subject: 'Contract check', feedback: 'Sent by the mobile API contract check', date: new Date().toISOString().slice(0, 10) });
check('feedback', fb.status === 201, fb.status);
const tr = await call('POST', '/dms/entities/track', { address: 'Ping', lat: 27.18, lng: 78.01, travelDate: new Date().toISOString().slice(0, 10), travelTime: '11:00' });
check('location ping (needs the "App Track Location" right)', [201, 403].includes(tr.status), tr.status === 403 ? 'refused: grant App Track Location to field users' : 'logged');

console.table(rows);
const fails = rows.filter((r) => r.result === 'FAIL').length;
console.log(fails ? `${fails} step(s) failed` : `All ${rows.length} mobile API steps passed`);
process.exit(fails ? 1 : 0);
