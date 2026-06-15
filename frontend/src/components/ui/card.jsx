import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const cardVariants = cva('rounded-lg transition-[box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]', {
  variants: {
    variant: {
      base: 'border border-surface-3 bg-surface-1 shadow-sm',
      elevated: 'bg-surface-1 shadow-md border border-surface-3/50',
      glass: 'border border-white/30 bg-white/70 backdrop-blur-md shadow-sm',
    },
  },
  defaultVariants: { variant: 'base' },
});

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 p-3.5', className)} {...props} />
));

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-[13px] font-semibold text-[var(--color-text-primary)]', className)} {...props} />
));

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-[12px] text-[var(--color-text-secondary)]', className)} {...props} />
));

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-3.5 pt-0', className)} {...props} />
));

export { Card, CardHeader, CardTitle, CardDescription, CardContent, cardVariants };
