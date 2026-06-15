import { Search, Download, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records…',
  totalCount,
  filteredCount,
  onExport,
  filters,
  actions,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 bg-surface-1"
          />
        </div>
        {filters}
      </div>
      <div className="flex items-center gap-2">
        {totalCount != null && (
          <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">
            {filteredCount != null && filteredCount !== totalCount
              ? `${filteredCount} of ${totalCount}`
              : `${totalCount} records`}
          </span>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}

export function TableFilterSelect({ value, onChange, options, label = 'Filter' }) {
  return (
    <div className="flex items-center gap-1.5">
      <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-surface-3 bg-surface-1 px-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">{label}: All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
