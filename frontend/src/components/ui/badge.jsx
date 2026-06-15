import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-700',
        success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
        danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
        info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
        neutral: 'bg-[var(--color-neutral-bg)] text-[var(--color-neutral)]',
        outline: 'border border-surface-3 text-[var(--color-text-secondary)] bg-surface-1',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
