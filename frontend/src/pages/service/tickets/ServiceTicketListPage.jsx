import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { ServiceTicketTable } from '@/modules/service-tickets';

export default function ServiceTicketListPage() {
  return (
    <PageShell
      title="Service Tickets"
      subtitle="Walk-in and routed service requests"
      actions={
        <Button size="sm" asChild>
          <Link to="/service/tickets/new"><Plus className="h-4 w-4" /> New Ticket</Link>
        </Button>
      }
    >
      <ServiceTicketTable />
    </PageShell>
  );
}
