import { queryKeys } from '@/services/api/queryKeys';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { createListTable } from '../shared/createListTable';
import { serviceTicketColumns } from './columns.config';

export { ServiceTicketDetailPanel } from './ServiceTicketDetailPanel';
export { ServiceTicketCreateForm } from './ServiceTicketCreateForm';

export const ServiceTicketTable = createListTable({
  service: serviceRequestsService,
  queryKey: queryKeys.serviceRequests.list,
  columns: serviceTicketColumns,
  basePath: '/service/tickets',
  searchKeys: ['requestNo', 'customerName', 'product', 'serialNo'],
  filterKey: 'status',
  filterOptions: [
    { value: 'NEW', label: 'New' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_PARTS', label: 'Waiting Parts' },
    { value: 'PARTS_RECEIVED', label: 'Parts Received' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ],
  searchPlaceholder: 'Search ticket #, customer, product…',
  emptyTitle: 'No service tickets',
  emptyDescription: 'Create a ticket to start servicing a customer request.',
});
