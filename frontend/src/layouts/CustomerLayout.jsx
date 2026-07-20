import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CustomerBottomNav } from '@/components/layout/CustomerBottomNav';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';
import { CustomerPortalProvider } from '@/providers/CustomerPortalProvider';
import { LoadingState } from '@/components/feedback/LoadingState';
import { motion } from 'framer-motion';

function PageFallback() {
  return (
    <div className="p-6">
      <LoadingState message="Loading page..." />
    </div>
  );
}

export default function CustomerLayout() {
  const location = useLocation();

  return (
    <RouteErrorBoundary panel="customer" resetKey={location.pathname}>
      <CustomerPortalProvider>
        <AppShell panel="customer" mobileMinimal>
          <Suspense fallback={<PageFallback />}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0.85, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="customer-nav-scroll-padding lg:pb-0 min-h-full w-full"
            >
              <Outlet />
            </motion.div>
          </Suspense>
          <CustomerBottomNav />
        </AppShell>
      </CustomerPortalProvider>
    </RouteErrorBoundary>
  );
}
