import { cn } from '@/utils/cn';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-skeleton rounded-md bg-surface-2', className)}
      {...props}
    />
  );
}

export { Skeleton };
