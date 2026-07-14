import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ReportDataView, downloadReportJson } from '@/modules/reports';
import { dealerReportsService } from '@/services/dealer-reports.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function DealerReportDetailPage() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: [...queryKeys.dealerReports.list, 'detail', id],
    queryFn: () => dealerReportsService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Reports', href: '/dealer/reports' }}
      title={data?.title || 'Report Details'}
      subtitle={data?.period || 'Database-generated report'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => downloadReportJson(data)}>
          <Download className="h-4 w-4" /> Download JSON
        </Button>
      ) : null}
    >
      {data?.data && <ReportDataView data={data.data} />}
    </DetailPageShell>
  );
}
