import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DealerGRNDetailPanel } from '@/modules/dealer-grn';

export default function DealerGRNDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="GRN Details" subtitle="Verify and confirm receipt">
      <DealerGRNDetailPanel id={id} />
    </PageShell>
  );
}
