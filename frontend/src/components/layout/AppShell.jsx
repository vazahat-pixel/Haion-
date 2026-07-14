import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { OfflineBanner } from './OfflineBanner';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';

export function AppShell({ children, panel, mobileMinimal = false }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-surface-0">
      <OfflineBanner />
      <Sidebar panel={panel} className={mobileMinimal ? 'hidden lg:flex' : undefined} />
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-slow',
          mobileMinimal
            ? cn(isCollapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]')
            : isCollapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]'
        )}
      >
        <Topbar panel={panel} className={mobileMinimal ? 'hidden lg:flex' : undefined} />
        <main className={cn('flex-1 min-w-0 overflow-x-hidden overflow-y-auto', mobileMinimal ? 'pt-0 lg:pt-[var(--topbar-height)]' : 'pt-[var(--topbar-height)]')}>{children}</main>
      </div>
    </div>
  );
}
