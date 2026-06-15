import { formatDateTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export function Timeline({ events = [], className }) {
  if (!events.length) return null;

  return (
    <ol className={cn('space-y-0', className)}>
      {events.map((event, i) => (
        <li key={event.id || i} className="relative flex gap-3 pb-6 pl-1 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px bg-surface-3" />
          )}
          <span className={cn(
            'relative z-10 mt-1 h-2 w-2 shrink-0 rounded-full ring-4 ring-surface-1',
            event.variant === 'success' && 'bg-[var(--color-success)]',
            event.variant === 'warning' && 'bg-[var(--color-warning)]',
            event.variant === 'danger' && 'bg-[var(--color-danger)]',
            !event.variant && 'bg-brand-500'
          )} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{event.title}</p>
            {event.description && (
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{event.description}</p>
            )}
            {event.timestamp && (
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{formatDateTime(event.timestamp)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
