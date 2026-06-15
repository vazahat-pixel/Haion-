import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { SparePartsDetailPanel } from '@/modules/spares/SparePartsDetailPanel';

export default function SparePartsDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Request Details" subtitle="Spare parts fulfillment">
      <SparePartsDetailPanel id={id} />
    </PageShell>
  );
}
