import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Wrench, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { sparesService } from '@/services/spares.service';
import { returnsService } from '@/services/returns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';
import { SERVICE_REQUEST_STATUS } from '@/constants/status';

const NEXT_ACTIONS = {
  [SERVICE_REQUEST_STATUS.NEW]: { status: SERVICE_REQUEST_STATUS.ASSIGNED, label: 'Assign & Start' },
  [SERVICE_REQUEST_STATUS.ASSIGNED]: { status: SERVICE_REQUEST_STATUS.IN_PROGRESS, label: 'Start Work' },
  [SERVICE_REQUEST_STATUS.IN_PROGRESS]: { status: SERVICE_REQUEST_STATUS.WAITING_PARTS, label: 'Waiting Parts' },
  [SERVICE_REQUEST_STATUS.WAITING_PARTS]: { status: SERVICE_REQUEST_STATUS.PARTS_RECEIVED, label: 'Parts Received' },
  [SERVICE_REQUEST_STATUS.PARTS_RECEIVED]: { status: SERVICE_REQUEST_STATUS.IN_PROGRESS, label: 'Resume Work' },
};

export function ServiceTicketDetailPanel({ id }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [returnSerial, setReturnSerial] = useState('');

  const { data, isLoading, isError, refetch } = useEntityDetail(
    queryKeys.serviceRequests.detail,
    serviceRequestsService.getDetail,
    id
  );

  const { data: timeline = [] } = useQuery({
    queryKey: [...queryKeys.serviceRequests.detail(id), 'timeline'],
    queryFn: () => serviceRequestsService.getTimeline(id),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.serviceRequests.all });
    refetch();
  };

  const assign = useMutation({
    mutationFn: () => serviceRequestsService.assign(id, { assignedToName: assignee || 'Technician' }),
    onSuccess: () => { toast.success('Ticket assigned'); invalidate(); },
  });

  const setStatus = useMutation({
    mutationFn: (status) => serviceRequestsService.updateStatus(id, status, note || undefined),
    onSuccess: () => { toast.success('Status updated'); setNote(''); invalidate(); },
  });

  const addNote = useMutation({
    mutationFn: () => serviceRequestsService.addNote(id, { text: note }),
    onSuccess: () => { toast.success('Note added'); setNote(''); invalidate(); },
  });

  const resolve = useMutation({
    mutationFn: () => serviceRequestsService.updateStatus(id, SERVICE_REQUEST_STATUS.RESOLVED, resolution),
    onSuccess: () => { toast.success('Ticket resolved'); setResolution(''); invalidate(); },
  });

  const close = useMutation({
    mutationFn: (opts = {}) => serviceRequestsService.close(id, {
      notes: resolution,
      confirmMissingReturn: opts.confirmMissingReturn,
    }),
    onSuccess: () => { toast.success('Ticket closed'); setShowReturnPrompt(false); invalidate(); },
    onError: (err) => {
      if (err?.code === 'MISSING_DEFECTIVE_RETURN') {
        setShowReturnPrompt(true);
        setReturnSerial(data?.serialNo || '');
        return;
      }
      toast.error(err?.response?.data?.message || 'Could not close ticket');
    },
  });

  const createReturn = useMutation({
    mutationFn: () => returnsService.create({
      product: data.product,
      serialNo: returnSerial || `DEF-${data.requestNo}`,
      reason: `Defective return for service ticket ${data.requestNo}`,
      serviceRequestId: id,
      returnedBy: data.assignedToName || 'Service Center',
    }),
    onSuccess: () => {
      toast.success('Defective return recorded — you can now close the ticket');
      setShowReturnPrompt(false);
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create return'),
  });

  const cancel = useMutation({
    mutationFn: () => serviceRequestsService.updateStatus(id, SERVICE_REQUEST_STATUS.CANCELLED, 'Cancelled'),
    onSuccess: () => { toast.success('Ticket cancelled'); invalidate(); },
  });

  const requestSpare = useMutation({
    mutationFn: () => sparesService.create({
      partName: data.product,
      quantity: 1,
      serviceRequestId: id,
      notes: `Spare for ticket ${data.requestNo}`,
    }),
    onSuccess: () => {
      toast.success('Spare request created');
      setStatus.mutate(SERVICE_REQUEST_STATUS.WAITING_PARTS);
    },
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const isClosed = ['CLOSED', 'CANCELLED'].includes(data.status);
  const events = timeline.map((e, i) => ({
    id: i,
    title: e.title,
    description: e.description,
    timestamp: e.at || e.timestamp,
    variant: e.variant,
  }));

  const next = NEXT_ACTIONS[data.status];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{data.requestNo}</h2>
          <StatusBadge status={data.status} />
          <StatusBadge status={data.priority} />
          {data.warrantyValid && <StatusBadge status="ACTIVE" />}
        </div>
        {!isClosed && (
          <div className="flex flex-wrap gap-2">
            {data.status === SERVICE_REQUEST_STATUS.NEW && (
              <>
                <Input className="h-8 w-40" placeholder="Assignee name" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                <Button size="sm" onClick={() => assign.mutate()} disabled={assign.isPending}><UserPlus className="h-3.5 w-3.5" /> Assign</Button>
              </>
            )}
            {next && data.status !== SERVICE_REQUEST_STATUS.NEW && (
              <Button size="sm" variant="outline" onClick={() => setStatus.mutate(next.status)} disabled={setStatus.isPending}>
                {next.label}
              </Button>
            )}
            {[SERVICE_REQUEST_STATUS.IN_PROGRESS, SERVICE_REQUEST_STATUS.PARTS_RECEIVED].includes(data.status) && (
              <Button size="sm" variant="outline" onClick={() => requestSpare.mutate()} disabled={requestSpare.isPending}>
                <Wrench className="h-3.5 w-3.5" /> Request Spare
              </Button>
            )}
            {data.status !== SERVICE_REQUEST_STATUS.RESOLVED && data.status !== SERVICE_REQUEST_STATUS.CLOSED && (
              <Button size="sm" variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}><XCircle className="h-3.5 w-3.5" /> Cancel</Button>
            )}
          </div>
        )}
      </div>

      <DetailView
        fields={[
          { key: 'customerName', label: 'Customer' },
          { key: 'product', label: 'Product' },
          { key: 'billNo', label: 'Bill Number' },
          { key: 'serialNo', label: 'Serial No' },
          { key: 'assignedToName', label: 'Assigned To' },
          { key: 'issue', label: 'Issue' },
          { key: 'createdAt', label: 'Created', format: 'datetime' },
        ]}
        data={data}
      />

      {!isClosed && (
        <Card>
          <CardHeader><CardTitle className="text-base">Technician Notes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={3} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addNote.mutate()} disabled={!note.trim() || addNote.isPending}>Add Note</Button>
            </div>
            {(data.notes || []).length > 0 && (
              <ul className="space-y-2 border-t border-surface-3 pt-3">
                {data.notes.map((n) => (
                  <li key={n._id || n.addedAt} className="text-sm">
                    <p className="text-[var(--color-text-primary)]">{n.text}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{n.addedBy} · {new Date(n.addedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {data.status === SERVICE_REQUEST_STATUS.IN_PROGRESS && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resolve Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution notes (required)" rows={3} />
            <Button size="sm" onClick={() => resolve.mutate()} disabled={!resolution.trim() || resolve.isPending}>
              <CheckCircle className="h-3.5 w-3.5" /> Mark Resolved
            </Button>
          </CardContent>
        </Card>
      )}

      {data.status === SERVICE_REQUEST_STATUS.RESOLVED && (
        <Card>
          <CardHeader><CardTitle className="text-base">Close Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {showReturnPrompt && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>Spare parts were dispatched but defective return is incomplete. Record the return or close with a flag.</p>
                </div>
                <Input
                  placeholder="Defective part serial number"
                  value={returnSerial}
                  onChange={(e) => setReturnSerial(e.target.value.toUpperCase())}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => createReturn.mutate()} disabled={createReturn.isPending}>
                    Record Defective Return
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => close.mutate({ confirmMissingReturn: true })} disabled={close.isPending}>
                    Close Anyway (Flagged)
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/service/defective-returns">View Returns</Link>
                  </Button>
                </div>
              </div>
            )}
            {!showReturnPrompt && (
              <Button size="sm" onClick={() => close.mutate()} disabled={close.isPending}>
                <Package className="h-3.5 w-3.5" /> Close Ticket
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Activity Timeline</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link to="/service/spare-parts">Spare Parts</Link></Button>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? <Timeline events={events} /> : <p className="text-sm text-[var(--color-text-tertiary)]">No activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
