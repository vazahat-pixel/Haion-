/**
 * PushSettingsCard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets a user turn browser push on for the device they are sitting at, and send
 * themselves a test message to prove the whole chain works.
 *
 * Hides itself when the browser cannot do push or the server has no Firebase
 * credentials, so it never advertises something that cannot work.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, BellRing, Send, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { fetchPushStatus, sendTestPush } from '@/services/push.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/utils/toast';

export function PushSettingsCard() {
  const panel = useAuthStore((s) => s.panel);
  const { supported, permission, isEnabled, busy, enable, disable } = usePushNotifications({
    enabled: false, // the app-wide bridge already owns the listeners
    panel: panel || '',
  });
  const [testing, setTesting] = useState(false);

  const { data: status, refetch } = useQuery({
    queryKey: ['push-status'],
    queryFn: fetchPushStatus,
    staleTime: 60_000,
  });

  if (!supported) return null;

  const handleEnable = async () => {
    const res = await enable();
    if (res?.ok) refetch();
  };

  const handleDisable = async () => {
    await disable();
    refetch();
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await sendTestPush();
      toast.success(
        res?.sent > 0
          ? `Test sent to ${res.sent} device${res.sent === 1 ? '' : 's'}`
          : 'Test accepted but nothing was delivered — try re-enabling notifications'
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Test push failed');
    } finally {
      setTesting(false);
    }
  };

  const serverReady = status?.enabled !== false;

  return (
    <div className="mb-4 rounded-lg border border-surface-3 bg-surface-2 p-3">
      <div className="flex items-start gap-2.5">
        {isEnabled ? (
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        ) : (
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Push notifications {isEnabled ? 'on' : 'off'} for this device
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {permission === 'denied'
              ? 'Blocked in your browser. Allow notifications for this site, then reload.'
              : isEnabled
                ? 'You will be alerted even when this tab is closed.'
                : 'Get alerted about updates even when this tab is closed.'}
          </p>

          {!serverReady && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Push is not configured on the server yet, so nothing will be delivered.
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-2">
            {isEnabled ? (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy} onClick={handleDisable}>
                  <BellOff className="mr-1.5 h-3.5 w-3.5" />
                  Turn off
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={testing || !serverReady}
                  onClick={handleTest}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {testing ? 'Sending…' : 'Send test'}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={busy || permission === 'denied'}
                onClick={handleEnable}
              >
                <BellRing className="mr-1.5 h-3.5 w-3.5" />
                {busy ? 'Enabling…' : 'Enable notifications'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PushSettingsCard;
