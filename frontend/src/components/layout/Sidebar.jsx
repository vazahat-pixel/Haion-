import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useSidebar } from '@/hooks/useSidebar';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { getNavForPanel, PANELS } from '@/config/panels.config';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { appConfig } from '@/config/app.config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Package, Settings } from 'lucide-react';

export function Sidebar({ panel, className }) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const { hasPermission } = usePermission();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const panelConfig = PANELS[panel];
  const navItems = getNavForPanel(panel, user?.role, hasPermission);
  const badges = useSidebarBadges(panel);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-sidebar bg-[var(--color-surface-overlay)] backdrop-blur-[2px] transition-opacity duration-200 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-sidebar flex h-full flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] shadow-[inset_-1px_0_0_rgba(196,113,79,0.06)] transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="relative flex h-[var(--topbar-height)] shrink-0 items-center gap-2.5 border-b border-[var(--color-sidebar-border)] px-3">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-sidebar-active-border)] to-transparent opacity-70" />
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-600 text-white shrink-0 shadow-sm">
            <Package className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block text-[13px] font-semibold tracking-tight text-[var(--color-sidebar-text-hover)] truncate">
                {appConfig.name}
              </span>
              <span className="block text-[9px] font-medium text-[var(--color-sidebar-text)] truncate">
                {panelConfig?.label || 'Enterprise'}
              </span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'interactive-smooth group relative flex items-center gap-2 rounded-md py-1.5 text-[12px] font-medium',
                    isCollapsed ? 'justify-center px-2' : 'px-2.5',
                    isActive
                      ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-text-hover)]'
                      : 'text-[var(--color-sidebar-text)] hover:bg-white/[0.04] hover:text-[var(--color-sidebar-text-hover)]'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-sidebar-active-border)]" />
                  )}
                  <Icon
                    className={cn(
                      'h-[15px] w-[15px] shrink-0 transition-colors duration-150',
                      isActive ? 'text-brand-500' : 'text-[var(--color-sidebar-text)] group-hover:text-[var(--color-sidebar-text-hover)]'
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!isCollapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                    <span
                      className={cn(
                        'ml-auto flex h-4 min-w-4 items-center justify-center rounded px-1 text-[9px] font-semibold tabular-nums',
                        isActive ? 'bg-brand-500/20 text-brand-500' : 'bg-white/10 text-[var(--color-sidebar-text-hover)]'
                      )}
                    >
                      {badges[item.badgeKey] > 99 ? '99+' : badges[item.badgeKey]}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        {!isCollapsed && user && (
          <div className="shrink-0 border-t border-[var(--color-sidebar-border)] p-2 space-y-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => { if (panel === 'admin') { navigate('/admin/business/manage'); setMobileOpen(false); } }}
              onKeyDown={(e) => e.key === 'Enter' && panel === 'admin' && navigate('/admin/business/manage')}
              className={cn(
                'flex items-center gap-2 rounded-md bg-[var(--color-sidebar-surface)] px-2 py-1.5 group',
                panel === 'admin' && 'cursor-pointer transition-colors hover:bg-white/[0.06]'
              )}
              title="Profile & Settings"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-brand-50/15 text-[10px] font-semibold text-brand-50">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-[var(--color-sidebar-text-hover)]">{user.name}</p>
                <p className="truncate text-[10px] text-[var(--color-sidebar-text)]">{user.email}</p>
              </div>
              <Settings className="h-3.5 w-3.5 shrink-0 text-[var(--color-sidebar-text)] opacity-60 group-hover:opacity-100 group-hover:text-[var(--color-sidebar-text-hover)] transition-all duration-150" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-start gap-1.5 text-[11px] text-[var(--color-sidebar-text)] hover:bg-white/[0.04] hover:text-[var(--color-danger)]"
              onClick={logout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
