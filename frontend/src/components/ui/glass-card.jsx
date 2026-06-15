import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export const GlassCard = React.forwardRef(function GlassCard(
  { className, children, hover = true, delay = 0, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'glass-card relative overflow-hidden rounded-lg',
        hover && 'glass-card-hover',
        className
      )}
      {...props}
    >
      <div className="glass-card-shine pointer-events-none absolute inset-0" aria-hidden />
      {children}
    </motion.div>
  );
});

export function GlassCardHeader({ className, ...props }) {
  return <div className={cn('relative flex items-center justify-between gap-2 px-3.5 pt-3 pb-1', className)} {...props} />;
}

export function GlassCardTitle({ className, ...props }) {
  return <h3 className={cn('text-[12px] font-semibold text-[var(--color-text-primary)]', className)} {...props} />;
}

export function GlassCardContent({ className, ...props }) {
  return <div className={cn('relative px-3.5 pb-3.5', className)} {...props} />;
}
