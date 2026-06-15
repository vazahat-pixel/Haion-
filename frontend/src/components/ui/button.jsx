import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'interactive-smooth inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md active:bg-brand-700',
        destructive: 'bg-[var(--color-danger)] text-white hover:opacity-90 shadow-sm',
        outline: 'border border-surface-3 bg-surface-1 text-[var(--color-text-primary)] hover:bg-surface-2',
        secondary: 'bg-surface-2 text-[var(--color-text-primary)] hover:bg-surface-3',
        ghost: 'text-[var(--color-text-secondary)] hover:bg-surface-2 hover:text-[var(--color-text-primary)]',
        link: 'text-brand-600 underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-6 px-2 text-[11px] rounded',
        sm: 'h-7 px-2.5 text-[11px]',
        default: 'h-8 px-3',
        lg: 'h-9 px-4 text-[13px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
