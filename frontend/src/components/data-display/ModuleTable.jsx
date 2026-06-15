import { Link } from 'react-router-dom';
import { EnterpriseTable } from './EnterpriseTable';
import { EmptyState } from '@/components/feedback/EmptyState';
import { EmptyBoxIllustration } from '@/components/illustrations';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { MESSAGES } from '@/constants/messages';

export function withViewAction(columns, basePath) {
  return columns.map((col) => {
    if (col.key !== 'actions') return col;
    return {
      ...col,
      sortable: false,
      render: (_, row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${basePath}/${row.id}`}><Eye className="h-4 w-4" /></Link>
        </Button>
      ),
    };
  });
}

export function ModuleTable({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  emptyTitle = 'No records',
  emptyDescription = 'No records found.',
  emptyIllustration,
  basePath,
  searchKeys,
  filterKey,
  filterOptions,
  searchPlaceholder,
}) {
  const cols = basePath ? withViewAction(columns, basePath) : columns;
  const rows = data?.data ?? data ?? [];

  return (
    <EnterpriseTable
      columns={cols}
      data={rows}
      isLoading={isLoading}
      error={isError ? MESSAGES.SERVER_ERROR : null}
      onRetry={onRetry}
      searchKeys={searchKeys}
      filterKey={filterKey}
      filterOptions={filterOptions}
      searchPlaceholder={searchPlaceholder}
      emptyState={
        <EmptyState
          illustration={emptyIllustration || EmptyBoxIllustration}
          title={emptyTitle}
          description={emptyDescription}
        />
      }
    />
  );
}
