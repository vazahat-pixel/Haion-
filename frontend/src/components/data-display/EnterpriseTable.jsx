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
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const searchableKeys = searchKeys || columns.filter((c) => c.key !== 'actions').map((c) => c.key);

  const filtered = useMemo(() => {
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
  }, [data, search, filter, filterKey, sortKey, sortDir, searchableKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const sortableColumns = columns.map((col) => {
    if (col.sortable === false || col.key === 'actions') return col;
    const isActive = sortKey === col.key;
    return {
      ...col,
      label: (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)]"
          onClick={() => {
            if (isActive) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
            else { setSortKey(col.key); setSortDir('asc'); }
            setPage(0);
          }}
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
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder={searchPlaceholder}
        totalCount={data.length}
        filteredCount={filtered.length}
        onExport={enableExport ? () => exportCsv(columns, filtered) : undefined}
        filters={
          filterKey && filterOptions?.length > 0 ? (
            <TableFilterSelect value={filter} onChange={(v) => { setFilter(v); setPage(0); }} options={filterOptions} />
          ) : null
        }
      />
      <DataTable
        columns={sortableColumns}
        data={paged}
        isLoading={isLoading}
        isEmpty={!isLoading && filtered.length === 0}
        error={error}
        onRetry={onRetry}
        emptyState={emptyState}
        compact={compact}
      />
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="h-8 rounded-md border border-surface-3 bg-surface-1 px-2 text-sm"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
            </span>
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
