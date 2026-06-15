import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ReportDetail, downloadReportJson } from '@/modules/reports';
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
        <Button size="sm" variant="outline" onClick={() => downloadReportJson(data)}>
          <Download className="h-4 w-4" /> Download JSON
        </Button>
      ) : null}
    >
      <ReportDetail id={id} />
      {data?.summary && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{data.summary}</p>
      )}
    </DetailPageShell>
  );
}
