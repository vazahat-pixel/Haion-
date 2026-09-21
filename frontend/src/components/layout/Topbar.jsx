import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, Search, Bell, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/features/theme-switcher/ThemeToggle';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { GlobalSearchDialog } from '@/components/layout/GlobalSearchDialog';
import { notificationsService } from '@/services/notifications.service';
import { hrmsService } from '@/services/hrms.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';
import RealtimeAttendanceModal from '@/components/shared/RealtimeAttendanceModal';
import { ROLES } from '@/constants/roles';

// Roles that should show the attendance punch widget
const EMPLOYEE_ROLES = [
  ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.CEO, ROLES.NSM, ROLES.STATE_HEAD,
  ROLES.ASM, ROLES.STORE_MANAGER, ROLES.WAREHOUSE_MANAGER,
  ROLES.CUSTOMER_SUPPORT, ROLES.SERVICE_CENTER,
];

function formatShiftDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600).toString().padStart(2, '0');
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function Topbar({ panel, className }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { toggleMobile, toggleCollapse, isCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  // ── Real-Time Attendance Status ───────────────────────────────────────────
  const showPunchWidget = !!user && EMPLOYEE_ROLES.includes(user.role);

  const { data: todayAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', 'today', user?._id],
    queryFn: () => hrmsService.getMyAttendanceToday(),
    enabled: showPunchWidget,
    refetchInterval: 60_000,
    retry: 1,
  });

  const isPunchedIn = todayAttendance?.isPunchedIn || false;
  const checkInTime = todayAttendance?.checkInTime;
  const workMode = todayAttendance?.record?.workMode;

  // Live shift duration timer
  useEffect(() => {
    if (isPunchedIn && checkInTime) {
      const tick = () => setElapsed(Date.now() - new Date(checkInTime).getTime());
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isPunchedIn, checkInTime]);

  const unreadCount = unread?.count ?? 0;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <>
      <header
        className={cn(
          'fixed right-0 top-0 z-sticky flex h-[var(--topbar-height)] items-center justify-between border-b border-surface-3 glass-panel px-3',
          isCollapsed ? 'left-0 lg:left-[var(--sidebar-width-collapsed)]' : 'left-0 lg:left-[var(--sidebar-width)]',
          className
        )}
      >
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={toggleMobile}>
            <Menu className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden h-8 w-8 lg:flex" onClick={toggleCollapse}>
            <Menu className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="relative hidden sm:flex items-center gap-2.5 h-8 w-60 md:w-80 lg:w-96 rounded-xl border border-surface-3/80 bg-surface-2/60 px-3 text-xs text-[var(--color-text-tertiary)] hover:border-brand-500/50 hover:bg-surface-2 transition-all duration-200 shadow-inner group cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-brand-500 group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-left truncate font-medium">Search modules, pages, dealers, orders...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-surface-3 bg-surface-1 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)] shadow-xs">
              <span className="text-[9px]">Ctrl</span> K
            </kbd>
          </button>
          <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 text-[var(--color-text-secondary)]" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4 text-brand-500" />
          </Button>
          <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} panel={panel} />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* ── Live Attendance Punch Widget ──────────────────────────────── */}
          {showPunchWidget && (
            <button
              id="topbar-attendance-punch-btn"
              type="button"
              onClick={() => setAttendanceOpen(true)}
              title={isPunchedIn ? 'Click to manage attendance' : 'Click to punch in'}
              className={cn(
                'hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-xl border text-xs font-semibold transition-all duration-200',
                isPunchedIn
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-surface-3 bg-surface-2/60 text-[var(--color-text-secondary)] hover:border-brand-500/40 hover:text-brand-400'
              )}
            >
              {isPunchedIn ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono tabular-nums">{formatShiftDuration(elapsed)}</span>
                  <span className="text-[10px] text-emerald-300 opacity-80">
                    {workMode === 'FIELD' ? '🚗 Field' : '🏢 Office'}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Punch In</span>
                </>
              )}
            </button>
          )}

          {/* Mobile punch icon button */}
          {showPunchWidget && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'sm:hidden h-8 w-8 relative',
                isPunchedIn ? 'text-emerald-400' : 'text-[var(--color-text-secondary)]'
              )}
              onClick={() => setAttendanceOpen(true)}
            >
              <Clock className="h-4 w-4" />
              {isPunchedIn && (
                <span className="absolute right-1 top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setNotifOpen(true)}>
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-500 px-0.5 text-[8px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
          <div className="ml-1 flex items-center gap-2 border-l border-surface-3 pl-2">
            <button
              type="button"
              onClick={() => panel === 'admin' && navigate('/admin/business/manage')}
              className={cn('flex items-center gap-2 rounded-md px-1.5 py-0.5 group', panel === 'admin' && 'transition-colors hover:bg-surface-2')}
              title="Profile & Settings"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-brand-5 text-[10px] font-medium text-brand-700">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left mr-0.5">
                <p className="text-[12px] font-medium leading-none text-[var(--color-text-primary)]">{user?.name}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <Settings className="h-3.5 w-3.5 hidden md:block text-[var(--color-text-secondary)] opacity-60 group-hover:opacity-100 transition-all duration-150" />
            </button>
            <Button variant="ghost" size="sm" onClick={logout} className="hidden h-7 md:inline-flex text-[11px] text-[var(--color-text-secondary)]">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ── Attendance Modal ── */}
      {showPunchWidget && (
        <RealtimeAttendanceModal
          open={attendanceOpen}
          onOpenChange={setAttendanceOpen}
          onPunchChange={() => refetchAttendance()}
        />
      )}
    </>
  );
}
