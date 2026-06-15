import { queryKeys } from '@/services/api/queryKeys';
import { dispatchService } from '@/services/dispatch.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { dispatchColumns, dispatchDetailFields } from './columns.config';

export const DispatchTable = createListTable({
  service: dispatchService,
  queryKey: queryKeys.dispatch.list,
  columns: dispatchColumns,
  basePath: '/admin/dispatch',
  emptyTitle: 'No dispatches',
  emptyDescription: 'Create a dispatch to ship stock to a dealer.',
  searchKeys: ['dispatchNo', 'dealer', 'warehouse'],
  filterKey: 'status',
  filterOptions: [
    { value: 'PACKED', label: 'Packed' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
  ],
});

export const DispatchDetail = createDetailView({
  service: dispatchService,
  queryKey: queryKeys.dispatch.detail,
  fields: dispatchDetailFields,
});
