import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { DispatchDetailWithTimeline } from '@/modules/dispatch/DispatchDetailView';
import { dispatchService } from '@/services/dispatch.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

const NEXT_STATUS = {
  CREATED: 'PICKED',
  PICKED: 'PACKED',
  PACKED: 'DISPATCHED',
  DISPATCHED: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
};

const ACTION_LABELS = {
  PICKED: 'Mark Picked',
  PACKED: 'Mark Packed',
  DISPATCHED: 'Dispatch',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Mark Delivered',
};

export default function DispatchDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.dispatch.detail(id),
    queryFn: () => dispatchService.getDetail(id),
  });

  const nextStatus = data?.status ? NEXT_STATUS[data.status] : null;

  const advance = useMutation({
    mutationFn: (status) => dispatchService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Dispatch status updated');
      qc.invalidateQueries({ queryKey: queryKeys.dispatch.all });
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <DetailPageShell
      back={{ label: 'Dispatch', href: '/admin/dispatch' }}
      title={data?.dispatchNo || 'Dispatch Details'}
      subtitle={data ? `${data.dealer || ''} · ${data.status?.replace(/_/g, ' ')}` : 'Shipment tracking'}
      actions={nextStatus ? (
        <Button size="sm" onClick={() => advance.mutate(nextStatus)} disabled={advance.isPending}>
          <Truck className="h-4 w-4" /> {ACTION_LABELS[nextStatus]}
        </Button>
      ) : null}
    >
      <DispatchDetailWithTimeline />
    </DetailPageShell>
  );
}
