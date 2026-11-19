import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import { NetworkError, createQueue } from './queue';

/** Same API as the web Distributor panel: /api/auth/* for sign-in, /api/dms/* for everything else. */
export class ApiError extends Error {
  constructor(status, message, errors) { super(message); this.status = status; this.errors = errors; }
}

let token = null;
let onSessionLost = () => {};
export const setSessionLostHandler = (fn) => { onSessionLost = fn; };

async function raw(path, opts = {}) {
  try {
    return await fetch(`${API_URL}${path}`, { credentials: 'include', ...opts });
  } catch {
    throw new NetworkError('Cannot reach the server. Check your internet connection.');
  }
}

async function refresh() {
  const r = await raw('/auth/refresh-token', { method: 'POST', headers: { 'X-Panel': 'distributor' } });
  if (!r.ok) return false;
  const body = await r.json().catch(() => null);
  if (!body?.data?.accessToken) return false;
  token = body.data.accessToken;
  await SecureStore.setItemAsync('dms_token', token);
  return true;
}

export async function request(method, path, body, { retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Panel': 'distributor' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await raw(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (r.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refresh()) return request(method, path, body, { retry: false });
    await clearSession();
    onSessionLost();
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, json?.message || `Request failed (${r.status})`, json?.errors);
  return json;
}
export const get = (p) => request('GET', p).then((j) => j.data);
export const post = (p, b) => request('POST', p, b).then((j) => j.data);

export async function uploadPhoto(uri) {
  const form = new FormData();
  form.append('photo', { uri, name: 'selfie.jpg', type: 'image/jpeg' });
  const send = () => raw('/dms/entities/attendance-photo', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  let r = await send();
  if (r.status === 401 && (await refresh())) r = await send();
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, json?.message || 'Photo upload failed');
  return json.data.url;
}

export async function login(loginId, password) {
  const r = await raw('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginId.trim(), password }) });
  const json = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, json?.message || 'Sign-in failed');
  token = json.data.accessToken;
  await SecureStore.setItemAsync('dms_token', token);
  const me = await get('/dms/me');
  await SecureStore.setItemAsync('dms_me', JSON.stringify(me));
  return me;
}

export async function restoreSession() {
  token = await SecureStore.getItemAsync('dms_token');
  const me = await SecureStore.getItemAsync('dms_me');
  if (!token || !me) return null;
  try { return await get('/dms/me'); } catch (e) { if (e.network) return JSON.parse(me); return null; }
}

export async function clearSession() {
  token = null;
  await SecureStore.deleteItemAsync('dms_token');
  await SecureStore.deleteItemAsync('dms_me');
}
export async function logout() {
  try { await raw('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch { /* offline logout still clears the device */ }
  await clearSession();
}

/** Sends one queued item. `punch` items upload their selfie first. */
async function send(item) {
  if (item.type === 'punch') {
    const image = item.photoUri && !item.photoUrl ? await uploadPhoto(item.photoUri) : item.photoUrl || '';
    return post('/dms/entities/attendance-punch', { kind: item.kind, address: item.address, lat: item.lat, lng: item.lng, image, capturedAt: item.capturedAt });
  }
  return request(item.method || 'POST', item.path, item.body);
}

export const queue = createQueue(AsyncStorage, send);
