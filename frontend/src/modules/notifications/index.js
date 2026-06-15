import { queryKeys } from '@/services/api/queryKeys';
import { notificationsService } from '@/services/notifications.service';
import { createListTable } from '../shared/createListTable';

const notificationColumns = [
  { key: 'title', label: 'Alert', width: 200 },
  { key: 'message', label: 'Message', width: 280 },
  { key: 'type', label: 'Type', width: 100, render: 'badge' },
  { key: 'read', label: 'Read', width: 80, render: (val) => (val ? 'Yes' : 'No'), sortable: false },
  { key: 'createdAt', label: 'When', width: 120, render: 'relativeDate' },
];

export const NotificationTable = createListTable({
  service: notificationsService,
  queryKey: queryKeys.notifications.list,
  columns: notificationColumns,
  searchKeys: ['title', 'message', 'type'],
  filterKey: 'type',
  filterOptions: [
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'GRN', label: 'GRN' },
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'DEALER', label: 'Dealer' },
  ],
});
