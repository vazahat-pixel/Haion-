import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function DealerLayout() {
  return (
    <RouteErrorBoundary panel="dealer">
      <AppShell panel="dealer">
        <Outlet />
      </AppShell>
    </RouteErrorBoundary>
  );
}
