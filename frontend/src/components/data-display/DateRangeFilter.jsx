import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

const PRESETS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'YTD', days: null },
];

export function DateRangeFilter({ value, onChange, className }) {
  const [preset, setPreset] = useState(value?.preset || '30 days');

  const apply = (p) => {
    setPreset(p.label);
    const end = new Date();
    let start;
    if (p.days) {
      start = new Date(end.getTime() - p.days * 86400000);
    } else {
      start = new Date(end.getFullYear(), 0, 1);
    }
    onChange?.({ preset: p.label, start: start.toISOString(), end: end.toISOString() });
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Calendar className="h-3 w-3 text-[var(--color-text-tertiary)]" />
      <div className="glass-pill flex rounded-md p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => apply(p)}
            className={cn(
              'interactive-smooth relative rounded px-2 py-0.5 text-[10px] font-medium',
              preset === p.label
                ? 'text-brand-700'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {preset === p.label && (
              <motion.span
                layoutId="date-preset-bg"
                className="absolute inset-0 rounded bg-brand-500/15 ring-1 ring-brand-500/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
