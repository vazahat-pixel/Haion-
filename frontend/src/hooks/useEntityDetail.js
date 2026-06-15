import { useQuery } from '@tanstack/react-query';

export function useEntityDetail(queryKey, queryFn, id) {
  return useQuery({
    queryKey: queryKey(id),
    queryFn: () => queryFn(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
