import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';

export default function EmployeeLayout() {
  return (
    <RouteErrorBoundary panel="employee">
      <AppShell panel="employee">
        <Outlet />
      </AppShell>
    </RouteErrorBoundary>
  );
}
