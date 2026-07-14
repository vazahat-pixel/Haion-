import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DealerBottomNav } from '@/components/layout/DealerBottomNav';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function DealerLayout() {
  return (
    <RouteErrorBoundary panel="dealer">
      <AppShell panel="dealer">
        <div className="pb-20 lg:pb-0">
          <Outlet />
        </div>
        <DealerBottomNav />
      </AppShell>
    </RouteErrorBoundary>
  );
}
