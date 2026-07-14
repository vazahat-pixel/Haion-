import { queryKeys } from '@/services/api/queryKeys';
import { purchasesService } from '@/services/purchases.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { purchaseColumns, purchaseDetailFields } from './columns.config';

export const PurchaseTable = createListTable({
  service: purchasesService,
  queryKey: queryKeys.purchases.list,
  columns: purchaseColumns,
  basePath: '/admin/purchases',
  emptyTitle: 'No purchases',
  emptyDescription: 'Create a purchase against a supplier to receive stock into warehouse.',
  searchKeys: ['purchaseNo', 'billNo', 'partyName'],
  filterKey: 'status',
  filterOptions: [
    { value: 'PENDING', label: 'Pending' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ],
  searchPlaceholder: 'Search purchases…',
});

export const PurchaseDetail = createDetailView({
  service: purchasesService,
  queryKey: queryKeys.purchases.detail,
  fields: purchaseDetailFields,
});

export { PurchaseForm } from './PurchaseForm';
