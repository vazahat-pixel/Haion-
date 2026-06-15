import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export function usePanelDashboard(panel, filters = {}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', 'dashboard', panel, filters],
    queryFn: () => analyticsService.getDashboard(panel, filters),
    staleTime: 60_000,
  });

  return {
    kpis: data?.kpis || {},
    activities: data?.activities || [],
    alerts: data?.alerts || [],
    charts: data?.charts || { primary: [], secondary: [] },
    isLoading,
    isError,
    refetch,
  };
}
