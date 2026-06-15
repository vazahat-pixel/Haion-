import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { ServiceRequestCreateForm } from '@/modules/service-requests';

export default function ServiceRequestNewPage() {
  return (
    <CustomerPageShell title="New Service Request" subtitle="Request a service visit">
      <ServiceRequestCreateForm />
    </CustomerPageShell>
  );
}
