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
import {
  LogOut,
  Package,
  Settings,
  ChevronDown,
  Factory,
  ShoppingBag,
  Users,
  Truck,
  Receipt,
  Gift,
  ShieldCheck,
  Wrench,
  BarChart3,
  FolderClosed,
  IndianRupee,
  Globe,
} from 'lucide-react';

const SECTION_ICONS = {
  '1. PRIMARY / PURCHASE & MANUFACTURING': Factory,
  '2. SALES': ShoppingBag,
  '3. ONBOARDING': Users,
  '4. DISPATCH & LOGISTICS': Truck,
  '4. DISPATCH & WAREHOUSE': Truck,
  '5. BILLING & FINANCIALS': Receipt,
  '5. CUSTOMER & DEALER BILLING': Receipt,
  '6. REFERRALS & TARGETS': Gift,
  '6. REFERRAL SYSTEM': Gift,
  '7. INSURANCE & WARRANTY': ShieldCheck,
  '8. SERVICE CENTRE': Wrench,
  '9. FINANCE': IndianRupee,
  '10. WEBSITE ADMIN': Globe,
  '11. HRMS & WORKFORCE': Users,
  '12. SYSTEM & REPORTS': BarChart3,
};

function getSectionDisplayTitle(title) {
  if (title.includes('PURCHASE')) return '1. PURCHASE & MFG';
  if (title.includes('DISPATCH') || title.includes('WAREHOUSE')) return '4. DISPATCH & LOGISTICS';
  if (title.includes('BILLING') || title.includes('CUSTOMER & DEALER')) return '5. BILLING & INVOICES';
  if (title.includes('REFERRAL')) return '6. REFERRALS';
  if (title.includes('FINANCE')) return '9. FINANCE';
  if (title.includes('WEBSITE')) return '10. WEBSITE ADMIN';
  if (title.includes('HRMS')) return '11. HRMS & WORKFORCE';
  if (title.includes('SYSTEM')) return '12. SYSTEM & REPORTS';
  return title;
}

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

  // Section dropdown state (all collapsed by default on load/login)
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
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
          'interactive-smooth group relative flex items-center gap-1.5 rounded-md py-1 text-[11px] font-medium transition-all duration-150',
          isCollapsed ? 'justify-center px-1.5' : isInsideSection ? 'pl-2 pr-1.5' : 'px-2',
          isActive
            ? 'bg-amber-500/20 text-amber-300 font-bold shadow-sm'
            : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white'
        )}
        title={tooltipText}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-r bg-amber-400 shadow-sm" />
        )}
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-colors duration-150',
            isActive
              ? 'text-amber-400'
              : 'text-zinc-400 group-hover:text-white'
          )}
          strokeWidth={isActive ? 2.25 : 2}
        />
        {!isCollapsed && <span className="flex-1 truncate leading-tight">{item.label}</span>}
        {!isCollapsed && badgeCount > 0 && (
          <span
            className={cn(
              'ml-auto flex h-3.5 min-w-3.5 items-center justify-center rounded px-1 text-[8.5px] font-bold tabular-nums',
              isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-white'
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
        <div className="relative flex h-11 shrink-0 items-center gap-2 border-b border-[var(--color-sidebar-border)] px-2.5">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-sidebar-active-border)] to-transparent opacity-70" />
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 shrink-0 shadow-sm">
            <Package className="h-3 w-3" strokeWidth={2.5} />
          </span>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="block text-[12px] font-bold tracking-tight text-white truncate leading-tight">
                {appConfig.name}
              </span>
              <span className="block text-[9px] font-medium text-zinc-400 truncate leading-tight">
                {panelConfig?.label || 'Enterprise'}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <ScrollArea className="flex-1 px-1.5 py-1.5">
          <nav className="flex flex-col gap-0.5">
            {/* Top Level Items (Dashboard, etc.) */}
            {topItems.map((item) => renderNavItem(item, false))}

            {/* Sections */}
            {sections.map(({ title, items }) => {
              const isSectionOpen = !!openSections[title];
              const sectionBadgeTotal = items.reduce((acc, it) => {
                return acc + (it.badgeKey ? badges[it.badgeKey] || 0 : 0);
              }, 0);
              const hasActiveChild = items.some((it) => location.pathname.startsWith(it.path));
              const SectionIcon = SECTION_ICONS[title] || FolderClosed;
              const displayTitle = getSectionDisplayTitle(title);

              if (isCollapsed) {
                return (
                  <div key={title} className="flex flex-col gap-0.5">
                    <div className="my-1 border-t border-white/10" />
                    {items.map((item) => renderNavItem(item, false))}
                  </div>
                );
              }

              return (
                <div key={title} className="mt-0.5 flex flex-col">
                  {/* Section Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleSection(title)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-md px-2 py-1 text-left transition-all duration-150 cursor-pointer select-none',
                      hasActiveChild
                        ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/35 shadow-sm'
                        : isSectionOpen
                          ? 'bg-white/[0.08] text-white font-semibold'
                          : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span
                        className={cn(
                          'flex h-4.5 w-4.5 items-center justify-center rounded transition-colors shrink-0',
                          hasActiveChild
                            ? 'bg-amber-500/30 text-amber-400'
                            : isSectionOpen
                              ? 'bg-white/10 text-white'
                              : 'bg-white/[0.04] text-zinc-400 group-hover:text-white group-hover:bg-white/10'
                        )}
                      >
                        <SectionIcon className="h-3 w-3" strokeWidth={2.2} />
                      </span>
                      <span className="text-[10.5px] font-bold tracking-tight truncate">
                        {displayTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {sectionBadgeTotal > 0 && !isSectionOpen && (
                        <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500/25 px-1 text-[8.5px] font-bold text-amber-300">
                          {sectionBadgeTotal > 99 ? '99+' : sectionBadgeTotal}
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 transition-transform duration-200 shrink-0',
                          isSectionOpen ? 'rotate-180 text-amber-400' : 'text-zinc-400 group-hover:text-white',
                          hasActiveChild && !isSectionOpen && 'text-amber-400 font-bold'
                        )}
                      />
                    </div>
                  </button>

                  {/* Sub-Items Accordion Content */}
                  <AnimatePresence initial={false}>
                    {isSectionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="ml-2 pl-2 border-l border-white/15 flex flex-col gap-0.5 pt-0.5 pb-0.5 mt-0.5">
                          {items.map((item) => renderNavItem(item, true))}
                        </div>
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
          <div className="shrink-0 border-t border-[var(--color-sidebar-border)] p-1.5 space-y-1">
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
                'flex items-center gap-1.5 rounded-md bg-[var(--color-sidebar-surface)] px-1.5 py-1 group',
                panel === 'admin' && 'cursor-pointer transition-colors hover:bg-white/[0.06]'
              )}
              title="Profile & Settings"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-amber-500/20 text-[9px] font-bold text-amber-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">
                  {user.name}
                </p>
                <p className="truncate text-[9px] text-zinc-400 leading-tight">{user.email}</p>
              </div>
              <Settings className="h-3 w-3 shrink-0 text-zinc-400 opacity-70 group-hover:opacity-100 group-hover:text-white transition-all duration-150" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-full justify-start gap-1 text-[10px] text-zinc-400 hover:bg-white/[0.04] hover:text-red-400"
              onClick={logout}
            >
              <LogOut className="h-3 w-3" />
              Logout
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
