import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, Headphones, ShoppingBag } from 'lucide-react';
import { cn } from '@/utils/cn';

const LINKS = [
  { to: '/customer/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/customer/warranty/lookup', label: 'Warranty', icon: Shield },
  { to: '/customer/service-requests', label: 'Service', icon: Headphones },
  { to: '/customer/orders', label: 'Orders', icon: ShoppingBag },
];

export function CustomerBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-3 bg-surface-1/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-[var(--color-text-tertiary)]'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
