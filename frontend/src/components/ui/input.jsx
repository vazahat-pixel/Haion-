import * as React from 'react';
import { cn } from '@/utils/cn';

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2.5 py-1 text-[13px] transition-[border-color,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]',
      'placeholder:text-[var(--color-text-tertiary)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:border-brand-500',
      'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
      error && 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/30',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
