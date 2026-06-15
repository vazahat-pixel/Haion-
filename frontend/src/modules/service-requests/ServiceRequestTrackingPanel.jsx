import { useQuery } from '@tanstack/react-query';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { WorkflowStepper } from '@/components/data-display/WorkflowStepper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TRACKING_STEPS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

const STATUS_STEP = {
  OPEN: 0,
  IN_PROGRESS: 2,
  RESOLVED: 3,
  CLOSED: 3,
};

export function ServiceRequestTrackingPanel({ id }) {
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

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const currentStep = STATUS_STEP[data.status] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{data.requestNo}</h2>
        <StatusBadge status={data.status} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Request Progress</CardTitle></CardHeader>
        <CardContent>
          <WorkflowStepper steps={TRACKING_STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      <DetailView
        fields={[
          { key: 'product', label: 'Product' },
          { key: 'issue', label: 'Issue Description' },
          { key: 'createdAt', label: 'Submitted', format: 'datetime' },
        ]}
        data={data}
      />

      {timeline.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking Timeline</CardTitle></CardHeader>
          <CardContent><Timeline events={timeline} /></CardContent>
        </Card>
      )}
    </div>
  );
}
