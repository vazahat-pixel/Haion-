import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, Users, PlusCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

export function DealerBottomNav() {
  const { user } = useAuth();
  const homeRoute = user?.role === ROLES.DEALER_ADMIN
    ? ROUTES.DEALER_DASHBOARD
    : ROUTES.DEALER_SALES_QUICK;

  const LINKS = [
    { to: homeRoute, label: 'Home', icon: LayoutDashboard, end: true },
    { to: ROUTES.DEALER_SALES_QUICK, label: 'Sell', icon: PlusCircle, accent: true },
    { to: ROUTES.DEALER_INVENTORY, label: 'Stock', icon: Package },
    { to: ROUTES.DEALER_BILLING, label: 'Bills', icon: Receipt },
    { to: ROUTES.DEALER_CUSTOMERS, label: 'Customers', icon: Users },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-3 bg-surface-1/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(({ to, label, icon: Icon, end, accent }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                accent && !isActive && 'text-brand-600',
                isActive ? 'text-brand-600' : accent ? 'text-brand-500' : 'text-[var(--color-text-tertiary)]'
              )}
            >
              <Icon className={cn('h-5 w-5', accent && 'h-6 w-6')} strokeWidth={accent ? 2.25 : 2} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
