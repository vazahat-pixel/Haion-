import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerPanelService } from '@/services/customer-panel.service';
import { queryKeys } from '@/services/api/queryKeys';
import { useCustomerPortalConfig } from './useCustomerPortalConfig';

export function useCustomerHub({ enabled = true, guestCredentials } = {}) {
  const portal = useCustomerPortalConfig();
  const qc = useQueryClient();
  const refreshMs = portal.liveRefreshMs || 30000;

  const authQuery = useQuery({
    queryKey: queryKeys.customerPortal.hub,
    queryFn: () => customerPanelService.getMyHub(),
    enabled: enabled && !guestCredentials,
    refetchInterval: portal.features?.liveTracking ? refreshMs : false,
    staleTime: 15_000,
  });

  const guestQuery = useQuery({
    queryKey: [...queryKeys.customerPortal.hub, 'guest', guestCredentials],
    queryFn: () => customerPanelService.refresh(guestCredentials),
    enabled: enabled && !!guestCredentials,
    refetchInterval: portal.features?.liveTracking ? refreshMs : false,
    staleTime: 15_000,
  });

  const active = guestCredentials ? guestQuery : authQuery;

  const refresh = async () => {
    if (guestCredentials) {
      await guestQuery.refetch();
    } else {
      await qc.invalidateQueries({ queryKey: queryKeys.customerPortal.hub });
      await authQuery.refetch();
    }
  };

  return {
    hub: active.data,
    isLoading: active.isLoading,
    isError: active.isError,
    isFetching: active.isFetching,
    refetch: refresh,
    refreshedAt: active.data?.refreshedAt,
  };
}
