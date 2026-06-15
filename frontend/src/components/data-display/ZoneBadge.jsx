import { cn } from '@/utils/cn';

const STYLES = {
  GREEN: 'bg-[var(--color-success-bg)] text-[var(--color-success)] ring-[var(--color-success)]/20',
  YELLOW: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] ring-[var(--color-warning)]/20',
  RED: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] ring-[var(--color-danger)]/20',
};

const LABELS = { GREEN: 'Green Zone', YELLOW: 'Yellow Zone', RED: 'Red Zone' };

export function ZoneBadge({ zone, size = 'sm', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[10px] uppercase tracking-wide' : 'px-2.5 py-1 text-xs',
        STYLES[zone] || STYLES.YELLOW,
        className
      )}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', zone === 'GREEN' && 'bg-[var(--color-success)]', zone === 'RED' && 'bg-[var(--color-danger)]', zone === 'YELLOW' && 'bg-[var(--color-warning)]')} />
      {LABELS[zone] || zone}
    </span>
  );
}
