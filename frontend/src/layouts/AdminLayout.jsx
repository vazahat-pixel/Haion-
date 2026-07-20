import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
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

export default function AdminLayout() {
  const location = useLocation();

  return (
    <RouteErrorBoundary panel="admin" resetKey={location.pathname}>
      <AppShell panel="admin">
        <Suspense fallback={<PageFallback />}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0.85, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-full"
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </AppShell>
    </RouteErrorBoundary>
  );
}
