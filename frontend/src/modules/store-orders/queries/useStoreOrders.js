import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { storeAdminService } from '@/services/storeAdmin.service';

export function useStoreOrdersList(filters = {}) {
  return useQuery({
    queryKey: ['store-orders', filters],
    queryFn: () => storeAdminService.getOrders(filters),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useStoreOrderDetail(id) {
  return useQuery({
    queryKey: ['store-orders', id],
    queryFn: () => storeAdminService.getOrder(id),
    enabled: Boolean(id),
  });
}

export function useStoreTopProducts(limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['store-analytics', 'top-products', limit],
    queryFn: () => storeAdminService.getTopProducts(limit),
    staleTime: 60_000,
    enabled,
  });
}
