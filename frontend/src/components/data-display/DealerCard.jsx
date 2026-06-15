import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, TrendingDown, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ZoneBadge } from './ZoneBadge';
import { formatCurrency, formatRelative } from '@/utils/format';
import { cn } from '@/utils/cn';

export function DealerCard({ dealer, basePath = '/employee/dealers' }) {
  const isPositive = dealer.trend >= 0;
  const pct = dealer.achievementPct ?? Math.round((dealer.achieved / dealer.target) * 100);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link to={`${basePath}/${dealer.id}`}>
        <Card className={cn(
          'h-full transition-shadow duration-base hover:shadow-md',
          dealer.zone === 'GREEN' && 'border-l-[3px] border-l-[var(--color-success)]',
          dealer.zone === 'RED' && 'border-l-[3px] border-l-[var(--color-danger)]',
          dealer.zone === 'YELLOW' && 'border-l-[3px] border-l-[var(--color-warning)]',
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate text-[var(--color-text-primary)]">{dealer.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {dealer.city}, {dealer.state}
                </p>
              </div>
              <ZoneBadge zone={dealer.zone} />
            </div>

            <div className="mt-4">
              <div className="flex items-end justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">Target achievement</span>
                <span className={cn('font-semibold tabular-nums', pct >= 100 ? 'text-[var(--color-success)]' : pct < 75 ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]')}>
                  {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-[var(--color-success)]' : pct < 75 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]')}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)] tabular-nums">
                {formatCurrency(dealer.achieved)} / {formatCurrency(dealer.target)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-surface-3 pt-3 text-xs">
              <span className={cn('flex items-center gap-1', isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(dealer.trend)}%
              </span>
              <span className="text-[var(--color-text-tertiary)]">Visit {formatRelative(dealer.lastVisit)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function DealerCardCompact({ dealer }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{dealer.name}</p>
        <p className="text-xs text-[var(--color-text-tertiary)]">{dealer.city}</p>
      </div>
      <ZoneBadge zone={dealer.zone} />
    </div>
  );
}
