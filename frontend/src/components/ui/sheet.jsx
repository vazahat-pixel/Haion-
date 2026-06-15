import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { drawerEnter } from '@/animations/motion.config';

export function Sheet({ open, onOpenChange, children, title, description, side = 'right', className }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-drawer bg-[var(--color-surface-overlay)] backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />
          <motion.aside
            initial={side === 'right' ? drawerEnter.initial : { x: '-100%' }}
            animate={side === 'right' ? drawerEnter.animate : { x: 0, transition: drawerEnter.animate.transition }}
            exit={side === 'right' ? drawerEnter.exit : { x: '-100%', transition: drawerEnter.exit.transition }}
            className={cn(
              'fixed top-0 z-drawer flex h-full w-full max-w-md flex-col border-surface-3 bg-surface-1 shadow-xl',
              side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              className
            )}
          >
            <div className="flex items-start justify-between border-b border-surface-3 px-5 py-4">
              <div>
                {title && <h2 className="text-base font-bold uppercase tracking-tight">{title}</h2>}
                {description && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>}
              </div>
              <button type="button" onClick={() => onOpenChange?.(false)} className="rounded-md p-1 hover:bg-surface-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
