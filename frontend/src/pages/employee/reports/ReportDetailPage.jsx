import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { ReportDetail } from '@/modules/reports';

export default function ReportDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Report Details" subtitle="Report information">
      <ReportDetail id={id} />
    </PageShell>
  );
}
