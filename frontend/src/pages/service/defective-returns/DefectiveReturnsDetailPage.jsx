import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { DefectiveReturnsDetailPanel } from '@/modules/returns/DefectiveReturnsDetailPanel';

export default function DefectiveReturnsDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Return Details" subtitle="Defective return workflow">
      <DefectiveReturnsDetailPanel id={id} />
    </PageShell>
  );
}
