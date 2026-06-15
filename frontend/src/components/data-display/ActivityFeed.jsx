import { motion } from 'framer-motion';
import { formatRelative } from '@/utils/format';
import { cn } from '@/utils/cn';

export function ActivityFeed({ items = [], className, maxItems = 6, compact = false }) {
  const visible = items.slice(0, maxItems);

  if (!visible.length) {
    return (
      <p className={cn('text-center text-[var(--color-text-tertiary)]', compact ? 'py-4 text-[11px]' : 'py-8 text-sm')}>
        No recent activity
      </p>
    );
  }

  return (
    <ul className={cn('space-y-0', className)}>
      {visible.map((item, i) => (
        <motion.li
          key={item.id || i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn('relative flex gap-2', compact ? 'py-2 pl-0.5' : 'gap-3 py-3 pl-1')}
        >
          {i < visible.length - 1 && (
            <span className="absolute left-[7px] top-6 h-[calc(100%-8px)] w-px bg-gradient-to-b from-brand-500/30 to-transparent" />
          )}
          <span
            className={cn(
              'relative z-10 mt-1 h-2 w-2 shrink-0 rounded-full ring-2 ring-surface-1',
              item.variant === 'danger' && 'bg-[var(--color-danger)]',
              item.variant === 'warning' && 'bg-[var(--color-warning)]',
              item.variant === 'success' && 'bg-[var(--color-success)]',
              !item.variant && 'bg-brand-500'
            )}
          />
          <div className="min-w-0 flex-1">
            <p className={cn('text-[var(--color-text-primary)]', compact ? 'text-[11px] leading-snug' : 'text-sm')}>
              {item.title}
            </p>
            {item.description && (
              <p className={cn('truncate text-[var(--color-text-tertiary)]', compact ? 'mt-0.5 text-[10px]' : 'mt-0.5 text-xs')}>
                {item.description}
              </p>
            )}
            {item.timestamp && (
              <p className={cn('text-[var(--color-text-tertiary)]', compact ? 'mt-0.5 text-[9px]' : 'mt-1 text-xs')}>
                {formatRelative(item.timestamp)}
              </p>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
