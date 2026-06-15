import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DealerCard } from './DealerCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { assignedDealersService } from '@/services/assigned-dealers.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
  { value: 'RED', label: 'Red' },
];

export function DealerCardGrid({ limit, basePath, className }) {
  const [zone, setZone] = useState('ALL');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.assignedDealers.list({}),
    queryFn: () => assignedDealersService.getList(),
  });

  const dealers = useMemo(() => {
    let rows = data?.data ?? [];
    if (zone !== 'ALL') rows = rows.filter((d) => d.zone === zone);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  }, [data, zone, limit]);

  if (isLoading) return <LoadingState message="Loading dealers…" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className={cn('space-y-4', className)}>
      {!limit && (
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setZone(f.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                zone === f.value ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100' : 'text-[var(--color-text-secondary)] hover:bg-surface-2'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {dealers.length === 0 ? (
        <EmptyState title="No dealers" description="No dealers match this filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {dealers.map((dealer) => (
            <DealerCard key={dealer.id} dealer={dealer} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
