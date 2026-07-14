import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle, ClipboardCheck, XCircle, Package } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { returnsService } from '@/services/returns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

const STEPS = ['EXPECTED', 'SHIPPED', 'RECEIVED', 'VERIFIED'];

export function DefectiveReturnsDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.returns.detail, returnsService.getDetail, id);

  const { data: timeline = [] } = useQuery({
    queryKey: [...queryKeys.returns.detail(id), 'timeline'],
    queryFn: () => returnsService.getTimeline(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.returns.all });
    refetch();
  };

  const ship = useMutation({ mutationFn: () => returnsService.ship(id), onSuccess: () => { toast.success('Marked as shipped'); invalidate(); } });
  const receive = useMutation({ mutationFn: () => returnsService.receive(id, {}), onSuccess: () => { toast.success('Marked as received'); invalidate(); } });
  const inspect = useMutation({ mutationFn: () => returnsService.inspect(id, { notes: 'Inspection recorded' }), onSuccess: () => { toast.success('Inspection recorded'); invalidate(); } });
  const verify = useMutation({ mutationFn: () => returnsService.verify(id, { approved: true }), onSuccess: () => { toast.success('Return verified'); invalidate(); } });
  const reject = useMutation({ mutationFn: () => returnsService.verify(id, { approved: false, notes: 'Rejected' }), onSuccess: () => { toast.success('Return rejected'); invalidate(); } });

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

  const stepIdx = STEPS.indexOf(data.status === 'REJECTED' ? 'VERIFIED' : data.status === 'OVERDUE' ? 'EXPECTED' : data.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{data.returnNo}</h2>
          <StatusBadge status={data.status} />
          {data.overdue && <StatusBadge status="OVERDUE" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {['EXPECTED', 'OVERDUE'].includes(data.status) && (
            <Button size="sm" onClick={() => ship.mutate()} disabled={ship.isPending}><Truck className="h-3.5 w-3.5" /> Mark Shipped</Button>
          )}
          {data.status === 'SHIPPED' && (
            <Button size="sm" onClick={() => receive.mutate()} disabled={receive.isPending}><Package className="h-3.5 w-3.5" /> Mark Received</Button>
          )}
          {data.status === 'RECEIVED' && (
            <>
              <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
              <Button size="sm" onClick={() => inspect.mutate()} disabled={inspect.isPending}><ClipboardCheck className="h-3.5 w-3.5" /> Inspect</Button>
              <Button size="sm" onClick={() => verify.mutate()} disabled={verify.isPending}><CheckCircle className="h-3.5 w-3.5" /> Verify</Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Return Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${i <= stepIdx ? 'bg-brand-100 text-brand-700' : 'bg-surface-2 text-[var(--color-text-tertiary)]'}`}>
                {s}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <DetailView
        fields={[
          { key: 'product', label: 'Product' },
          { key: 'serialNo', label: 'Serial Number' },
          { key: 'reason', label: 'Reason' },
          { key: 'spareRequest', label: 'Linked Spare Request' },
          { key: 'serviceRequest', label: 'Service Ticket' },
          { key: 'conditionOnArrival', label: 'Condition' },
          { key: 'receivedAt', label: 'Received', format: 'datetime' },
        ]}
        data={data}
      />

      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Audit Timeline</CardTitle></CardHeader>
          <CardContent><Timeline events={events} /></CardContent>
        </Card>
      )}
    </div>
  );
}
