import { CustomerHub } from '@/modules/customer-portal/CustomerHub';
import { useCustomerHub } from '@/hooks/useCustomerHub';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { CustomerHomeBackground } from '@/components/customer/CustomerHomeBackground';
import { CustomerFloatingNav } from '@/components/customer/CustomerFloatingNav';
import { CustomerHomeLoader } from '@/components/customer/CustomerHomeLoader';
import { MotionPage } from '@/components/motion/MotionPage';

export default function CustomerDashboardPage() {
  const portal = useCustomerPortalConfig();
  const { hub, isLoading, isError, refetch, isFetching } = useCustomerHub();

  return (
    <MotionPage className="relative min-h-screen">
      <CustomerHomeBackground />

      <CustomerFloatingNav
        onRefresh={refetch}
        isRefreshing={isFetching}
        liveActive={portal.features?.liveTracking}
        profile={hub?.profile}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg px-3 pt-[3.75rem] sm:max-w-2xl lg:max-w-5xl lg:pt-20">
        {isLoading && <CustomerHomeLoader />}
        {isError && <ErrorState message="Could not load account" onRetry={refetch} />}
        {hub && !isLoading && <CustomerHub hub={hub} authenticated />}
      </div>
    </MotionPage>
  );
}
