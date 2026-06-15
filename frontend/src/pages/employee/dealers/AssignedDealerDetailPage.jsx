import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DealerDrilldown } from '@/modules/assigned-dealers';

export default function AssignedDealerDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Dealer Profile" subtitle="Performance drilldown and sales trend">
      <DealerDrilldown id={id} />
    </PageShell>
  );
}
