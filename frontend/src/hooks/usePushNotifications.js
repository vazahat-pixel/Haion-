/**
 * usePushNotifications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Wires a signed-in session to Firebase Cloud Messaging:
 *   • refreshes the device token on load when permission is already granted
 *   • surfaces foreground messages as toasts (the service worker only fires
 *     while the tab is in the background)
 *   • exposes enable/disable for a settings toggle
 *
 * Safe to mount anywhere. Without a session, without browser support, or
 * without Firebase configured on the server it simply stays idle.
 */
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  enablePush,
  disablePush,
  syncPushToken,
  onForegroundMessage,
  getPermission,
  isPushSupported,
} from '@/services/push.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';

export function usePushNotifications({ enabled = true, panel = '' } = {}) {
  const qc = useQueryClient();
  const [permission, setPermission] = useState(() => getPermission());
  const [busy, setBusy] = useState(false);

  // Refresh the token whenever a permitted session loads — FCM rotates tokens.
  useEffect(() => {
    if (!enabled || !isPushSupported()) return;
    if (getPermission() !== 'granted') return;
    syncPushToken({ panel }).catch(() => {});
  }, [enabled, panel]);

  // Foreground delivery: show it ourselves and refresh the notification badge.
  useEffect(() => {
    if (!enabled || !isPushSupported()) return;
    let unsubscribe = () => {};
    let cancelled = false;

    onForegroundMessage((payload) => {
      const { title, body } = payload?.notification || payload?.data || {};
      if (title || body) toast.info(title || 'Notification', { description: body });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    }).then((off) => {
      if (cancelled) off();
      else unsubscribe = off;
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, qc]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await enablePush({ panel });
      setPermission(getPermission());
      if (result.ok) {
        toast.success('Notifications enabled on this device');
      } else if (result.reason === 'denied') {
        toast.error('Notifications are blocked. Allow them in your browser settings to turn this on.');
      } else if (result.reason === 'unsupported') {
        toast.error('This browser cannot receive push notifications.');
      } else {
        toast.error('Could not enable notifications. Please try again.');
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [panel]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await disablePush();
      setPermission(getPermission());
      toast.success('Notifications turned off on this device');
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    supported: isPushSupported(),
    permission,
    isEnabled: permission === 'granted',
    busy,
    enable,
    disable,
  };
}

export default usePushNotifications;
