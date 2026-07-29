import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ReportDetail, downloadReportJson, downloadReportCsv, ReportDataView } from '@/modules/reports';
import { reportsService } from '@/services/reports.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function ReportDetailPage() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => reportsService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Reports', href: '/admin/reports' }}
      title={data?.title || 'Report Details'}
      subtitle={data ? `${data.type} · ${data.period || data.status}` : 'Generated report'}
      actions={data ? (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadReportCsv(data)}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadReportJson(data)}>
            <Download className="h-4 w-4" /> Download JSON
          </Button>
        </div>
      ) : null}
    >
      <ReportDetail id={id} />
      {data?.data && (
        <div className="mt-6">
          <ReportDataView data={data.data} />
        </div>
      )}
    </DetailPageShell>
  );
}
