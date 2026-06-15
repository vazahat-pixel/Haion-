import { queryKeys } from '@/services/api/queryKeys';
import { auditService } from '@/services/audit.service';
import { createListTable } from '../shared/createListTable';
import { auditColumns } from './columns.config';

export const AuditLogTable = createListTable({
  service: auditService,
  queryKey: queryKeys.audit.list,
  columns: auditColumns,
  emptyTitle: 'No audit logs',
  searchKeys: ['action', 'user', 'module', 'ip'],
  filterKey: 'module',
  filterOptions: [
    { value: 'Auth', label: 'Auth' },
    { value: 'GRN', label: 'GRN' },
    { value: 'Billing', label: 'Billing' },
  ],
  searchPlaceholder: 'Search audit logs…',
});
