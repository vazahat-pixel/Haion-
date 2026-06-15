import { LoadingState } from '@/components/feedback/LoadingState';

export function EmployeePanelSkeleton() {
  return <LoadingState message="Loading employee panel..." fullPage />;
}
