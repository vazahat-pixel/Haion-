import { Link, useNavigate } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { useQuery } from '@tanstack/react-query';
import { customerPanelService } from '@/services/customer-panel.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';

export function CustomerAppHeader({ title, subtitle, onRefresh, isRefreshing, showNotifications = true }) {
  const portal = useCustomerPortalConfig();
  const navigate = useNavigate();

  const { data: notif } = useQuery({
    queryKey: queryKeys.customerPortal.notifications,
    queryFn: () => customerPanelService.getNotifications(),
    enabled: showNotifications,
    refetchInterval: 60_000,
  });

  return (
    <header className="customer-app-header sticky top-0 z-30 -mx-4 mb-4 border-b border-surface-3 px-4 py-3 sm:-mx-6 sm:px-6 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {portal.logoUrl ? (
            <img src={portal.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: portal.primaryColor }}
            >
              {(portal.appName || 'H').charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title || portal.appName}</p>
            {(subtitle || portal.tagline) && (
              <p className="truncate text-[11px] text-[var(--color-text-secondary)]">{subtitle || portal.tagline}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-surface-2"
              aria-label="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
          )}
          {showNotifications && (
            <button
              type="button"
              onClick={() => navigate('/customer/notifications')}
              className="relative rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-surface-2"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {(notif?.unread ?? 0) > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                  {notif.unread > 9 ? '9+' : notif.unread}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function CustomerAnnouncements() {
  const portal = useCustomerPortalConfig();
  if (!portal.announcements?.length) return null;

  return (
    <div className="space-y-2">
      {portal.announcements.map((a) => (
        <div key={a.id || a.title} className="announcement-banner rounded-lg px-3 py-2.5 text-sm">
          <p className="font-medium text-[var(--color-text-primary)]">{a.title}</p>
          {a.message && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{a.message}</p>}
        </div>
      ))}
    </div>
  );
}

export function LiveTrackingBadge({ active }) {
  if (!active) return null;
  return (
    <span className="customer-live-badge">
      <span className="live-pulse h-1.5 w-1.5 rounded-full bg-green-600" />
      Live
    </span>
  );
}

export function CustomerSupportFooter() {
  const portal = useCustomerPortalConfig();
  return (
    <div className="mt-6 rounded-xl border border-surface-3 bg-surface-1 p-4 text-center text-xs text-[var(--color-text-secondary)]">
      <p className="font-medium text-[var(--color-text-primary)]">Need help?</p>
      <p className="mt-1">
        {portal.supportPhone && <a href={`tel:${portal.supportPhone}`} className="text-brand-600 hover:underline">{portal.supportPhone}</a>}
        {portal.supportPhone && portal.supportEmail && ' · '}
        {portal.supportEmail && <a href={`mailto:${portal.supportEmail}`} className="text-brand-600 hover:underline">{portal.supportEmail}</a>}
      </p>
    </div>
  );
}
