import { useState } from 'react';
import { DataTable } from '@/components/data-display/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { storeOrderColumns } from '../columns.config';
import { useStoreOrdersList } from '../queries/useStoreOrders';
import { StoreOrderDetailDrawer } from './StoreOrderDetailDrawer';
import { StoreOrdersSummary } from './StoreOrdersSummary';
import { cn } from '@/utils/cn';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PENDING', label: 'Unpaid' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'IN_TRANSIT', label: 'In transit' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_FILTERS = [
  { id: '', label: 'All payments' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'cod_pending', label: 'COD' },
];

function FilterChip({ active, onClick, children, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        active
          ? tone === 'amber'
            ? 'border-amber-600 bg-amber-600 text-white'
            : 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-surface-3 bg-surface-1 text-[var(--color-text-secondary)] hover:border-zinc-400 hover:text-[var(--color-text-primary)]'
      )}
    >
      {children}
    </button>
  );
}

export function StoreOrdersTable() {
  const [filters, setFilters] = useState({ page: 1, perPage: 20 });
  const [selectedId, setSelectedId] = useState(null);
  const { data, isLoading, isError, refetch } = useStoreOrdersList(filters);

  const rows = data?.data || [];

  const setFilter = (patch) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <StoreOrdersSummary />

      <div className="rounded-lg border border-surface-3 bg-surface-1/60 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Order
          </span>
          {STATUS_FILTERS.map(({ id, label }) => (
            <FilterChip
              key={id || 'all'}
              active={(filters.status || '') === id}
              onClick={() => setFilter({ status: id || undefined })}
            >
              {label}
            </FilterChip>
          ))}
        </div>
        <div className="h-px bg-surface-3" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Payment
          </span>
          {PAYMENT_FILTERS.map(({ id, label }) => (
            <FilterChip
              key={id || 'all-pay'}
              active={(filters.paymentStatus || '') === id}
              tone="amber"
              onClick={() => setFilter({ paymentStatus: id || undefined })}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      <DataTable
        compact
        columns={[
          ...storeOrderColumns,
          {
            key: 'actions',
            label: '',
            width: '7%',
            sticky: 'right',
            render: 'actions',
            actions: (row) => (
              <button
                type="button"
                onClick={() => setSelectedId(row.id)}
                className="text-xs font-semibold text-brand-600 hover:underline whitespace-nowrap"
              >
                View
              </button>
            ),
          },
        ]}
        data={rows}
        isLoading={isLoading}
        isEmpty={!isLoading && rows.length === 0}
        error={isError ? 'Failed to load orders' : null}
        onRetry={refetch}
        emptyState={
          <EmptyState
            title="No website orders yet"
            description="Orders placed on the landing store will appear here."
          />
        }
      />

      {data?.pagination?.total > filters.perPage && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            className="px-3 py-1 text-xs border rounded disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-[var(--color-text-secondary)] self-center">
            Page {filters.page} · {data.pagination.total} orders
          </span>
          <button
            type="button"
            disabled={filters.page * filters.perPage >= data.pagination.total}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            className="px-3 py-1 text-xs border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <StoreOrderDetailDrawer
        orderId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
