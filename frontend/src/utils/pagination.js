export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function getPaginationRange(page, perPage, total) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return { start, end, total };
}

export function buildPaginationParams({ page = 1, perPage = 20, sort, order, search, ...filters }) {
  return {
    page,
    perPage,
    ...(sort && { sort }),
    ...(order && { order }),
    ...(search && { search }),
    ...filters,
  };
}
