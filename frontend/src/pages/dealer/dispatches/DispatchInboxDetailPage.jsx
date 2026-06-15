import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DealerDispatchDetail } from '@/modules/dealer-dispatch';

export default function DispatchInboxDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Dispatch Details">
      <DealerDispatchDetail id={id} />
    </PageShell>
  );
}
