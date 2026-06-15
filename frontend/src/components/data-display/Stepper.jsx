import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Stepper({ steps, currentStep }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                  done && 'bg-brand-500 text-white',
                  active && !done && 'bg-brand-50 text-brand-700 ring-2 ring-brand-500',
                  !done && !active && 'bg-surface-2 text-[var(--color-text-tertiary)]'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('hidden sm:block text-sm truncate', active ? 'font-medium' : 'text-[var(--color-text-secondary)]')}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && <div className={cn('h-px flex-1', done ? 'bg-brand-300' : 'bg-surface-3')} />}
          </li>
        );
      })}
    </ol>
  );
}
