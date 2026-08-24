/**
 * push.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Browser side of push notifications: registers the service worker, mints an
 * FCM token, and hands it to the backend so it can be targeted later.
 *
 * Every function degrades quietly. A browser that blocks notifications, an
 * unsupported platform, or a server without Firebase configured must all leave
 * the app fully usable.
 */
import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import client from './api/client';
import { getMessagingIfSupported, vapidKey } from '@/config/firebase';

const SW_PATH = '/firebase-messaging-sw.js';
/** Remembered so we can tell the backend which token to drop on logout. */
const TOKEN_STORAGE_KEY = 'haion.push.token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* private mode — token simply won't survive a reload */
  }
}

/**
 * Which kind of install is this — a plain browser, or the web app running
 * inside a native shell? Both use the same FCM token, but the server records
 * the difference so a message can be shaped per platform later.
 */
export function detectPlatform() {
  if (typeof window === 'undefined') return 'WEB';
  // Capacitor / Cordova / React Native inject a bridge onto window.
  if (window.Capacitor || window.cordova || window.ReactNativeWebView) return 'APP';
  return 'WEB';
}

/** Can this browser do web push at all? */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function getPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function registerServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: '/' });
}

/**
 * Ask for permission (if not already decided), mint a token, and register it
 * against the signed-in user. Returns { ok, token, reason }.
 */
export async function enablePush({ panel, platform } = {}) {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: permission };

  const messaging = await getMessagingIfSupported();
  if (!messaging) return { ok: false, reason: 'unsupported' };

  try {
    const registration = await registerServiceWorker();
    // Wait for the worker to be active, otherwise getToken can race it.
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return { ok: false, reason: 'no-token' };

    await client.post('/notifications/devices', {
      token,
      platform: platform || detectPlatform(),
      panel: panel || '',
    });
    storeToken(token);
    return { ok: true, token };
  } catch (err) {
    console.error('[Push] enable failed:', err);
    return { ok: false, reason: err?.message || 'failed' };
  }
}

/** Drop this device's token — call on logout or when the user turns push off. */
export async function disablePush() {
  const token = getStoredToken();
  try {
    if (token) await client.delete('/notifications/devices', { data: { token } });
  } catch {
    /* server-side cleanup is best effort */
  }
  try {
    const messaging = await getMessagingIfSupported();
    if (messaging) await deleteToken(messaging);
  } catch {
    /* token may already be gone */
  }
  storeToken(null);
}

/**
 * If the user already granted permission, silently refresh the token on load.
 * FCM tokens rotate, so this keeps the backend's copy current.
 */
export async function syncPushToken({ panel, platform } = {}) {
  if (getPermission() !== 'granted') return { ok: false, reason: 'not-granted' };
  return enablePush({ panel, platform });
}

/**
 * Foreground messages: the service worker does not fire while the tab is
 * focused, so the app shows these itself. Returns an unsubscribe function.
 */
export async function onForegroundMessage(handler) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

/** Server-side push status — is Firebase configured on the backend? */
export async function fetchPushStatus() {
  const res = await client.get('/notifications/push-status');
  return res.normalized?.data ?? res.data?.data;
}

/** Ask the server to push a test message to this user's devices. */
export async function sendTestPush() {
  const res = await client.post('/notifications/test-push', {});
  return res.normalized?.data ?? res.data?.data;
}
