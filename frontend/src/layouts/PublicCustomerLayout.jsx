import { Outlet, Navigate } from 'react-router-dom';
import { PublicCustomerBottomNav } from '@/components/layout/PublicCustomerBottomNav';
import { loadCustomerHubSession } from '@/modules/customer-portal/CustomerAccessForm';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';

export default function PublicCustomerLayout() {
  const session = loadCustomerHubSession();
  const hub = session?.hub ?? session;

  return (
    <CustomerPortalProvider initialConfig={hub?.portal}>
      <div className="customer-app min-h-screen">
        <div className="customer-nav-scroll-padding mx-auto min-h-screen w-full max-w-lg p-4 sm:max-w-2xl">
          <Outlet />
        </div>
        {hub && <PublicCustomerBottomNav />}
      </div>
    </CustomerPortalProvider>
  );
}
