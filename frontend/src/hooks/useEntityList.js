import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function useEntityList(queryKey, queryFn, filters = {}) {
  return useQuery({
    queryKey: queryKey(filters),
    queryFn: () => queryFn(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
