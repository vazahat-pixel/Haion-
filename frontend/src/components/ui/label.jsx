import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/utils/cn';

const Label = React.forwardRef(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium text-[var(--color-text-primary)]', className)}
    {...props}
  >
    {children}
    {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';

export { Label };
