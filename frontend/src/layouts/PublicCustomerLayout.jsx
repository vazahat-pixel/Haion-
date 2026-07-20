import { Outlet, useLocation } from 'react-router-dom';
import { PublicCustomerBottomNav } from '@/components/layout/PublicCustomerBottomNav';
import { loadCustomerHubSession } from '@/modules/customer-portal/CustomerAccessForm';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';
import { motion } from 'framer-motion';

export default function PublicCustomerLayout() {
  const session = loadCustomerHubSession();
  const hub = session?.hub ?? session;
  const location = useLocation();

  return (
    <CustomerPortalProvider initialConfig={hub?.portal}>
      <div className="customer-app min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0.85, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="customer-nav-scroll-padding mx-auto min-h-screen w-full max-w-lg p-4 sm:max-w-2xl"
        >
          <Outlet />
        </motion.div>
        {hub && <PublicCustomerBottomNav />}
      </div>
    </CustomerPortalProvider>
  );
}
