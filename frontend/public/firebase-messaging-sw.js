/* eslint-env serviceworker */
/* global importScripts, firebase, clients */
/**
 * firebase-messaging-sw.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles push messages that arrive while the site is closed or in the
 * background. Must live at the site root so its scope covers every panel.
 *
 * Served straight from public/ (Vite does not process this folder), so the
 * Firebase config is inlined and the compat SDK is loaded via importScripts.
 * Web app config values are public by design — no secret is exposed here.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDUJ3WvHpjMlm1n7Sad5ogv09ylfR7CbB4',
  authDomain: 'haioncustomer.firebaseapp.com',
  projectId: 'haioncustomer',
  storageBucket: 'haioncustomer.firebasestorage.app',
  messagingSenderId: '1091063077582',
  appId: '1:1091063077582:web:c9053810b296ec4a704e9f',
  measurementId: 'G-5ZEVV8SD4P',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'Haion', {
    body: body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    // Same tag replaces an earlier notification for the same record rather
    // than stacking duplicates.
    tag: data.notificationId || data.resourceId || undefined,
    data: { link: data.link || '/' },
  });
});

// Tapping a notification focuses an already-open tab when there is one,
// otherwise opens a new tab at the notification's deep link.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(link);
          return client.focus();
        }
      }
      return clients.openWindow(link);
    })
  );
});
