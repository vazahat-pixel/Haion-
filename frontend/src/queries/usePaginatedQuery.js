import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function usePaginatedQuery({ queryKey, queryFn, filters, staleTime = 30_000 }) {
  return useQuery({
    queryKey: queryKey(filters),
    queryFn: () => queryFn(filters),
    staleTime,
    placeholderData: keepPreviousData,
  });
}
