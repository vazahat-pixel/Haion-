import { LoadingState } from '@/components/feedback/LoadingState';

export function CustomerPanelSkeleton() {
  return <LoadingState message="Loading customer panel..." fullPage />;
}
