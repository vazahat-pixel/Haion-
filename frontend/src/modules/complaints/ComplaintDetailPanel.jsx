import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { complaintsService } from '@/services/complaints.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { SLABadge } from '@/components/data-display/SLABadge';
import { Timeline } from '@/components/data-display/Timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

export function ComplaintDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.complaints.detail, complaintsService.getDetail, id);

  const { data: timeline = [] } = useQuery({
    queryKey: queryKeys.complaints.detail(id),
    queryFn: () => complaintsService.getTimeline(id),
    enabled: !!id,
  });

  const escalate = useMutation({
    mutationFn: () => complaintsService.escalate(id),
    onSuccess: () => {
      toast.success('Complaint escalated');
      qc.invalidateQueries({ queryKey: queryKeys.complaints.all });
      refetch();
    },
  });

  const resolve = useMutation({
    mutationFn: () => complaintsService.resolve(id),
    onSuccess: () => {
      toast.success('Complaint resolved');
      qc.invalidateQueries({ queryKey: queryKeys.complaints.all });
      refetch();
    },
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const canEscalate = !['RESOLVED', 'ESCALATED'].includes(data.status);
  const canResolve = data.status !== 'RESOLVED';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{data.ticketNo}</h2>
          <StatusBadge status={data.status} />
          {data.slaStatus && (
            <SLABadge status={data.slaStatus} remaining={data.slaRemaining} />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEscalate && (
            <Button size="sm" variant="outline" onClick={() => escalate.mutate()} disabled={escalate.isPending}>
              <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
            </Button>
          )}
          {canResolve && (
            <Button size="sm" onClick={() => resolve.mutate()} disabled={resolve.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
            </Button>
          )}
        </div>
      </div>

      {data.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Issue Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-[var(--color-text-secondary)]">{data.description}</p></CardContent>
        </Card>
      )}

      <DetailView
        fields={[
          { key: 'customer', label: 'Customer' },
          { key: 'product', label: 'Product' },
          { key: 'priority', label: 'Priority', format: 'badge' },
          { key: 'assignedTo', label: 'Assigned To' },
          { key: 'createdAt', label: 'Created', format: 'datetime' },
        ]}
        data={data}
      />

      {timeline.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
          <CardContent><Timeline events={timeline} /></CardContent>
        </Card>
      )}
    </div>
  );
}
