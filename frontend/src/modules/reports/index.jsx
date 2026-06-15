import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { reportsService } from '@/services/reports.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { reportColumns, reportDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

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
  emptyTitle: 'No reports',
  emptyDescription: 'Generate operational or financial reports.',
  searchKeys: ['title', 'type', 'author'],
  filterKey: 'status',
  filterOptions: [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'FAILED', label: 'Failed' },
  ],
  searchPlaceholder: 'Search reports…',
});

export const ReportDetail = createDetailView({
  service: reportsService,
  queryKey: queryKeys.reports.detail,
  fields: reportDetailFields,
});

const reportSchema = z.object({
  title: z.string().min(3, 'Title required'),
  type: z.string().min(2, 'Type required'),
  period: z.string().min(2, 'Period required'),
});

export function ReportGenerateDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Report"
      schema={reportSchema}
      defaultValues={{ title: '', type: 'Sales', period: '' }}
      fields={[
        { name: 'title', label: 'Report Title' },
        {
          name: 'type',
          label: 'Report Type',
          type: 'select',
          options: [
            { value: 'Sales', label: 'Sales' },
            { value: 'Inventory', label: 'Inventory' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Dealers', label: 'Dealers' },
            { value: 'Operations', label: 'Operations' },
          ],
        },
        { name: 'period', label: 'Period (e.g. May 2024, Q2 2024)' },
      ]}
      onSubmit={async (data) => {
        await reportsService.create({
          ...data,
          status: 'COMPLETED',
          summary: `${data.type} report for ${data.period}`,
          data: { generatedAt: new Date().toISOString(), type: data.type, period: data.period },
        });
        qc.invalidateQueries({ queryKey: queryKeys.reports.all });
      }}
      submitLabel="Generate Report"
    />
  );
}

export function downloadReportJson(report) {
  const blob = new Blob([JSON.stringify(report?.data || report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(report?.title || 'report').replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
