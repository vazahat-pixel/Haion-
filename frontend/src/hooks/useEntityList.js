import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function useEntityList(queryKey, queryFn, filters = {}) {
  const resolvedQueryKey =
    typeof queryKey === 'function'
      ? queryKey(filters)
      : Array.isArray(queryKey)
        ? [...queryKey, filters]
        : [queryKey, filters];

  return useQuery({
    queryKey: resolvedQueryKey,
    queryFn: () => queryFn(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
