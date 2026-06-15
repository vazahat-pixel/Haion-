import * as React from 'react';
import { cn } from '@/utils/cn';

export const Textarea = React.forwardRef(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[80px] w-full rounded-md border border-surface-3 bg-surface-0 px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-[var(--color-danger)]',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
