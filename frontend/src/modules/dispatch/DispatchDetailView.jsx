import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DispatchDetail } from './index';
import { Timeline } from '@/components/data-display/Timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { dispatchService } from '@/services/dispatch.service';

export function DispatchDetailWithTimeline() {
  const { id } = useParams();
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['dispatch', 'tracking', id],
    queryFn: () => dispatchService.getTracking(id),
    enabled: Boolean(id),
  });

  return (
    <div className="space-y-6">
      <DispatchDetail id={id} />
      {isLoading && <LoadingState message="Loading tracking…" />}
      {!isLoading && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tracking Timeline</CardTitle></CardHeader>
          <CardContent>
            {timeline?.length > 0 ? (
              <Timeline events={timeline} />
            ) : (
              <EmptyState
                title="No tracking events yet"
                description="Status updates will appear here as the shipment progresses."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
