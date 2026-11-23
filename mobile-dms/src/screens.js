import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, Alert, RefreshControl, Image } from 'react-native';
import { get, post, login, queue } from './api';
import { currentPlace, takeSelfie } from './device';
import { s, Header, Button, Field, Choice, Card, Muted, Err, isoDate, validDate } from './ui';
import { COLORS, API_URL } from './config';

const fmtTime = (v) => (v ? new Date(v).toLocaleString('en-IN', { hour12: true }) : '—');

/* ───────── Login ───────── */
export function LoginScreen({ onSignedIn }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    if (!id.trim() || !pw) { setErr('Enter your Login ID and password.'); return; }
    setBusy(true);
    try { onSignedIn(await login(id, pw)); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <View style={s.screen}>
      <Header title="Distributor DMS — Field App" />
      <View style={s.body}>
        <Field label="Login ID / e-mail" value={id} onChangeText={setId} autoCapitalize="characters" autoCorrect={false} textContentType="username" />
        <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry textContentType="password" onSubmitEditing={submit} />
        <Err>{err}</Err>
        <Button title="Sign in" onPress={submit} busy={busy} />
        <Muted>Server: {API_URL}</Muted>
      </View>
    </View>
  );
}

/* ───────── Home ───────── */
export function HomeScreen({ me, go, onLogout, pending, today }) {
  const tiles = [
    ['attendance', 'Attendance', 'e_attendance'], ['beat', 'My Beat Plan', 'my_beat'], ['tasks', 'My Tasks', 'my_beat'], ['leave', 'Leave', 'e_leave'],
    ['tada', 'TA / DA', 'e_tada'], ['feedback', 'Feedback', 'app_feedback'], ['sync', `Sync (${pending})`, null],
  ].filter(([, , page]) => !page || me.isAdmin || me.pages.includes(page));
  return (
    <View style={s.screen}>
      <Header title={me.displayName} right={<Text style={{ color: '#fff' }} onPress={onLogout}>Logout</Text>} />
      <ScrollView contentContainerStyle={s.body}>
        <Card title={`${me.loginId}${me.location ? ` · ${me.location.name}` : ''}`}>
          <Muted>Today: {today?.inAt ? `in ${fmtTime(today.inAt)}` : 'not logged in'}{today?.outAt ? ` · out ${fmtTime(today.outAt)}` : ''}</Muted>
          {pending ? <Text style={{ color: COLORS.danger, marginTop: 4 }}>{pending} action(s) waiting to sync</Text> : null}
        </Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          {tiles.map(([key, label]) => (
            <Text key={key} onPress={() => go(key)} accessibilityRole="button" style={[s.tile, { color: '#fff', fontWeight: '700', textAlignVertical: 'bottom' }]}>{label}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/* ───────── Attendance: selfie + GPS, works offline ───────── */
export function AttendanceScreen({ back, today, refreshToday, afterQueue }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const punch = async (kind) => {
    setMsg(''); setBusy(true);
    try {
      const photoUri = await takeSelfie();
      if (!photoUri) { setBusy(false); return; }
      const place = await currentPlace();
      await queue.add({ type: 'punch', kind, photoUri, ...place, capturedAt: new Date().toISOString(), label: `Attendance ${kind.toUpperCase()}` });
      const r = await queue.flush();
      await afterQueue();
      setMsg(r.pending ? 'Saved on the phone. It will sync when you are online.' : r.failed ? 'The server refused it — see Sync.' : `Marked ${kind === 'in' ? 'IN' : 'OUT'} at ${place.address}`);
      await refreshToday();
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  return (
    <View style={s.screen}>
      <Header title="Attendance" onBack={back} />
      <ScrollView contentContainerStyle={s.body}>
        <Card title="Today">
          <Muted>IN: {fmtTime(today?.inAt)} {today?.inAddress ? `— ${today.inAddress}` : ''}</Muted>
          <Muted>OUT: {fmtTime(today?.outAt)} {today?.outAddress ? `— ${today.outAddress}` : ''}</Muted>
          {today?.inImage ? <Image source={{ uri: API_URL.replace(/\/api$/, '') + today.inImage }} style={{ width: 72, height: 72, borderRadius: 36, marginTop: 8 }} /> : null}
        </Card>
        <Button title="Login (selfie + location)" color={COLORS.success} onPress={() => punch('in')} disabled={Boolean(today?.inAt)} busy={busy} />
        <Button title="Logout (selfie + location)" color={COLORS.danger} onPress={() => punch('out')} disabled={!today?.inAt || Boolean(today?.outAt)} busy={busy} />
        {msg ? <Card><Text>{msg}</Text></Card> : null}
        <Muted>While you are logged in and the app is open, your location is logged every 5 minutes (App Track Location).</Muted>
      </ScrollView>
    </View>
  );
}

/* ───────── generic list helper ───────── */
function useList(path) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try { setRows(await get(path)); } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { rows, err, loading, load };
}

/* ───────── Beat plan ───────── */
export function BeatScreen({ back, afterQueue }) {
  const { rows, err, loading, load } = useList('/dms/entities/beat?view=mine&perPage=50&sortBy=date');
  const [dev, setDev] = useState(null);
  const visit = async (b) => {
    await queue.add({ path: `/dms/entities/beat/${b._id}/action`, body: { action: 'visit' }, label: `Visit ${b.data.area}` });
    try { const place = await currentPlace(); await queue.add({ path: '/dms/entities/track', body: { address: `Visit: ${b.data.area} — ${place.address}`, lat: place.lat, lng: place.lng, travelDate: isoDate(), travelTime: new Date().toTimeString().slice(0, 5) }, label: 'Visit location' }); } catch { /* location optional for a visit */ }
    await queue.flush(); await afterQueue(); load();
  };
  const sendDev = async () => {
    if (!dev.changeVisit.trim() || !dev.requestRemark.trim()) { Alert.alert('Fill both fields'); return; }
    try { await post(`/dms/entities/beat/${dev.id}/deviate`, { changeVisit: dev.changeVisit, requestRemark: dev.requestRemark }); setDev(null); load(); Alert.alert('Request sent for approval'); } catch (e) { Alert.alert(e.message); }
  };
  return (
    <View style={s.screen}>
      <Header title="My Beat Plan" onBack={back} />
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Err>{err}</Err>
        {!loading && !rows.length ? <Muted>No beats scheduled for you.</Muted> : null}
        {rows.map((b) => (
          <Card key={b._id} title={`${b.data.date} · ${b.data.task}`}>
            <Text>{b.data.area}</Text>
            <Muted>Status: {b.status}</Muted>
            {b.status === 'Scheduled' ? (
              <View style={[s.row, { marginTop: 8 }]}>
                <View style={{ flex: 1 }}><Button title="Mark visited" onPress={() => visit(b)} /></View>
                <View style={{ flex: 1 }}><Button title="Change visit" color={COLORS.muted} onPress={() => setDev({ id: b._id, changeVisit: '', requestRemark: '' })} /></View>
              </View>
            ) : null}
            {dev?.id === b._id ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Field label="Change visit to" value={dev.changeVisit} onChangeText={(v) => setDev({ ...dev, changeVisit: v })} />
                <Field label="Reason" value={dev.requestRemark} onChangeText={(v) => setDev({ ...dev, requestRemark: v })} />
                <Button title="Send for approval" onPress={sendDev} />
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

/* ───────── Tasks ───────── */
export function TasksScreen({ back }) {
  const { rows, err, loading, load } = useList('/dms/entities/apptask?view=mine&perPage=50');
  const setStatus = async (t, status) => { try { await post(`/dms/entities/apptask/${t._id}/action`, { action: 'setStatus', status }); load(); } catch (e) { Alert.alert(e.message); } };
  return (
    <View style={s.screen}>
      <Header title="My Tasks" onBack={back} />
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Err>{err}</Err>
        {!loading && !rows.length ? <Muted>No tasks assigned to you.</Muted> : null}
        {rows.map((t) => (
          <Card key={t._id} title={`${t.data.taskName} — ${t.data.subject}`}>
            {t.data.details ? <Text>{t.data.details}</Text> : null}
            <Muted>Status: {t.status}</Muted>
            {t.status !== 'Done' ? (
              <View style={[s.row, { marginTop: 8 }]}>
                {['Open', 'In-Progress', 'Done'].filter((x) => x !== t.status).map((x) => <View key={x} style={{ flex: 1 }}><Button title={x} onPress={() => setStatus(t, x)} /></View>)}
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

/* ───────── Leave ───────── */
export function LeaveScreen({ back }) {
  const { rows, err, loading, load } = useList('/dms/entities/leave?view=mine&perPage=50');
  const [types, setTypes] = useState([]);
  const [f, setF] = useState({ leaveType: '', fromDate: isoDate(), toDate: isoDate(), purpose: '' });
  const [fe, setFe] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { get('/dms/entities/options/leavetype').then(setTypes).catch(() => {}); }, []);
  const apply = async () => {
    const e = {};
    if (!f.leaveType) e.leaveType = 'Choose a leave type';
    if (!validDate(f.fromDate)) e.fromDate = 'YYYY-MM-DD';
    if (!validDate(f.toDate)) e.toDate = 'YYYY-MM-DD';
    if (!f.purpose.trim()) e.purpose = 'Required';
    setFe(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { await post('/dms/entities/leave', f); setF({ ...f, purpose: '' }); load(); Alert.alert('Leave applied'); } catch (x) { setFe(Object.fromEntries(Object.entries(x.errors || {}).map(([k, v]) => [k, v[0]]))); Alert.alert(x.message); } finally { setBusy(false); }
  };
  return (
    <View style={s.screen}>
      <Header title="Leave" onBack={back} />
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Card title="Apply">
          <View style={{ gap: 8 }}>
            <Choice label="Type of leave" options={types} value={f.leaveType} onChange={(v) => setF({ ...f, leaveType: v })} />
            <Err>{fe.leaveType}</Err>
            <Field label="From (YYYY-MM-DD)" value={f.fromDate} onChangeText={(v) => setF({ ...f, fromDate: v })} error={fe.fromDate} />
            <Field label="To (YYYY-MM-DD)" value={f.toDate} onChangeText={(v) => setF({ ...f, toDate: v })} error={fe.toDate} />
            <Field label="Purpose" value={f.purpose} onChangeText={(v) => setF({ ...f, purpose: v })} error={fe.purpose} multiline />
            <Button title="Apply" onPress={apply} busy={busy} />
          </View>
        </Card>
        <Err>{err}</Err>
        {rows.map((l) => <Card key={l._id} title={`${l.data.leaveType_label} · ${l.data.fromDate} → ${l.data.toDate}`}><Muted>{l.data.duration} day(s) · {l.status}</Muted></Card>)}
      </ScrollView>
    </View>
  );
}

/* ───────── TA / DA ───────── */
export function TadaScreen({ back }) {
  const { rows, err, loading, load } = useList('/dms/entities/tada?view=mine&perPage=50');
  const [f, setF] = useState({ date: isoDate(), fromPlace: '', toPlace: '', distanceKm: '', travelAmount: '', daAmount: '', remark: '' });
  const [busy, setBusy] = useState(false);
  const [fe, setFe] = useState({});
  const submit = async () => {
    const e = {};
    if (!validDate(f.date)) e.date = 'YYYY-MM-DD';
    for (const k of ['fromPlace', 'toPlace']) if (!f[k].trim()) e[k] = 'Required';
    if (!(Number(f.travelAmount) >= 0) || f.travelAmount === '') e.travelAmount = 'Enter an amount';
    setFe(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { await post('/dms/entities/tada', { ...f, distanceKm: f.distanceKm ? Number(f.distanceKm) : undefined, travelAmount: Number(f.travelAmount), daAmount: f.daAmount ? Number(f.daAmount) : 0 }); load(); Alert.alert('Submitted for approval'); } catch (x) { Alert.alert(x.message); } finally { setBusy(false); }
  };
  return (
    <View style={s.screen}>
      <Header title="TA / DA" onBack={back} />
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Card title="New claim">
          <View style={{ gap: 8 }}>
            <Field label="Date (YYYY-MM-DD)" value={f.date} onChangeText={(v) => setF({ ...f, date: v })} error={fe.date} />
            <Field label="From place" value={f.fromPlace} onChangeText={(v) => setF({ ...f, fromPlace: v })} error={fe.fromPlace} />
            <Field label="To place" value={f.toPlace} onChangeText={(v) => setF({ ...f, toPlace: v })} error={fe.toPlace} />
            <Field label="Distance (km)" value={f.distanceKm} onChangeText={(v) => setF({ ...f, distanceKm: v })} keyboardType="numeric" />
            <Field label="Travel amount (₹)" value={f.travelAmount} onChangeText={(v) => setF({ ...f, travelAmount: v })} keyboardType="numeric" error={fe.travelAmount} />
            <Field label="DA amount (₹)" value={f.daAmount} onChangeText={(v) => setF({ ...f, daAmount: v })} keyboardType="numeric" />
            <Field label="Remark" value={f.remark} onChangeText={(v) => setF({ ...f, remark: v })} />
            <Button title="Submit" onPress={submit} busy={busy} />
          </View>
        </Card>
        <Err>{err}</Err>
        {rows.map((t) => <Card key={t._id} title={`${t.docNo} · ${t.data.date}`}><Muted>{t.data.fromPlace} → {t.data.toPlace} · ₹{t.data.amount} · {t.status}</Muted></Card>)}
      </ScrollView>
    </View>
  );
}

/* ───────── Feedback (queued) ───────── */
export function FeedbackScreen({ back, afterQueue }) {
  const [f, setF] = useState({ feedbackType: 'General', subject: '', feedback: '' });
  const [msg, setMsg] = useState('');
  const submit = async () => {
    if (!f.subject.trim() || !f.feedback.trim()) { setMsg('Subject and feedback are required.'); return; }
    let address = '';
    try { address = (await currentPlace()).address; } catch { /* optional */ }
    await queue.add({ path: '/dms/entities/appfeedback', body: { ...f, address, date: isoDate() }, label: `Feedback: ${f.subject}` });
    const r = await queue.flush(); await afterQueue();
    setMsg(r.pending ? 'Saved; will be sent when online.' : r.failed ? 'Refused by the server — see Sync.' : 'Feedback sent.');
    setF({ feedbackType: 'General', subject: '', feedback: '' });
  };
  return (
    <View style={s.screen}>
      <Header title="Feedback" onBack={back} />
      <ScrollView contentContainerStyle={s.body}>
        <Choice label="Type" options={['Complaints', 'General', 'Query'].map((x) => ({ value: x, label: x }))} value={f.feedbackType} onChange={(v) => setF({ ...f, feedbackType: v })} />
        <Field label="Subject" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} />
        <Field label="Feedback" value={f.feedback} onChangeText={(v) => setF({ ...f, feedback: v })} multiline numberOfLines={4} />
        <Button title="Send" onPress={submit} />
        {msg ? <Muted>{msg}</Muted> : null}
      </ScrollView>
    </View>
  );
}

/* ───────── Sync queue ───────── */
export function SyncScreen({ back, afterQueue }) {
  const [items, setItems] = useState([]);
  const [failed, setFailed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => { setItems(await queue.items()); setFailed(await queue.failed()); }, []);
  useEffect(() => { load(); }, [load]);
  const sync = async () => { setBusy(true); const r = await queue.flush(); setMsg(`Sent ${r.sent}, failed ${r.failed}, waiting ${r.pending}`); await load(); await afterQueue(); setBusy(false); };
  return (
    <View style={s.screen}>
      <Header title="Sync" onBack={back} />
      <ScrollView contentContainerStyle={s.body}>
        <Button title="Sync now" onPress={sync} busy={busy} />
        {msg ? <Muted>{msg}</Muted> : null}
        <Text style={s.cardTitle}>Waiting ({items.length})</Text>
        {items.map((i) => <Card key={i.id} title={i.label || i.path}><Muted>{fmtTime(i.queuedAt)}{i.lastError ? ` · ${i.lastError}` : ''}</Muted></Card>)}
        <Text style={s.cardTitle}>Refused by server ({failed.length})</Text>
        {failed.map((i) => <Card key={i.id} title={i.label || i.path}><Text style={{ color: COLORS.danger }}>{i.error}</Text><Muted>{fmtTime(i.failedAt)}</Muted></Card>)}
        {failed.length ? <Button title="Clear refused items" color={COLORS.muted} onPress={async () => { await queue.clearFailed(); load(); }} /> : null}
      </ScrollView>
    </View>
  );
}
