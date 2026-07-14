import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, FileText, Printer, MessageCircle, Receipt,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { settingsService } from '@/services/settings.service';
import { LoadingState } from '@/components/feedback/LoadingState';

const NAV = [
  { label: 'Manage Business', href: '/admin/business/manage', icon: Building2 },
  { label: 'Invoice Settings', href: '/admin/business/invoice', icon: FileText },
  { label: 'Print Settings', href: '/admin/business/print', icon: Printer, badge: 'New' },
  { label: 'GST Configuration', href: '/admin/settings/gst', icon: Receipt },
  { label: 'CA Reports Sharing', href: '/admin/settings/ca-reports', icon: MessageCircle },
];

export function BusinessProfileLayout({ title, subtitle, actions, children }) {
  const { pathname } = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: settingsService.getBusiness,
  });

  return (
    <div className="flex min-h-[calc(100vh-var(--topbar-height)-2rem)] flex-col gap-4 p-3 sm:flex-row sm:p-4">
      <aside className="w-full shrink-0 rounded-xl border border-surface-3 bg-surface-1 sm:w-56 lg:w-60">
        <div className="border-b border-surface-3 p-4">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {data?.businessName || 'Business'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{data?.phone || '—'}</p>
            </>
          )}
        </div>

        <div className="p-2">
          <Link
            to="/admin/dashboard"
            className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--color-sidebar-bg)] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <nav className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-[var(--color-text-secondary)] hover:bg-surface-2 hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-[var(--color-danger)] px-1 py-px text-[9px] font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="erp-page-title">{title}</h1>
            {subtitle && <p className="mt-0.5 erp-page-subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}
