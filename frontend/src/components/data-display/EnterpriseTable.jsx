import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { DataTable } from './DataTable';
import { TableToolbar, TableFilterSelect } from './TableToolbar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const PAGE_SIZES = [10, 25, 50];

function exportCsv(columns, rows) {
  const headers = columns.filter((c) => c.key !== 'actions').map((c) => c.label);
  const keys = columns.filter((c) => c.key !== 'actions').map((c) => c.key);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(keys.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EnterpriseTable({
  columns,
  data = [],
  isLoading,
  error,
  onRetry,
  emptyState,
  searchKeys,
  filterKey,
  filterOptions,
  searchPlaceholder,
  compact,
  className,
  enableExport = true,
  pageSize: initialPageSize = 10,
  // Server-side support props
  serverSide = false,
  totalCount = 0,
  page: serverPage = 0,
  onPageChange,
  onPageSizeChange,
  onSearchChange: onServerSearchChange,
  onFilterChange: onServerFilterChange,
  onSortChange: onServerSortChange,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const searchableKeys = searchKeys || columns.filter((c) => c.key !== 'actions').map((c) => c.key);

  const filtered = useMemo(() => {
    if (serverSide) return data;
    let rows = [...data];
    if (filter && filterKey) rows = rows.filter((r) => String(r[filterKey]) === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchableKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, filter, filterKey, sortKey, sortDir, searchableKeys, serverSide]);

  const activePage = serverSide ? serverPage : page;
  const totalItemsCount = serverSide ? totalCount : filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / pageSize));
  const paged = serverSide ? data : filtered.slice(activePage * pageSize, (activePage + 1) * pageSize);

  const handlePageChange = (newPage) => {
    if (serverSide) {
      if (onPageChange) onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (serverSide) {
      if (onPageSizeChange) onPageSizeChange(newSize);
    } else {
      setPageSize(newSize);
      setPage(0);
    }
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    if (serverSide) {
      if (onServerSearchChange) onServerSearchChange(val);
    } else {
      setPage(0);
    }
  };

  const handleFilterChange = (val) => {
    setFilter(val);
    if (serverSide) {
      if (onServerFilterChange) onServerFilterChange(val);
    } else {
      setPage(0);
    }
  };

  const handleSortClick = (colKey) => {
    let nextDir = 'asc';
    if (sortKey === colKey) {
      nextDir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDir(nextDir);
    } else {
      setSortKey(colKey);
      setSortDir('asc');
    }
    if (serverSide) {
      if (onServerSortChange) onServerSortChange(colKey, nextDir);
    } else {
      setPage(0);
    }
  };

  const sortableColumns = columns.map((col) => {
    if (col.sortable === false || col.key === 'actions') return col;
    const isActive = sortKey === col.key;
    return {
      ...col,
      label: (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)]"
          onClick={() => handleSortClick(col.key)}
        >
          {col.label}
          {isActive ? (
            sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      ),
    };
  });

  return (
    <div className={cn('space-y-3', className)}>
      <TableToolbar
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={searchPlaceholder}
        totalCount={totalItemsCount}
        filteredCount={totalItemsCount}
        onExport={enableExport ? () => exportCsv(columns, filtered) : undefined}
        filters={
          filterKey && filterOptions?.length > 0 ? (
            <TableFilterSelect value={filter} onChange={handleFilterChange} options={filterOptions} />
          ) : null
        }
      />
      <DataTable
        columns={sortableColumns}
        data={paged}
        isLoading={isLoading}
        isEmpty={!isLoading && totalItemsCount === 0}
        error={error}
        onRetry={onRetry}
        emptyState={emptyState}
        compact={compact}
      />
      {!isLoading && totalItemsCount > 0 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-surface-3 bg-surface-1 px-2 text-sm"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {activePage * pageSize + 1}–{Math.min((activePage + 1) * pageSize, totalItemsCount)} of {totalItemsCount}
            </span>
            <Button variant="outline" size="sm" disabled={activePage === 0} onClick={() => handlePageChange(activePage - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={activePage >= totalPages - 1} onClick={() => handlePageChange(activePage + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
