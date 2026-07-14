import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/utils/cn';

export function CustomerCardList({
  items = [],
  isLoading,
  isError,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  renderItem,
  basePath,
  className,
}) {
  if (isLoading) return <LoadingState message="Loading…" />;
  if (isError) return <ErrorState message="Could not load data" onRetry={onRetry} />;
  if (!items.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className={cn('space-y-2 lg:hidden', className)}>
      {items.map((item) => {
        const card = renderItem(item);
        const href = basePath && item.id ? `${basePath}/${item.id}` : null;
        const inner = (
          <div className="customer-card flex items-start justify-between gap-3 rounded-xl bg-surface-1 p-4">
            <div className="min-w-0 flex-1">{card}</div>
            {href && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />}
          </div>
        );
        return href ? (
          <Link key={item.id} to={href}>{inner}</Link>
        ) : (
          <div key={item.id || item.requestNo || item.orderNo}>{inner}</div>
        );
      })}
    </div>
  );
}

export function CustomerCardRow({ title, subtitle, meta, status }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        {status && <StatusBadge status={status} size="sm" />}
      </div>
      {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">{subtitle}</p>}
      {meta && <p className="mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">{meta}</p>}
    </>
  );
}

export function CustomerResponsiveList({ table: Table, cardList, filters }) {
  return (
    <>
      {cardList}
      <div className="hidden lg:block">
        <Table filters={filters} />
      </div>
    </>
  );
}
