import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CustomerBottomNav } from '@/components/layout/CustomerBottomNav';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function CustomerLayout() {
  return (
    <RouteErrorBoundary panel="customer">
      <AppShell panel="customer">
        <div className="pb-20 lg:pb-0">
          <Outlet />
        </div>
        <CustomerBottomNav />
      </AppShell>
    </RouteErrorBoundary>
  );
}
