import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { ComplaintDetailPanel } from '@/modules/complaints/ComplaintDetailPanel';

export default function ComplaintDetailPage() {
  const { ticketId } = useParams();
  return (
    <PageShell title="Complaint Details" subtitle="SLA tracking and resolution">
      <ComplaintDetailPanel id={ticketId} />
    </PageShell>
  );
}
