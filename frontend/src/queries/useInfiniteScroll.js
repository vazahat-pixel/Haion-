import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteScroll({ queryKey, queryFn, initialPageParam = 1 }) {
  return useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.lastPage > lastPage.meta?.page ? lastPage.meta.page + 1 : undefined,
  });
}
