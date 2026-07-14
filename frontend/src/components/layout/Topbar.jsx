import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/features/theme-switcher/ThemeToggle';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { GlobalSearchDialog } from '@/components/layout/GlobalSearchDialog';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';

export function Topbar({ panel, className }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    refetchInterval: 60_000,
  });
  const unreadCount = unread?.count ?? 0;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
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
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex h-7 gap-1.5 text-[var(--color-text-tertiary)]"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-3 w-3" />
          <span className="text-[11px]">Search</span>
          <kbd className="ml-1 rounded border border-surface-3 bg-surface-2 px-1 py-px text-[9px] font-mono">⌘K</kbd>
        </Button>
        <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
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
  );
}
