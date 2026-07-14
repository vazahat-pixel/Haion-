import { queryKeys } from '@/services/api/queryKeys';
import { dealerGrnService } from '@/services/dealer-grn.service';
import { createListTable } from '../shared/createListTable';
import { dealerGrnColumns } from './columns.config';

export { DealerGRNDetailPanel } from './DealerGRNDetailPanel';

export const DealerGRNTable = createListTable({
  service: dealerGrnService,
  queryKey: queryKeys.dealerGrn.list,
  columns: dealerGrnColumns,
  basePath: '/dealer/grn',
  searchKeys: ['grnNo', 'dispatchNo'],
  filterKey: 'status',
  filterOptions: [
    { value: 'PENDING_VERIFICATION', label: 'Pending' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'REJECTED', label: 'Rejected' },
  ],
});
