import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  icon: Icon = Package,
  illustration: Illustration,
  title = 'Nothing here yet',
  description,
  primaryAction,
  onPrimaryAction,
  secondaryAction,
  onSecondaryAction,
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 py-20 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {Illustration ? (
          <Illustration className="h-32 w-32 opacity-95" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-200">
            <Icon className="h-9 w-9 text-brand-600" />
          </div>
        )}
      </motion.div>
      <div className="space-y-2 max-w-md px-4">
        <h3 className="text-base font-bold uppercase tracking-tight text-[var(--color-text-primary)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
        )}
      </div>
      {(primaryAction || secondaryAction) && (
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.25 }}
        >
          {primaryAction && (
            <Button onClick={onPrimaryAction}>{primaryAction}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>{secondaryAction}</Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
