import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CustomerBottomNav } from '@/components/layout/CustomerBottomNav';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';

export default function CustomerLayout() {
  return (
    <RouteErrorBoundary panel="customer">
      <CustomerPortalProvider>
        <AppShell panel="customer" mobileMinimal>
          <div className="customer-nav-scroll-padding lg:pb-0">
            <Outlet />
          </div>
          <CustomerBottomNav />
        </AppShell>
      </CustomerPortalProvider>
    </RouteErrorBoundary>
  );
}
