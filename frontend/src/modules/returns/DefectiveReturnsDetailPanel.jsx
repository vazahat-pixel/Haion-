import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, CheckCircle } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { returnsService } from '@/services/returns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { WorkflowStepper } from '@/components/data-display/WorkflowStepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

export function DefectiveReturnsDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.returns.detail, returnsService.getDetail, id);

  const { data: workflow } = useQuery({
    queryKey: [...queryKeys.returns.detail(id), 'workflow'],
    queryFn: () => returnsService.getWorkflow(id),
    enabled: !!id,
  });

  const advance = useMutation({
    mutationFn: () => returnsService.advanceWorkflow(id),
    onSuccess: () => {
      toast.success('Return status updated');
      qc.invalidateQueries({ queryKey: queryKeys.returns.all });
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
          <h2 className="text-lg font-semibold">{data.returnNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        {canAdvance && (
          <Button size="sm" onClick={() => advance.mutate()} disabled={advance.isPending}>
            {workflow.currentStep === 1 ? <ClipboardCheck className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {workflow.currentStep === 1 ? 'Mark Inspected' : 'Advance Status'}
          </Button>
        )}
      </div>

      {workflow && (
        <Card>
          <CardHeader><CardTitle className="text-base">Return Workflow</CardTitle></CardHeader>
          <CardContent>
            <WorkflowStepper steps={workflow.steps} currentStep={workflow.currentStep} />
          </CardContent>
        </Card>
      )}

      <DetailView
        fields={[
          { key: 'product', label: 'Product' },
          { key: 'serialNo', label: 'Serial Number' },
          { key: 'reason', label: 'Reason' },
          { key: 'receivedAt', label: 'Received', format: 'datetime' },
        ]}
        data={data}
      />
    </div>
  );
}
