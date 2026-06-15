import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function ServiceLayout() {
  return (
    <RouteErrorBoundary panel="service">
      <AppShell panel="service">
        <Outlet />
      </AppShell>
    </RouteErrorBoundary>
  );
}
