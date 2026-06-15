import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton({ columns = 5, rows = 8, compact = false }) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-3">
      <div className="border-b border-surface-3 bg-surface-2 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 border-b border-surface-3 px-4"
          style={{ height: compact ? 44 : 48, alignItems: 'center' }}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
