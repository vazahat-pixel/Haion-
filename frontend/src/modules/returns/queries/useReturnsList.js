import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';

export function useReturnsList(filters = {}) {
  return useQuery({
    queryKey: queryKeys.returns.list(filters),
    queryFn: async () => ({ data: [], meta: { total: 0, page: 1, perPage: 20, lastPage: 0 } }),
    staleTime: 30_000,
  });
}
