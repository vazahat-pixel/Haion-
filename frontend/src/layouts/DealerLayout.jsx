import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DealerBottomNav } from '@/components/layout/DealerBottomNav';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';
import { LoadingState } from '@/components/feedback/LoadingState';
import { motion } from 'framer-motion';

function PageFallback() {
  return (
    <div className="p-6">
      <LoadingState message="Loading page..." />
    </div>
  );
}

export default function DealerLayout() {
  const location = useLocation();

  return (
    <RouteErrorBoundary panel="dealer" resetKey={location.pathname}>
      <AppShell panel="dealer">
        <Suspense fallback={<PageFallback />}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.85, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pb-20 lg:pb-0 min-h-full w-full"
          >
            <Outlet />
          </motion.div>
        </Suspense>
        <DealerBottomNav />
      </AppShell>
    </RouteErrorBoundary>
  );
}
