import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle, Package, XCircle } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { sparesService } from '@/services/spares.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

const STEPS = ['PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED', 'COMPLETED'];

function stepIndex(status) {
  const idx = STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function SparePartsDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.spares.detail, sparesService.getDetail, id);

  const { data: timeline = [] } = useQuery({
    queryKey: [...queryKeys.spares.detail(id), 'timeline'],
    queryFn: () => sparesService.getTimeline(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.spares.all });
    refetch();
  };

  const approve = useMutation({ mutationFn: () => sparesService.approve(id), onSuccess: () => { toast.success('Request approved'); invalidate(); } });
  const reject = useMutation({ mutationFn: () => sparesService.reject(id, 'Rejected'), onSuccess: () => { toast.success('Request rejected'); invalidate(); } });
  const dispatch = useMutation({ mutationFn: () => sparesService.dispatch(id, {}), onSuccess: () => { toast.success('Parts dispatched'); invalidate(); } });
  const receive = useMutation({ mutationFn: () => sparesService.receive(id), onSuccess: () => { toast.success('Parts received'); invalidate(); } });
  const complete = useMutation({ mutationFn: () => sparesService.complete(id), onSuccess: () => { toast.success('Request completed'); invalidate(); } });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const events = timeline.map((e, i) => ({
    id: i,
    title: e.title,
    description: e.description,
    timestamp: e.at || e.timestamp,
    variant: e.variant,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{data.requestNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status === 'PENDING' && (
            <>
              <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
              <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
            </>
          )}
          {data.status === 'APPROVED' && (
            <Button size="sm" onClick={() => dispatch.mutate()} disabled={dispatch.isPending}><Truck className="h-3.5 w-3.5" /> Dispatch</Button>
          )}
          {data.status === 'DISPATCHED' && (
            <Button size="sm" onClick={() => receive.mutate()} disabled={receive.isPending}><Package className="h-3.5 w-3.5" /> Mark Received</Button>
          )}
          {['RECEIVED', 'DISPATCHED'].includes(data.status) && data.status !== 'COMPLETED' && (
            <Button size="sm" variant="outline" onClick={() => complete.mutate()} disabled={complete.isPending}><CheckCircle className="h-3.5 w-3.5" /> Complete</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Fulfillment Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${i <= stepIndex(data.status) ? 'bg-brand-100 text-brand-700' : 'bg-surface-2 text-[var(--color-text-tertiary)]'}`}>
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <DetailView
        fields={[
          { key: 'partName', label: 'Part Name' },
          { key: 'sku', label: 'SKU' },
          { key: 'quantity', label: 'Quantity', format: 'number' },
          { key: 'requestedBy', label: 'Requested By' },
          { key: 'createdAt', label: 'Requested', format: 'datetime' },
        ]}
        data={data}
      />

      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking Timeline</CardTitle></CardHeader>
          <CardContent><Timeline events={events} /></CardContent>
        </Card>
      )}
    </div>
  );
}
