import { queryKeys } from '@/services/api/queryKeys';
import { complaintsService } from '@/services/complaints.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { complaintColumns, complaintDetailFields } from './columns.config';
import { ComplaintCreateForm } from './ComplaintCreateForm';

export { ComplaintCreateForm };

export const ComplaintTable = createListTable({
  service: complaintsService,
  queryKey: queryKeys.complaints.list,
  columns: complaintColumns,
  basePath: '/service/complaints',
});

export const ComplaintDetail = createDetailView({
  service: complaintsService,
  queryKey: queryKeys.complaints.detail,
  fields: complaintDetailFields,
});
