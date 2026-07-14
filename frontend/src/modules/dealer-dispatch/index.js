import { queryKeys } from '@/services/api/queryKeys';
import { dealerDispatchService } from '@/services/dealer-dispatch.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { dealerDispatchColumns, dealerDispatchDetailFields } from './columns.config';
import { DispatchEmptyIllustration } from '@/components/illustrations';

export { DealerDispatchDetailWithTimeline } from './DealerDispatchDetailView';

export const DealerDispatchTable = createListTable({
  service: dealerDispatchService,
  queryKey: queryKeys.dealerDispatch.list,
  columns: dealerDispatchColumns,
  basePath: '/dealer/dispatches',
  searchKeys: ['dispatchNo', 'warehouse', 'trackingNo'],
  filterKey: 'status',
  filterOptions: [
    { value: 'PACKED', label: 'Packed' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
  ],
  searchPlaceholder: 'Search dispatch #, warehouse, tracking…',
  emptyTitle: 'No incoming dispatches',
  emptyDescription: 'Shipments from Haion warehouses will appear here when dispatched to you.',
  emptyIllustration: DispatchEmptyIllustration,
});

export const DealerDispatchDetail = createDetailView({
  service: dealerDispatchService,
  queryKey: queryKeys.dealerDispatch.detail,
  fields: dealerDispatchDetailFields,
});
