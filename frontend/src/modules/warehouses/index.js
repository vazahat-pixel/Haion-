import { queryKeys } from '@/services/api/queryKeys';
import { warehousesService } from '@/services/warehouses.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { warehouseColumns, warehouseDetailFields } from './columns.config';

export { WarehouseDrawer } from './WarehouseDrawer';

export const WarehouseTable = createListTable({
  service: warehousesService,
  queryKey: queryKeys.warehouses.list,
  columns: warehouseColumns,
  basePath: '/admin/warehouses',
  emptyTitle: 'No warehouses',
  emptyDescription: 'Add a warehouse to start managing inventory locations.',
  searchKeys: ['code', 'name', 'city', 'state', 'manager'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ],
  searchPlaceholder: 'Search warehouses…',
});

export const WarehouseDetail = createDetailView({
  service: warehousesService,
  queryKey: queryKeys.warehouses.detail,
  fields: warehouseDetailFields,
});
