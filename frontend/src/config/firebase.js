/**
 * firebase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase app + messaging setup for the browser.
 *
 * These values are the public web app config; they identify the project and are
 * safe to ship. Overridable through VITE_FIREBASE_* so a different project can
 * be pointed at without a code change — but note that public/firebase-messaging-sw.js
 * carries its own copy and must be edited alongside any override.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDUJ3WvHpjMlm1n7Sad5ogv09ylfR7CbB4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'haioncustomer.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'haioncustomer',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'haioncustomer.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '1091063077582',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1091063077582:web:c9053810b296ec4a704e9f',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-5ZEVV8SD4P',
};

/** Public VAPID key — required to mint web push tokens. */
export const vapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BA0J_hGT2jGrFLQyS7o5PKlKYeuBE5bvHnxPUVclKkKtTnF0bdRhWpab_dWRYwab574tAZBBx2G1ueK0EF9k3M8';

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Messaging instance, or null where the browser cannot support it (Safari in
 * private mode, http:// origins other than localhost, older browsers).
 * Callers must treat null as "push unavailable", never as an error.
 */
export async function getMessagingIfSupported() {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    if (!(await isSupported())) return null;
    return getMessaging(getFirebaseApp());
  } catch (err) {
    console.warn('[Push] messaging unavailable:', err?.message);
    return null;
  }
}
