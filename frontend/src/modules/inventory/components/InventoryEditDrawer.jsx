import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import { inventoryService } from '@/services/inventory.service';
import { warehousesService } from '@/services/warehouses.service';
import { categoriesService } from '@/services/categories.service';
import { queryKeys } from '@/services/api/queryKeys';

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  category: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  warehouse: z.string().min(1),
  hsn: z.string().optional(),
});

export function InventoryEditDrawer({ open, onOpenChange, item }) {
  const qc = useQueryClient();
  const { data: whRes } = useQuery({
    queryKey: ['warehouses', 'inventory-edit'],
    queryFn: () => warehousesService.getList({ perPage: 50 }),
    enabled: open,
  });
  const { data: catRes } = useQuery({
    queryKey: ['categories', 'inventory-edit'],
    queryFn: () => categoriesService.getList({ perPage: 50 }),
    enabled: open,
  });

  const warehouseOptions = (whRes?.data || []).map((w) => ({ value: w.id, label: `${w.name} (${w.code})` }));
  const categoryOptions = (catRes?.data || []).map((c) => ({ value: c.name, label: c.name }));
  if (!categoryOptions.length) {
    ['Motors', 'Electronics', 'Pumps', 'Accessories'].forEach((name) => categoryOptions.push({ value: name, label: name }));
  }

  if (!item) return null;

  return (
    <DrawerForm
      key={item.id}
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Inventory Item"
      schema={schema}
      defaultValues={{
        sku: item.sku || '',
        name: item.name || '',
        category: item.category || '',
        quantity: item.quantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        warehouse: item.warehouseId || item.warehouse || warehouseOptions[0]?.value || '',
        hsn: item.hsn || '',
      }}
      fields={[
        { name: 'sku', label: 'SKU' },
        { name: 'name', label: 'Product Name' },
        { name: 'category', label: 'Category', type: 'select', options: categoryOptions },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'unitPrice', label: 'Unit Price (₹)', type: 'number' },
        { name: 'warehouse', label: 'Warehouse', type: 'select', options: warehouseOptions },
        { name: 'hsn', label: 'HSN Code' },
      ]}
      onSubmit={async (formData) => {
        await inventoryService.update(item.id, formData);
        qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      }}
      submitLabel="Save Changes"
    />
  );
}
