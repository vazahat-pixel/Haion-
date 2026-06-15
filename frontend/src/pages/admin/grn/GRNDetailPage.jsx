import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { GRNDetail } from '@/modules/grn';
import { grnService } from '@/services/grn.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function GRNDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.grn.detail(id),
    queryFn: () => grnService.getDetail(id),
  });

  const verify = useMutation({
    mutationFn: () => grnService.verify(id),
    onSuccess: () => {
      toast.success('GRN verified — stock updated');
      qc.invalidateQueries({ queryKey: queryKeys.grn.all });
      navigate('/admin/grn');
    },
    onError: () => toast.error('Failed to verify GRN'),
  });

  const reject = useMutation({
    mutationFn: () => grnService.reject(id, 'Rejected from admin console'),
    onSuccess: () => {
      toast.success('GRN rejected');
      qc.invalidateQueries({ queryKey: queryKeys.grn.all });
      navigate('/admin/grn');
    },
    onError: () => toast.error('Failed to reject GRN'),
  });

  const pending = data?.status === 'PENDING_VERIFICATION';

  return (
    <DetailPageShell
      back={{ label: 'GRN Monitoring', href: '/admin/grn' }}
      title={data?.grnNo || 'GRN Details'}
      subtitle={data ? `${data.supplier} · ${data.status?.replace(/_/g, ' ')}` : 'Goods receipt verification'}
      actions={pending ? (
        <>
          <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" onClick={() => verify.mutate()} disabled={verify.isPending}>
            <CheckCircle className="h-4 w-4" /> Verify GRN
          </Button>
        </>
      ) : null}
    >
      <GRNDetail id={id} />
    </DetailPageShell>
  );
}
