import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ServiceTicketDetailPanel } from '@/modules/service-tickets';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { queryKeys } from '@/services/api/queryKeys';

export default function ServiceTicketDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: queryKeys.serviceRequests.detail(id),
    queryFn: () => serviceRequestsService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Service Tickets', href: '/service/tickets' }}
      title={data?.requestNo || 'Ticket Details'}
      subtitle={data ? `${data.customerName || 'Customer'} · ${data.status?.replace(/_/g, ' ')}` : 'Service lifecycle'}
    >
      <ServiceTicketDetailPanel id={id} />
    </DetailPageShell>
  );
}
