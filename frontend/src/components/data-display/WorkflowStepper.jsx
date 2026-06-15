import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export function WorkflowStepper({ steps, currentStep, labels }) {
  const stepLabels = labels || steps;

  return (
    <ol className="flex items-center w-full">
      {stepLabels.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <li key={step} className={cn('flex flex-1 items-center', i < stepLabels.length - 1 && 'after:content-[""] after:flex-1 after:h-px after:mx-2', done ? 'after:bg-brand-300' : 'after:bg-surface-3')}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <span className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0',
                done && 'bg-brand-500 text-white',
                active && !done && 'bg-brand-50 text-brand-700 ring-2 ring-brand-500',
                !done && !active && 'bg-surface-2 text-[var(--color-text-tertiary)]'
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('text-[10px] text-center truncate max-w-[72px]', active ? 'font-medium text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}>
                {step.replace(/_/g, ' ')}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
