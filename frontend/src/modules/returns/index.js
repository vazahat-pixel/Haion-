import { queryKeys } from '@/services/api/queryKeys';
import { returnsService } from '@/services/returns.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { returnsColumns, returnsDetailFields } from './columns.config';

export const ReturnsTable = createListTable({
  service: returnsService,
  queryKey: queryKeys.returns.list,
  columns: returnsColumns,
  basePath: '/service/defective-returns',
});

export const ReturnsDetail = createDetailView({
  service: returnsService,
  queryKey: queryKeys.returns.detail,
  fields: returnsDetailFields,
});
