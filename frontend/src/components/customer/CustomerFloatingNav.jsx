import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { customerPanelService } from '@/services/customer-panel.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';
import { customerSpring } from '@/animations/customer.motion';

function NavIconButton({ children, onClick, label, badge }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.94 }}
      transition={customerSpring.snappy}
      className="customer-floating-nav__btn relative flex h-8 w-8 items-center justify-center rounded-lg"
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--customer-primary)] px-1 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  );
}

export function CustomerFloatingNav({ onRefresh, isRefreshing, liveActive, profile }) {
  const portal = useCustomerPortalConfig();
  const navigate = useNavigate();

  const { data: notif } = useQuery({
    queryKey: queryKeys.customerPortal.notifications,
    queryFn: () => customerPanelService.getNotifications(),
    refetchInterval: 60_000,
  });

  const firstName = profile?.name?.split(' ')[0] || 'Dashboard';
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  const initial = (profile?.name || 'C').charAt(0).toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={customerSpring.smooth}
      className="customer-floating-nav fixed left-0 right-0 top-0 z-50 px-3 pt-2 sm:px-4"
    >
      <div className="customer-floating-nav__bar mx-auto flex max-w-lg items-center justify-between gap-2 rounded-2xl px-3 py-2 sm:max-w-2xl lg:max-w-5xl">
        {/* Left: greeting + avatar — fills awkward empty space */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${portal.primaryColor}, color-mix(in srgb, ${portal.primaryColor} 75%, #3f3f46))` }}
          >
            {initial}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
              <p className="customer-floating-nav__greeting truncate text-sm font-semibold">{firstName}</p>
              {liveActive && (
                <span className="customer-live-badge shrink-0">
                  <span className="live-pulse h-1.5 w-1.5 rounded-full bg-green-600" />
                  Live
                </span>
              )}
            </div>
            <p className="customer-floating-nav__meta truncate text-[10px]">
              {today}{profile?.code ? ` · ${profile.code}` : ''}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1">
          <NavIconButton label="Search" onClick={() => navigate('/customer/warranty/lookup')}>
            <Search className="h-3.5 w-3.5" />
          </NavIconButton>
          {onRefresh && (
            <NavIconButton label="Refresh" onClick={onRefresh}>
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            </NavIconButton>
          )}
          <NavIconButton
            label="Notifications"
            badge={notif?.unread ?? 0}
            onClick={() => navigate('/customer/notifications')}
          >
            <Bell className="h-3.5 w-3.5" />
          </NavIconButton>
        </div>
      </div>
    </motion.header>
  );
}
