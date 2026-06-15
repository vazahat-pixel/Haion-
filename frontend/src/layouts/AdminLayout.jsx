import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function AdminLayout() {
  return (
    <RouteErrorBoundary panel="admin">
      <AppShell panel="admin">
        <Outlet />
      </AppShell>
    </RouteErrorBoundary>
  );
}
