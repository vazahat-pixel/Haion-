import { PageShell } from '@/components/layout/PageShell';
import { ServiceTicketCreateForm } from '@/modules/service-tickets';

export default function ServiceTicketNewPage() {
  return (
    <PageShell title="New Service Ticket" subtitle="Validate warranty, then create ticket">
      <ServiceTicketCreateForm />
    </PageShell>
  );
}
