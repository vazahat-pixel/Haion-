import { queryKeys } from '@/services/api/queryKeys';
import { sparesService } from '@/services/spares.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { sparesColumns, sparesDetailFields } from './columns.config';

export const SparesTable = createListTable({
  service: sparesService,
  queryKey: queryKeys.spares.list,
  columns: sparesColumns,
  basePath: '/service/spare-parts',
});

export const SparesDetail = createDetailView({
  service: sparesService,
  queryKey: queryKeys.spares.detail,
  fields: sparesDetailFields,
});
