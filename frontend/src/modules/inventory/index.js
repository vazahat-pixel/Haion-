import { queryKeys } from '@/services/api/queryKeys';
import { inventoryService } from '@/services/inventory.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { inventoryColumns, inventoryDetailFields } from './columns.config';

export { InventoryTable } from './components/InventoryTable';
export { InventoryListPanel } from './components/InventoryListPanel';
export { InventoryEditDrawer } from './components/InventoryEditDrawer';

export const InventoryDetail = createDetailView({
  service: inventoryService,
  queryKey: queryKeys.inventory.detail,
  fields: inventoryDetailFields,
});

export const AdminInventoryTable = createListTable({
  service: inventoryService,
  queryKey: queryKeys.inventory.list,
  columns: inventoryColumns,
  basePath: '/admin/inventory',
});
