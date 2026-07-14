import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerPanelService } from '@/services/customer-panel.service';
import { queryKeys } from '@/services/api/queryKeys';

export const PortalConfigContext = createContext(null);

export const FALLBACK_PORTAL_CONFIG = {
  appName: 'Haion Customer',
  tagline: 'Your products, warranty & service in one place',
  primaryColor: '#c4714f',
  liveRefreshMs: 30000,
  features: {
    orders: true,
    warranty: true,
    serviceRequests: true,
    complaints: true,
    products: true,
    liveTracking: true,
    notifications: true,
  },
  announcements: [],
  quickLinks: [],
};

export function useCustomerPortalConfig() {
  return useContext(PortalConfigContext) || FALLBACK_PORTAL_CONFIG;
}

export function usePortalConfigQuery(initialConfig) {
  const { data: config } = useQuery({
    queryKey: queryKeys.customerPortal.config,
    queryFn: () => customerPanelService.getConfig(),
    staleTime: 5 * 60_000,
    initialData: initialConfig,
  });

  return useMemo(() => ({ ...FALLBACK_PORTAL_CONFIG, ...(config || {}) }), [config]);
}
