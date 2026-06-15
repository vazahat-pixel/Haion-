import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { useParams } from 'react-router-dom';
import { ServiceRequestTrackingPanel } from '@/modules/service-requests/ServiceRequestTrackingPanel';

export default function ServiceRequestDetailPage() {
  const { id } = useParams();
  return (
    <CustomerPageShell title="Request Tracking" subtitle="Live status and timeline">
      <ServiceRequestTrackingPanel id={id} />
    </CustomerPageShell>
  );
}
