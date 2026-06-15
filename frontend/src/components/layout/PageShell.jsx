import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from './PageHeader';
import { MotionPage } from '@/components/motion/MotionPage';
import { getAdminModuleDecor } from '@/config/adminModules.config';

export function PageShell({ title, subtitle, actions, breadcrumbs, children, module, hero = true }) {
  const location = useLocation();
  const decor = module ? getAdminModuleDecor(`/admin/${module}`) : getAdminModuleDecor(location.pathname);
  const Icon = decor?.Icon;
  const Mesh = decor?.Mesh;
  const showHero = hero && decor;

  return (
    <MotionPage>
      <div className="space-y-3 p-3 sm:p-4">
        {showHero ? (
          <motion.div
            className="dashboard-hero relative overflow-hidden px-3.5 py-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {Mesh && <Mesh className="pointer-events-none absolute inset-0 h-full w-full opacity-90" />}
            <div className="relative">
              <PageHeader
                title={title}
                subtitle={subtitle}
                actions={actions}
                breadcrumbs={breadcrumbs}
                icon={Icon}
              />
            </div>
          </motion.div>
        ) : (
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            breadcrumbs={breadcrumbs}
            icon={Icon}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showHero ? 0.1 : 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </MotionPage>
  );
}
