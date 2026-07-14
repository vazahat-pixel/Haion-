import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReportDetail, ReportDataView } from '@/modules/reports';
import { reportsService } from '@/services/reports.service';
import { queryKeys } from '@/services/api/queryKeys';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: queryKeys.reports.detail(id),
    queryFn: () => reportsService.getDetail(id),
  });

  return (
    <PageShell title={data?.title || 'Report Details'} subtitle={data?.period || 'Report information'}>
      <ReportDetail id={id} />
      {data?.data && (
        <div className="mt-6">
          <ReportDataView data={data.data} />
        </div>
      )}
    </PageShell>
  );
}
