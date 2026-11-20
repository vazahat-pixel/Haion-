import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { restoreSession, logout, get, queue, setSessionLostHandler } from './src/api';
import { currentPlace } from './src/device';
import { TRACK_INTERVAL_MS } from './src/config';
import { isoDate } from './src/ui';
import { LoginScreen, HomeScreen, AttendanceScreen, BeatScreen, TasksScreen, LeaveScreen, TadaScreen, FeedbackScreen, SyncScreen } from './src/screens';

export default function App() {
  const [me, setMe] = useState(undefined); // undefined = loading, null = signed out
  const [screen, setScreen] = useState('home');
  const [pending, setPending] = useState(0);
  const [today, setToday] = useState(null);
  const appState = useRef(AppState.currentState);

  const afterQueue = useCallback(async () => setPending((await queue.items()).length), []);
  const refreshToday = useCallback(async () => {
    try { setToday((await get('/dms/entities/attendance-today'))?.data || null); } catch { /* offline or no right */ }
  }, []);

  useEffect(() => {
    setSessionLostHandler(() => setMe(null));
    restoreSession().then((m) => setMe(m || null));
  }, []);
  useEffect(() => { if (me) { refreshToday(); afterQueue(); } }, [me, refreshToday, afterQueue]);

  // send queued actions whenever connectivity returns or the app comes to the foreground
  useEffect(() => {
    if (!me) return undefined;
    const unNet = NetInfo.addEventListener((st) => { if (st.isConnected) queue.flush().then(afterQueue); });
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') { queue.flush().then(afterQueue); refreshToday(); }
      appState.current = next;
    });
    return () => { unNet(); sub.remove(); };
  }, [me, afterQueue, refreshToday]);

  // foreground location log while on duty (logged in, not yet logged out)
  useEffect(() => {
    if (!me || !today?.inAt || today?.outAt) return undefined;
    if (!(me.isAdmin || me.pages.includes('app_track'))) return undefined;
    const ping = async () => {
      if (appState.current !== 'active') return;
      try {
        const p = await currentPlace();
        await queue.add({ path: '/dms/entities/track', body: { address: p.address, lat: p.lat, lng: p.lng, travelDate: isoDate(), travelTime: new Date().toTimeString().slice(0, 5) }, label: 'Location ping' });
        await queue.flush(); afterQueue();
      } catch { /* permission refused or no fix: skip this ping */ }
    };
    const t = setInterval(ping, TRACK_INTERVAL_MS);
    return () => clearInterval(t);
  }, [me, today, afterQueue]);

  if (me === undefined) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  if (!me) return <><StatusBar style="light" /><LoginScreen onSignedIn={(m) => { setMe(m); setScreen('home'); }} /></>;

  const back = () => { setScreen('home'); refreshToday(); afterQueue(); };
  const common = { back, afterQueue };
  const view = {
    home: <HomeScreen me={me} go={setScreen} pending={pending} today={today} onLogout={async () => { await logout(); setMe(null); }} />,
    attendance: <AttendanceScreen {...common} today={today} refreshToday={refreshToday} />,
    beat: <BeatScreen {...common} />,
    tasks: <TasksScreen {...common} />,
    leave: <LeaveScreen {...common} />,
    tada: <TadaScreen {...common} />,
    feedback: <FeedbackScreen {...common} />,
    sync: <SyncScreen {...common} />,
  }[screen];
  return <><StatusBar style="light" />{view}</>;
}
