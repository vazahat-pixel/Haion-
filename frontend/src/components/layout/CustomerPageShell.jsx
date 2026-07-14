import { MotionPage } from '@/components/motion/MotionPage';
import { CustomerAppHeader, CustomerAnnouncements } from '@/components/layout/CustomerAppShell';
import { cn } from '@/utils/cn';

/** Mobile-first page shell for customer portal (375px optimized) */
export function CustomerPageShell({
  title,
  subtitle,
  actions,
  children,
  className,
  showHeader = true,
  showAnnouncements = true,
  onRefresh,
  isRefreshing,
}) {
  return (
    <MotionPage>
      <div className={cn(
        'mx-auto w-full max-w-lg space-y-4 p-4 sm:max-w-2xl sm:p-6 lg:max-w-4xl',
        className
      )}>
        {showHeader && (
          <CustomerAppHeader
            title={title}
            subtitle={subtitle}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        )}
        {(actions || showAnnouncements) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {showAnnouncements && <div className="flex-1"><CustomerAnnouncements /></div>}
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </MotionPage>
  );
}
