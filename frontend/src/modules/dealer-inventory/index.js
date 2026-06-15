import { dealerInventoryService } from '@/services/dealer-inventory.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { dealerInventoryColumns, dealerInventoryDetailFields } from './columns.config';

export const DealerInventoryTable = createListTable({
  service: dealerInventoryService,
  queryKey: (f) => ['dealer-inventory', 'list', f],
  columns: dealerInventoryColumns,
  basePath: '/dealer/inventory',
});

export const DealerInventoryDetail = createDetailView({
  service: dealerInventoryService,
  queryKey: (id) => ['dealer-inventory', 'detail', id],
  fields: dealerInventoryDetailFields,
});
