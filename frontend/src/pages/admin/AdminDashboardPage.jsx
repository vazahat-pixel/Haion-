import { motion } from 'framer-motion';
import { AdminDashboard } from '@/modules/dashboards';
import { DashboardMeshBg } from '@/components/illustrations/dashboard';
import { MotionPage } from '@/components/motion/MotionPage';

export default function AdminDashboardPage() {
  return (
    <MotionPage>
      <div className="relative space-y-3 p-3 sm:p-4">
        <motion.div
          className="dashboard-hero px-3.5 py-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <DashboardMeshBg className="pointer-events-none absolute inset-0 h-full w-full opacity-80" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-brand-600">Overview</p>
              <h1 className="erp-page-title mt-0.5">Dashboard</h1>
              <p className="erp-page-subtitle mt-0.5">System metrics, revenue &amp; operations at a glance</p>
            </div>
          </div>
        </motion.div>
        <AdminDashboard />
      </div>
    </MotionPage>
  );
}
