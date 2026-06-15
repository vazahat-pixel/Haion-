import { motion } from 'framer-motion';

export function PageHeader({ title, subtitle, actions, breadcrumbs, icon: Icon }) {
  return (
    <motion.div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && (
          <motion.span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </motion.span>
        )}
        <div className="space-y-0.5 min-w-0">
          {breadcrumbs}
          <h1 className="erp-page-title">{title}</h1>
          {subtitle && (
            <p className="erp-page-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <motion.div
          className="flex flex-wrap items-center gap-2 shrink-0"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.25 }}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
}
