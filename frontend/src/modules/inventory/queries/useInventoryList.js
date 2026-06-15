import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { inventoryService } from '@/services/inventory.service';

export function useInventoryList(filters = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.list(filters),
    queryFn: () => inventoryService.getList(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
