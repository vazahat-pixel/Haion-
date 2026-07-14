import { useQuery } from '@tanstack/react-query';
import { Truck, Package } from 'lucide-react';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from '@/services/api/queryKeys';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { WorkflowStepper } from '@/components/data-display/WorkflowStepper';
import { Timeline } from '@/components/data-display/Timeline';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LiveTrackingBadge } from '@/components/layout/CustomerAppShell';
import { formatDate } from '@/utils/format';

const TRACKING_STEPS = ['Confirmed', 'Processing', 'In Transit', 'Delivered'];

const STATUS_STEP = {
  CONFIRMED: 0,
  PROCESSING: 1,
  IN_TRANSIT: 2,
  DELIVERED: 3,
  CANCELLED: -1,
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

export function OrderTrackingPanel({ id }) {
  const portal = useCustomerPortalConfig();
  const refreshMs = portal.liveRefreshMs || 30000;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [...queryKeys.orders.detail(id), 'tracking'],
    queryFn: () => ordersService.getTracking(id),
    enabled: !!id,
    refetchInterval: portal.features?.liveTracking ? refreshMs : false,
  });

  if (isLoading) return <LoadingState message="Loading tracking…" />;
  if (isError || !data) return <ErrorState message="Could not load order tracking" onRetry={refetch} />;

  const currentStep = STATUS_STEP[data.status] ?? 0;
  const cancelled = data.status === 'CANCELLED';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{data.orderNo}</h2>
        <StatusBadge status={data.status} />
        {portal.features?.liveTracking && <LiveTrackingBadge active={isFetching || !['DELIVERED', 'CANCELLED'].includes(data.status)} />}
      </div>

      {!cancelled && (
        <Card className="customer-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-brand-600" /> Delivery Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowStepper steps={TRACKING_STEPS} currentStep={Math.max(0, currentStep)} />
            {(data.trackingNo || data.eta) && (
              <div className="mt-4 grid gap-2 rounded-lg bg-surface-2 p-3 text-sm">
                {data.trackingNo && (
                  <p><span className="text-[var(--color-text-secondary)]">Tracking #</span> <span className="font-mono font-medium">{data.trackingNo}</span></p>
                )}
                {data.eta && (
                  <p><span className="text-[var(--color-text-secondary)]">ETA</span> <span className="font-medium">{formatDate(data.eta)}</span></p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.timeline?.length > 0 && (
        <Card className="customer-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-brand-600" /> Live Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline events={mapTimeline(data.timeline)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
