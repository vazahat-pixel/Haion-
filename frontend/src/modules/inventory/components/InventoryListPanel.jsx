import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ModuleTable } from '@/components/data-display/ModuleTable';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import { inventoryColumns } from '../columns.config';
import { useInventoryList } from '../queries/useInventoryList';
import { inventoryService } from '@/services/inventory.service';
import { warehousesService } from '@/services/warehouses.service';
import { categoriesService } from '@/services/categories.service';
import { queryKeys } from '@/services/api/queryKeys';
import { MESSAGES } from '@/constants/messages';

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(1),
  warehouse: z.string().min(1),
});

export function InventoryListPanel({ drawerOpen, onDrawerChange }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useInventoryList();
  const { data: whRes } = useQuery({
    queryKey: ['warehouses', 'inventory-form'],
    queryFn: () => warehousesService.getList({ perPage: 50 }),
  });
  const { data: catRes } = useQuery({
    queryKey: ['categories', 'inventory-form'],
    queryFn: () => categoriesService.getList({ perPage: 50 }),
  });
  const warehouseOptions = (whRes?.data || []).map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }));
  const categoryOptions = (catRes?.data || []).map((c) => ({ value: c.name, label: c.name }));
  if (!categoryOptions.length) {
    ['Motors', 'Electronics', 'Pumps', 'Accessories'].forEach((name) => categoryOptions.push({ value: name, label: name }));
  }
  const rows = data?.data ?? [];

  return (
    <>
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
        emptyTitle={MESSAGES.EMPTY_INVENTORY.title}
        emptyDescription={MESSAGES.EMPTY_INVENTORY.description}
      />
      <DrawerForm
        open={drawerOpen}
        onOpenChange={onDrawerChange}
        title="Add Inventory Item"
        schema={schema}
        defaultValues={{ sku: '', name: '', category: categoryOptions[0]?.value || 'Motors', quantity: 0, unitPrice: '', warehouse: warehouseOptions[0]?.value || '' }}
        fields={[
          { name: 'sku', label: 'SKU' },
          { name: 'name', label: 'Product Name' },
          { name: 'category', label: 'Category', type: 'select', options: categoryOptions },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'unitPrice', label: 'Unit Price (₹)', type: 'number' },
          { name: 'warehouse', label: 'Warehouse', type: 'select', options: warehouseOptions },
        ]}
        onSubmit={async (formData) => {
          if (inventoryService.create) {
            await inventoryService.create(formData);
          }
          qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
        }}
      />
    </>
  );
}
