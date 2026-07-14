import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { cn } from '@/utils/cn';
import { cardHover } from '@/animations/customer.motion';

function useAnimatedValue(target, isCurrency = false) {
  const spring = useSpring(0, { stiffness: 120, damping: 24 });
  const [display, setDisplay] = useState(isCurrency ? '₹0' : '0');

  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^\d.]/g, '')) || 0;
    spring.set(num);
  }, [target, spring]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (isCurrency) {
        setDisplay(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(v)));
      } else {
        setDisplay(String(Math.round(v)));
      }
    });
  }, [spring, isCurrency]);

  return display;
}

export function CustomerMetricCard({ label, value, icon: Icon, accent, index = 0 }) {
  const isCurrency = typeof value === 'string' && value.includes('₹');
  const numericValue = isCurrency
    ? parseFloat(String(value).replace(/[^\d.]/g, '')) || 0
    : Number(value) || 0;
  const animated = useAnimatedValue(isCurrency ? numericValue : value, isCurrency);

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      custom={index}
      className={cn(
        'customer-metric-card group relative overflow-hidden',
        accent && 'customer-metric-card--accent'
      )}
    >
      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--customer-text-label)]">
            {label}
          </p>
          <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight text-[var(--customer-text)]">
            {isCurrency ? animated : (typeof value === 'string' && value.includes('₹') ? value : animated)}
          </p>
        </div>
        {Icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--customer-primary-soft)] text-[var(--customer-primary)]">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
