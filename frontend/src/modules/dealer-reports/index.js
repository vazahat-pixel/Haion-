import { queryKeys } from '@/services/api/queryKeys';
import { createListTable } from '../shared/createListTable';
import { dealerReportsService } from '@/services/dealer-reports.service';

const columns = [
  { key: 'title', label: 'Report', width: 240 },
  { key: 'type', label: 'Type', width: 100, render: 'badge' },
  { key: 'period', label: 'Period', width: 110 },
  { key: 'revenue', label: 'Revenue', width: 110, align: 'right', render: 'currency' },
  { key: 'bills', label: 'Bills', width: 70, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
];

export const DealerReportTable = createListTable({
  service: dealerReportsService,
  queryKey: queryKeys.dealerReports.list,
  columns,
  searchKeys: ['title', 'type', 'period'],
  filterKey: 'status',
  filterOptions: [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
  ],
});
