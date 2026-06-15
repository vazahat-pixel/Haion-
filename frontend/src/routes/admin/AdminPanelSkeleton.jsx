import { LoadingState } from '@/components/feedback/LoadingState';

export function AdminPanelSkeleton() {
  return <LoadingState message="Loading Admin Console..." fullPage />;
}
