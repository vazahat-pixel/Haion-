import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const ICONS = {
  warning: AlertTriangle,
  danger: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const STYLES = {
  warning: 'border-[var(--color-warning)]/25 bg-[var(--color-warning-bg)]/80 text-[var(--color-warning)]',
  danger: 'border-[var(--color-danger)]/25 bg-[var(--color-danger-bg)]/80 text-[var(--color-danger)]',
  info: 'border-[var(--color-info)]/25 bg-[var(--color-info-bg)]/80 text-[var(--color-info)]',
  success: 'border-[var(--color-success)]/25 bg-[var(--color-success-bg)]/80 text-[var(--color-success)]',
};

export function AlertWidget({ alerts = [], className, compact = false }) {
  if (!alerts.length) return null;

  return (
    <div className={cn(compact ? 'space-y-1.5' : 'space-y-2', className)}>
      {alerts.map((alert, i) => {
        const Icon = ICONS[alert.variant] || Info;
        return (
          <motion.div
            key={alert.id || alert.title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className={cn(
              'flex items-start gap-2 rounded-md border backdrop-blur-sm',
              compact ? 'px-2.5 py-2' : 'rounded-lg px-3 py-2.5',
              STYLES[alert.variant] || STYLES.info
            )}
          >
            <Icon className={cn('shrink-0', compact ? 'mt-0.5 h-3.5 w-3.5' : 'mt-0.5 h-4 w-4')} />
            <div className="min-w-0">
              <p className={cn('font-medium', compact ? 'text-[11px]' : 'text-sm')}>{alert.title}</p>
              {alert.description && (
                <p className={cn('opacity-80', compact ? 'mt-0.5 text-[10px]' : 'mt-0.5 text-xs')}>{alert.description}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
