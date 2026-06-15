import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export function QuickActions({ actions = [], className }) {
  if (!actions.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {actions.map((action, i) => {
        const Icon = action.icon;
        const inner = (
          <>
            {Icon && (
              <motion.span
                className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/10 text-brand-600"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.span>
            )}
            <span className="text-[11px] font-medium">{action.label}</span>
          </>
        );

        const className = cn(
          'glass-pill interactive-smooth group flex items-center gap-2 rounded-lg px-2.5 py-1.5',
          'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          'hover:border-brand-500/25 hover:shadow-md hover:-translate-y-0.5',
          action.variant === 'default' && 'bg-brand-500/90 text-white border-brand-600/30 hover:bg-brand-600 hover:text-white'
        );

        if (action.href) {
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to={action.href} className={className}>
                {inner}
              </Link>
            </motion.div>
          );
        }

        return (
          <motion.button
            key={action.label}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={className}
            onClick={action.onClick}
          >
            {inner}
          </motion.button>
        );
      })}
    </div>
  );
}
