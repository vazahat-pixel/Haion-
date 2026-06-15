import { queryKeys } from '@/services/api/queryKeys';
import { warrantyService } from '@/services/warranty.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { warrantyColumns, warrantyDetailFields } from './columns.config';

export const WarrantyTable = createListTable({
  service: warrantyService,
  queryKey: queryKeys.warranty.list,
  columns: warrantyColumns,
  basePath: '/dealer/warranty',
});

export const WarrantyDetail = createDetailView({
  service: warrantyService,
  queryKey: queryKeys.warranty.detail,
  fields: warrantyDetailFields,
});

export const CustomerWarrantyTable = createListTable({
  service: warrantyService,
  queryKey: queryKeys.warranty.list,
  columns: warrantyColumns,
  basePath: '/customer/warranty',
});

export const CustomerWarrantyDetail = createDetailView({
  service: warrantyService,
  queryKey: queryKeys.warranty.detail,
  fields: warrantyDetailFields,
});
