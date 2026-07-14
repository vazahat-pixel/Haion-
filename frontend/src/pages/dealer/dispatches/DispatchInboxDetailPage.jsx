import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { DealerDispatchDetailWithTimeline } from '@/modules/dealer-dispatch';
import { dealerDispatchService } from '@/services/dealer-dispatch.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function DispatchInboxDetailPage() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: queryKeys.dealerDispatch.detail(id),
    queryFn: () => dealerDispatchService.getDetail(id),
  });

  const showGrnLink = data && !data.dealerConfirmedAt && ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(data.status);

  return (
    <DetailPageShell
      back={{ label: 'Dispatches', href: '/dealer/dispatches' }}
      title={data?.dispatchNo || 'Dispatch Details'}
      subtitle={data ? `${data.warehouse || 'Warehouse'} · ${data.status?.replace(/_/g, ' ')}` : 'Shipment tracking'}
      actions={showGrnLink ? (
        <Button size="sm" asChild>
          <Link to={`/dealer/grn/${id}`}>
            <ClipboardCheck className="h-4 w-4" /> Confirm GRN
          </Link>
        </Button>
      ) : null}
    >
      <DealerDispatchDetailWithTimeline />
    </DetailPageShell>
  );
}
