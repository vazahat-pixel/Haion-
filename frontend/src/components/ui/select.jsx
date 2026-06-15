import * as React from 'react';
import { cn } from '@/utils/cn';

export const Select = React.forwardRef(({ className, children, error, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2.5 py-1 text-[13px] text-[var(--color-text-primary)] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
      'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
      'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
      error && 'border-[var(--color-danger)]',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
