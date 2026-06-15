import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { sparesService } from '@/services/spares.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { WorkflowStepper } from '@/components/data-display/WorkflowStepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';

export function SparePartsDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.spares.detail, sparesService.getDetail, id);

  const { data: workflow } = useQuery({
    queryKey: [...queryKeys.spares.detail(id), 'workflow'],
    queryFn: () => sparesService.getWorkflow(id),
    enabled: !!id,
  });

  const advance = useMutation({
    mutationFn: () => sparesService.advanceWorkflow(id),
    onSuccess: () => {
      toast.success('Workflow updated');
      qc.invalidateQueries({ queryKey: queryKeys.spares.all });
      refetch();
    },
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const canAdvance = workflow && workflow.currentStep < workflow.steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{data.requestNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        {canAdvance && (
          <Button size="sm" onClick={() => advance.mutate()} disabled={advance.isPending}>
            {workflow.currentStep === 1 ? <Truck className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {workflow.currentStep === 1 ? 'Mark Dispatched' : 'Advance Status'}
          </Button>
        )}
      </div>

      {workflow && (
        <Card>
          <CardHeader><CardTitle className="text-base">Fulfillment Workflow</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <WorkflowStepper steps={workflow.steps} currentStep={workflow.currentStep} />
            {workflow.eta && (
              <p className="text-xs text-[var(--color-text-secondary)]">ETA: {formatDate(workflow.eta)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <DetailView
        fields={[
          { key: 'partName', label: 'Part Name' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'requestedBy', label: 'Requested By' },
          { key: 'createdAt', label: 'Requested', format: 'datetime' },
        ]}
        data={data}
      />
    </div>
  );
}
