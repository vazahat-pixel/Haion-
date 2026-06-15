import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Ban } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { DealerDetail } from '@/modules/dealers';
import { dealersService } from '@/services/dealers.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function DealerDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.dealers.detail(id),
    queryFn: () => dealersService.getDetail(id),
  });

  const updateStatus = useMutation({
    mutationFn: (status) => dealersService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Dealer status updated');
      qc.invalidateQueries({ queryKey: queryKeys.dealers.all });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const pending = data?.status === 'PENDING_ONBOARDING';
  const active = data?.status === 'ACTIVE';

  return (
    <DetailPageShell
      back={{ label: 'Dealers', href: '/admin/dealers' }}
      title={data?.name || 'Dealer Details'}
      subtitle={data ? `${data.code} · ${data.city} · ${data.status?.replace(/_/g, ' ')}` : 'Dealer profile'}
      actions={data ? (
        <>
          {pending && (
            <Button size="sm" onClick={() => updateStatus.mutate('ACTIVE')} disabled={updateStatus.isPending}>
              <CheckCircle className="h-4 w-4" /> Approve Dealer
            </Button>
          )}
          {active && (
            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate('SUSPENDED')} disabled={updateStatus.isPending}>
              <Ban className="h-4 w-4" /> Suspend
            </Button>
          )}
          {data.status === 'SUSPENDED' && (
            <Button size="sm" onClick={() => updateStatus.mutate('ACTIVE')} disabled={updateStatus.isPending}>
              <CheckCircle className="h-4 w-4" /> Reactivate
            </Button>
          )}
        </>
      ) : null}
    >
      <DealerDetail id={id} />
    </DetailPageShell>
  );
}
