import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Breadcrumbs({ items, className }) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-1 flex flex-wrap items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em]', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={item.label} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-[var(--color-text-tertiary)]" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-brand-600 hover:text-brand-700 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-tertiary)]'}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
