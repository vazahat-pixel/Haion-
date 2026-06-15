import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { OfflineBanner } from './OfflineBanner';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/utils/cn';

export function AppShell({ children, panel }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-surface-0">
      <OfflineBanner />
      <Sidebar panel={panel} />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-slow',
          isCollapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]'
        )}
      >
        <Topbar panel={panel} />
        <main className="flex-1 overflow-auto pt-[var(--topbar-height)]">{children}</main>
      </div>
    </div>
  );
}
