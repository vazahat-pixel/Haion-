import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ApprovalDetail } from '@/modules/approvals';
import { approvalsService } from '@/services/approvals.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.approvals.detail(id),
    queryFn: () => approvalsService.getDetail(id),
  });

  const approve = useMutation({
    mutationFn: () => approvalsService.update(id, { status: 'APPROVED' }),
    onSuccess: () => {
      toast.success('Request approved');
      qc.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: () => approvalsService.update(id, { status: 'REJECTED' }),
    onSuccess: () => {
      toast.success('Request rejected');
      qc.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const pending = data?.status === 'PENDING';

  return (
    <DetailPageShell
      back={{ label: 'Approvals', href: '/admin/approvals' }}
      title={data?.type || 'Approval Request'}
      subtitle={data ? `${data.requester} · ₹${Number(data.amount || 0).toLocaleString('en-IN')}` : 'Approval details'}
      actions={pending ? (
        <>
          <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
            <CheckCircle className="h-4 w-4" /> Approve
          </Button>
        </>
      ) : null}
    >
      <ApprovalDetail id={id} />
    </DetailPageShell>
  );
}
