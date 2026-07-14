import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Breadcrumbs } from './Breadcrumbs';

const LINKS = [
  { label: 'Overview', href: '/admin/settings' },
  { label: 'General', href: '/admin/settings/general' },
  { label: 'GST', href: '/admin/settings/gst' },
  { label: 'Alert Preferences', href: '/admin/settings/notifications' },
  { label: 'Customer Portal', href: '/admin/settings/customer-portal' },
  { label: 'CA Reports Sharing', href: '/admin/settings/ca-reports' },
  { label: 'Roles & Permissions', href: '/admin/settings/roles' },
];

export function SettingsSubnav({ title, subtitle, actions, children }) {
  const { pathname } = useLocation();
  const isHub = pathname === '/admin/settings';

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <Breadcrumbs items={[{ label: 'Settings', href: '/admin/settings' }, ...(isHub ? [] : [{ label: title }])]} />
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="erp-page-title">{title}</h1>
          {subtitle && <p className="mt-0.5 erp-page-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {!isHub && (
        <nav className="flex flex-wrap gap-1 border-b border-surface-3 pb-px">
          {LINKS.filter((l) => l.href !== '/admin/settings').map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'interactive-smooth rounded-t px-2.5 py-1.5 text-[12px] font-medium',
                pathname === link.href
                  ? 'border-b-2 border-brand-500 text-brand-700'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}
