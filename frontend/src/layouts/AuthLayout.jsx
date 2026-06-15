import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME_ROUTE } from '@/constants/roles';
import { Package } from 'lucide-react';
import { appConfig } from '@/config/app.config';

export default function AuthLayout() {
  const { isAuthenticated, user, isInitializing } = useAuth();

  if (isInitializing) return null;

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME_ROUTE[user.role]} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-sidebar-bg)] p-4 bg-[radial-gradient(ellipse_at_top,_rgba(196,113,79,0.12)_0%,_transparent_55%)]">
      <div className="mb-6 flex flex-col items-center gap-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md">
          <Package className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">{appConfig.name}</span>
        <span className="text-[10px] text-[var(--color-sidebar-text)]">Dealer &amp; Inventory Platform</span>
      </div>
      <Outlet />
    </div>
  );
}
