import { queryKeys } from '@/services/api/queryKeys';
import { manufactureService } from '@/services/manufacture.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { manufactureColumns, manufactureDetailFields } from './columns.config';

export const ManufactureTable = createListTable({
  service: manufactureService,
  queryKey: queryKeys.manufacture.list,
  columns: manufactureColumns,
  basePath: '/admin/manufacture',
  emptyTitle: 'No manufactures yet',
  emptyDescription: 'Combine purchased raw materials to make a finished product (e.g. Electric Scooter).',
  searchKeys: ['manufactureNo', 'finishedSku', 'finishedName'],
  filterKey: 'status',
  filterOptions: [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ],
  searchPlaceholder: 'Search manufactures…',
});

export const ManufactureDetail = createDetailView({
  service: manufactureService,
  queryKey: queryKeys.manufacture.detail,
  fields: manufactureDetailFields,
});

export { ManufactureForm } from './ManufactureForm';
