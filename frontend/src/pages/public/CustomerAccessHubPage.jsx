import { CustomerHub } from '@/modules/customer-portal/CustomerHub';
import { loadCustomerHubSession, loadCustomerAccessCredentials } from '@/modules/customer-portal/CustomerAccessForm';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ROUTES } from '@/constants/routes';
import { useCustomerHub } from '@/hooks/useCustomerHub';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CustomerHomeBackground } from '@/components/customer/CustomerHomeBackground';
import { CustomerFloatingNav } from '@/components/customer/CustomerFloatingNav';
import { CustomerHomeLoader } from '@/components/customer/CustomerHomeLoader';
import { MotionPage } from '@/components/motion/MotionPage';
import { useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';

export default function CustomerAccessHubPage() {
  const portal = useCustomerPortalConfig();
  const session = loadCustomerHubSession();
  const credentials = loadCustomerAccessCredentials();
  const hubFromSession = session?.hub ?? session;

  const { hub, isLoading, isError, refetch, isFetching } = useCustomerHub({
    enabled: !!credentials,
    guestCredentials: credentials,
  });

  const displayHub = useMemo(() => hub || hubFromSession, [hub, hubFromSession]);

  if (!hubFromSession && !credentials) {
    return <Navigate to={ROUTES.CUSTOMER_ACCESS} replace />;
  }

  return (
    <MotionPage className="relative min-h-screen">
      <CustomerHomeBackground />
      <CustomerFloatingNav
        onRefresh={credentials ? refetch : undefined}
        isRefreshing={isFetching}
        liveActive={portal.features?.liveTracking}
        profile={displayHub?.profile ?? hubFromSession?.profile}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg px-3 pt-[3.75rem] sm:max-w-2xl">
        <div className="mb-3">
          <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-xl text-xs" asChild>
            <Link to={ROUTES.CUSTOMER_ACCESS}><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
          </Button>
        </div>

        {credentials && isLoading && !displayHub && <CustomerHomeLoader />}
        {isError && <ErrorState message="Could not refresh account" onRetry={refetch} />}
        {displayHub && !(credentials && isLoading && !hub) && (
          <CustomerHub hub={displayHub} authenticated={false} />
        )}
      </div>
    </MotionPage>
  );
}
