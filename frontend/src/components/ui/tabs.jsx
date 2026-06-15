import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/utils/cn';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex h-9 items-center gap-1 rounded-lg bg-surface-2 p-1', className)}
    {...props}
  />
));

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all data-[state=active]:bg-surface-1 data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4 focus:outline-none', className)} {...props} />
));

export { Tabs, TabsList, TabsTrigger, TabsContent };
