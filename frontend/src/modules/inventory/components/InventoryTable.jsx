import { DataTable } from '@/components/data-display/DataTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { inventoryColumns } from '../columns.config';
import { useInventoryList } from '../queries/useInventoryList';
import { MESSAGES } from '@/constants/messages';

export function InventoryTable({ filters = {} }) {
  const { data, isLoading, isError, refetch } = useInventoryList(filters);

  const rows = data?.data || [];

  return (
    <DataTable
      columns={inventoryColumns}
      data={rows}
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      error={isError ? MESSAGES.SERVER_ERROR : null}
      onRetry={refetch}
      emptyState={
        <EmptyState
          title={MESSAGES.EMPTY_INVENTORY.title}
          description={MESSAGES.EMPTY_INVENTORY.description}
          primaryAction={MESSAGES.EMPTY_INVENTORY.action}
        />
      }
    />
  );
}
