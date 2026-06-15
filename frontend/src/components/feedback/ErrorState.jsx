import { motion } from 'framer-motion';
import { ErrorIllustration } from '@/components/illustrations';
import { Button } from '@/components/ui/button';

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-5 py-16 text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ rotate: [0, -2, 2, 0] }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <ErrorIllustration className="h-28 w-28" />
      </motion.div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Unable to load data</h3>
        <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      )}
    </motion.div>
  );
}
