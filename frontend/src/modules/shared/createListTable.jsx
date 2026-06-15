import { ModuleTable } from '@/components/data-display/ModuleTable';
import { useEntityList } from '@/hooks/useEntityList';

export function createListTable({
  service,
  queryKey,
  columns,
  basePath,
  emptyTitle,
  emptyDescription,
  emptyIllustration,
  searchKeys,
  filterKey,
  filterOptions,
  searchPlaceholder,
}) {
  function Table({ filters = {} }) {
    const { data, isLoading, isError, refetch } = useEntityList(queryKey, service.getList, filters);
    return (
      <ModuleTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        basePath={basePath}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyIllustration={emptyIllustration}
        searchKeys={searchKeys}
        filterKey={filterKey}
        filterOptions={filterOptions}
        searchPlaceholder={searchPlaceholder}
      />
    );
  }
  return Table;
}
