import { useQuery } from '@tanstack/react-query';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { queryKeys } from '@/services/api/queryKeys';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { WorkflowStepper } from '@/components/data-display/WorkflowStepper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveTrackingBadge } from '@/components/layout/CustomerAppShell';
import { Headphones } from 'lucide-react';

const TRACKING_STEPS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

const STATUS_STEP = {
  NEW: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  WAITING_PARTS: 2,
  PARTS_RECEIVED: 2,
  RESOLVED: 3,
  CLOSED: 3,
  CANCELLED: 0,
};

function mapTimeline(events = []) {
  return events.map((e, i) => ({
    id: i,
    title: e.title,
    description: e.description,
    variant: e.variant,
    timestamp: e.at || e.timestamp,
  }));
}

export function ServiceRequestTrackingPanel({ id }) {
  const portal = useCustomerPortalConfig();
  const refreshMs = portal.liveRefreshMs || 30000;

  const { data, isLoading, isError, refetch } = useEntityDetail(
    queryKeys.serviceRequests.detail,
    serviceRequestsService.getDetail,
    id,
    { refetchInterval: portal.features?.liveTracking ? refreshMs : false }
  );

  const { data: timeline = [], isFetching: timelineFetching } = useQuery({
    queryKey: [...queryKeys.serviceRequests.detail(id), 'timeline'],
    queryFn: () => serviceRequestsService.getTimeline(id),
    enabled: !!id,
    refetchInterval: portal.features?.liveTracking ? refreshMs : false,
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const currentStep = STATUS_STEP[data.status] ?? 0;
  const live = portal.features?.liveTracking && !['CLOSED', 'CANCELLED', 'RESOLVED'].includes(data.status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{data.requestNo}</h2>
        <StatusBadge status={data.status} />
        {live && <LiveTrackingBadge active={timelineFetching} />}
      </div>

      <Card className="customer-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Headphones className="h-4 w-4 text-brand-600" /> Service Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowStepper steps={TRACKING_STEPS} currentStep={currentStep} />
        </CardContent>
      </Card>

      <DetailView
        fields={[
          { key: 'product', label: 'Product' },
          { key: 'serialNo', label: 'Serial Number' },
          { key: 'billNo', label: 'Bill Number' },
          { key: 'issue', label: 'Issue Description' },
          { key: 'estimatedCompletion', label: 'Est. Completion', format: 'date' },
          { key: 'createdAt', label: 'Submitted', format: 'datetime' },
        ]}
        data={data}
      />

      {timeline.length > 0 && (
        <Card className="customer-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Live Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline events={mapTimeline(timeline)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
