import { queryKeys } from '@/services/api/queryKeys';
import { reportsService } from '@/services/reports.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { reportColumns, reportDetailFields } from './columns.config';
import { ReportHub } from './ReportHub';
import { ReportRunDialog } from './ReportRunDialog';
import { ReportDataView } from './ReportDataView';

export { ReportHub, ReportRunDialog, ReportDataView };

export const ReportTable = createListTable({
  service: reportsService,
  queryKey: queryKeys.reports.list,
  columns: reportColumns,
  basePath: '/employee/reports',
});

export const AdminReportTable = createListTable({
  service: reportsService,
  queryKey: queryKeys.reports.list,
  columns: reportColumns,
  basePath: '/admin/reports',
  emptyTitle: 'No reports generated yet',
  emptyDescription: 'Open Report Library, pick a report, and generate it — data comes live from the database.',
  searchKeys: ['title', 'type', 'author', 'reportCode', 'period'],
  filterKey: 'status',
  filterOptions: [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
  ],
  searchPlaceholder: 'Search reports…',
});

export const ReportDetail = createDetailView({
  service: reportsService,
  queryKey: queryKeys.reports.detail,
  fields: reportDetailFields,
});

export function downloadReportJson(report) {
  const blob = new Blob([JSON.stringify(report?.data || report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(report?.title || 'report').replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadReportCsv(report) {
  const data = report?.data;
  if (!data || !data.sections) {
    alert("No data available to export");
    return;
  }
  const tableSections = data.sections.filter(s => s.type === 'table');
  if (tableSections.length === 0) {
    alert("No tables found in this report to export");
    return;
  }

  let csvContent = "";
  tableSections.forEach((section) => {
    csvContent += `"${(section.title || 'Table').replace(/"/g, '""')}"\n`;
    const cols = section.columns || [];
    const headerLine = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(",");
    csvContent += headerLine + "\n";
    const rows = section.rows || [];
    rows.forEach((row) => {
      const rowLine = cols.map(c => {
        const val = row[c.key];
        const formatted = val == null ? "" : String(val);
        return `"${formatted.replace(/"/g, '""')}"`;
      }).join(",");
      csvContent += rowLine + "\n";
    });
    csvContent += "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(report?.title || 'report').replace(/\s+/g, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const deliveryColumns = [
  { key: 'reportType', label: 'Schedule' },
  { key: 'recipientType', label: 'Recipient' },
  { key: 'recipientEmail', label: 'Email' },
  { key: 'status', label: 'Status', render: (row) => row.status },
  { key: 'sentAt', label: 'Sent', render: (row) => row.sentAt ? new Date(row.sentAt).toLocaleString() : '—' },
];

export const ReportDeliveriesTable = createListTable({
  service: { getList: reportsService.getDeliveries },
  queryKey: [...queryKeys.reports.all, 'deliveries'],
  columns: deliveryColumns,
  emptyTitle: 'No scheduled deliveries yet',
  emptyDescription: 'Daily/weekly/monthly emails appear here after the report scheduler runs.',
  searchKeys: ['recipientEmail', 'recipientType', 'reportType'],
  filterKey: 'status',
  filterOptions: [
    { value: 'SENT', label: 'Sent' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'FAILED', label: 'Failed' },
  ],
  searchPlaceholder: 'Search deliveries…',
});
