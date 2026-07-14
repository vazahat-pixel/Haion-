import { ModuleTable } from '@/components/data-display/ModuleTable';
import { inventoryColumns } from '../columns.config';
import { useInventoryList } from '../queries/useInventoryList';
import { MESSAGES } from '@/constants/messages';

export function InventoryListPanel() {
  const { data, isLoading, isError, refetch } = useInventoryList();
  const rows = data?.data ?? [];

  return (
    <ModuleTable
      columns={inventoryColumns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      basePath="/admin/inventory"
      searchKeys={['sku', 'name', 'category', 'warehouse']}
      filterKey="status"
      filterOptions={[
        { value: 'IN_STOCK', label: 'In Stock' },
        { value: 'LOW_STOCK', label: 'Low Stock' },
        { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
      ]}
      emptyTitle="No inventory items yet"
      emptyDescription="Items will appear here automatically when purchases are received. Go to Purchases → create a purchase → mark it as received."
    />
  );
}
