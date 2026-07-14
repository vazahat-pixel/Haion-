import { queryKeys } from '@/services/api/queryKeys';
import { createListTable } from '../shared/createListTable';
import { dealerReportsService } from '@/services/dealer-reports.service';
import { reportColumns } from '../reports/columns.config';

export const DealerReportTable = createListTable({
  service: dealerReportsService,
  queryKey: queryKeys.dealerReports.list,
  columns: reportColumns,
  basePath: '/dealer/reports',
  emptyTitle: 'No reports generated yet',
  emptyDescription: 'Generate a report from the library — data comes live from your sales in the database.',
  searchKeys: ['title', 'type', 'period', 'reportCode'],
  filterKey: 'status',
  filterOptions: [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
  ],
});
