import { LoadingState } from '@/components/feedback/LoadingState';

export function ServicePanelSkeleton() {
  return <LoadingState message="Loading service panel..." fullPage />;
}
