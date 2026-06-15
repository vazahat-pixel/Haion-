import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ServiceRequestTable } from '@/modules/service-requests';

export default function ServiceRequestListPage() {
  return (
    <CustomerPageShell title="Service Requests" subtitle="Your service requests"
      actions={<Button size="sm" asChild><Link to="/customer/service-requests/new"><Plus className="h-4 w-4" /> New Request</Link></Button>}>
      <ServiceRequestTable />
    </CustomerPageShell>
  );
}
