import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import { LogOut, Package, Settings, ChevronDown, ChevronRight } from 'lucide-react';

export function Sidebar({ panel, className }) {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const { hasPermission } = usePermission();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const panelConfig = PANELS[panel];
  const navItems = getNavForPanel(panel, user?.role, hasPermission);
  const badges = useSidebarBadges(panel);

  // Group navigation items by section
  const { topItems, sections } = useMemo(() => {
    const top = [];
    const secMap = new Map();
    navItems.forEach((item) => {
      if (!item.section) {
        top.push(item);
      } else {
        if (!secMap.has(item.section)) {
          secMap.set(item.section, []);
        }
        secMap.get(item.section).push(item);
      }
    });
    return {
      topItems: top,
      sections: Array.from(secMap.entries()).map(([title, items]) => ({
        title,
        items,
      })),
    };
  }, [navItems]);

  // Section collapse state (true = collapsed)
  const [collapsedSections, setCollapsedSections] = useState({});

  // Auto-expand section containing active route
  useEffect(() => {
    sections.forEach(({ title, items }) => {
      const hasActive = items.some((item) => location.pathname.startsWith(item.path));
      if (hasActive) {
        setCollapsedSections((prev) => ({ ...prev, [title]: false }));
      }
    });
  }, [location.pathname, sections]);

  const toggleSection = (title) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const renderNavItem = (item, isInsideSection = false) => {
    const Icon = item.icon;
    const isActive = location.pathname.startsWith(item.path);
    const badgeCount = item.badgeKey ? badges[item.badgeKey] || 0 : 0;
    const tooltipText = isCollapsed
      ? `${item.section ? `${item.section} • ` : ''}${item.label}`
      : undefined;

    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'interactive-smooth group relative flex items-center gap-2 rounded-md py-1.5 text-[12px] font-medium transition-all duration-150',
          isCollapsed ? 'justify-center px-2' : isInsideSection ? 'pl-3 pr-2.5' : 'px-2.5',
          isActive
            ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-text-hover)] font-semibold'
            : 'text-[var(--color-sidebar-text)] hover:bg-white/[0.04] hover:text-[var(--color-sidebar-text-hover)]'
        )}
        title={tooltipText}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-[var(--color-sidebar-active-border)] shadow-sm" />
        )}
        <Icon
          className={cn(
            'h-[15px] w-[15px] shrink-0 transition-colors duration-150',
            isActive
              ? 'text-brand-500'
              : 'text-[var(--color-sidebar-text)] group-hover:text-[var(--color-sidebar-text-hover)]'
          )}
          strokeWidth={isActive ? 2.25 : 2}
        />
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!isCollapsed && badgeCount > 0 && (
          <span
            className={cn(
              'ml-auto flex h-4 min-w-4 items-center justify-center rounded px-1 text-[9px] font-semibold tabular-nums',
              isActive ? 'bg-brand-500/20 text-brand-500' : 'bg-white/10 text-[var(--color-sidebar-text-hover)]'
            )}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </NavLink>
    );
  };

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
        {/* Brand Header */}
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

        {/* Scrollable Navigation */}
        <ScrollArea className="flex-1 px-2 py-2.5">
          <nav className="flex flex-col gap-1">
            {/* Top Level Items (Dashboard, etc.) */}
            {topItems.map((item) => renderNavItem(item, false))}

            {/* Sections */}
            {sections.map(({ title, items }, sIdx) => {
              const isSectionCollapsed = !!collapsedSections[title];
              const sectionBadgeTotal = items.reduce((acc, it) => {
                return acc + (it.badgeKey ? badges[it.badgeKey] || 0 : 0);
              }, 0);
              const hasActiveChild = items.some((it) => location.pathname.startsWith(it.path));

              if (isCollapsed) {
                return (
                  <div key={title} className="flex flex-col gap-0.5">
                    <div className="my-1.5 border-t border-white/10" />
                    {items.map((item) => renderNavItem(item, false))}
                  </div>
                );
              }

              return (
                <div key={title} className="mt-2.5 first:mt-1 flex flex-col">
                  {/* Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(title)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-colors cursor-pointer',
                      'hover:bg-white/[0.04]',
                      hasActiveChild ? 'text-brand-400' : 'text-[#c2bcc7]'
                    )}
                  >
                    <span className={cn(
                      'text-[10px] font-bold tracking-wider uppercase transition-colors truncate',
                      hasActiveChild
                        ? 'text-brand-400 font-extrabold'
                        : 'text-[#a89fad] group-hover:text-white'
                    )}>
                      {title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {sectionBadgeTotal > 0 && isSectionCollapsed && (
                        <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-500/20 px-1 text-[8px] font-bold text-brand-400">
                          {sectionBadgeTotal > 99 ? '99+' : sectionBadgeTotal}
                        </span>
                      )}
                      {isSectionCollapsed ? (
                        <ChevronRight className={cn(
                          'h-3 w-3 transition-colors',
                          hasActiveChild ? 'text-brand-400' : 'text-[#857a8a] group-hover:text-white'
                        )} />
                      ) : (
                        <ChevronDown className={cn(
                          'h-3 w-3 transition-colors',
                          hasActiveChild ? 'text-brand-400' : 'text-[#857a8a] group-hover:text-white'
                        )} />
                      )}
                    </div>
                  </button>

                  {/* Section Items */}
                  <AnimatePresence initial={false}>
                    {!isSectionCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="overflow-hidden flex flex-col gap-0.5 pt-0.5"
                      >
                        {items.map((item) => renderNavItem(item, true))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer / User Profile */}
        {!isCollapsed && user && (
          <div className="shrink-0 border-t border-[var(--color-sidebar-border)] p-2 space-y-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (panel === 'admin') {
                  navigate('/admin/business/manage');
                  setMobileOpen(false);
                }
              }}
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
                <p className="truncate text-[12px] font-medium text-[var(--color-sidebar-text-hover)]">
                  {user.name}
                </p>
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
