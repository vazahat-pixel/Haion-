import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { warehousesService } from '@/services/warehouses.service';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

const warehouseSchema = z.object({
  code: z.string().min(2, 'Code required'),
  name: z.string().min(2, 'Name required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  capacity: z.coerce.number().min(0),
  managerName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export function WarehouseDrawer({ open, onOpenChange, item = null }) {
  const qc = useQueryClient();
  const isEdit = Boolean(item?.id);
  const defaults = isEdit
    ? {
        code: item.code || '',
        name: item.name || '',
        city: item.city || '',
        state: item.state || '',
        capacity: item.capacity ?? 0,
        managerName: item.managerName || item.manager || '',
        status: item.status || 'ACTIVE',
      }
    : { code: '', name: '', city: '', state: '', capacity: 0, managerName: '', status: 'ACTIVE' };

  return (
    <DrawerForm
      key={isEdit ? item.id : 'new'}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
      schema={warehouseSchema}
      defaultValues={defaults}
      fields={[
        { name: 'code', label: 'Warehouse Code' },
        { name: 'name', label: 'Name' },
        { name: 'city', label: 'City' },
        { name: 'state', label: 'State' },
        { name: 'capacity', label: 'Capacity', type: 'number' },
        { name: 'managerName', label: 'Manager Name' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ],
        },
      ]}
      onSubmit={async (data) => {
        if (isEdit) {
          await warehousesService.update(item.id, data);
        } else {
          await warehousesService.create(data);
        }
        qc.invalidateQueries({ queryKey: queryKeys.warehouses.all });
      }}
      submitLabel={isEdit ? 'Save Changes' : 'Create Warehouse'}
    />
  );
}
