/**
 * PushNotificationBridge.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted once for the whole app. Keeps the signed-in user's FCM token fresh
 * and turns foreground pushes into toasts.
 *
 * Renders nothing and never blocks: with no session, an unsupported browser, or
 * push disabled on the server it simply does nothing.
 */
import { useAuthStore } from '@/store/auth.store';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationBridge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const panel = useAuthStore((s) => s.panel);

  usePushNotifications({ enabled: isAuthenticated, panel: panel || '' });

  return null;
}

export default PushNotificationBridge;
