import { motion } from 'framer-motion';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatusBadge } from './StatusBadge';
import { formatDate, formatRelative, formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { tableRow, tableBody } from '@/animations/motion.config';

function renderCell(column, row) {
  const value = row[column.key];

  switch (column.render) {
    case 'badge':
      return <StatusBadge status={value} size="sm" />;
    case 'currency':
      return <span className="tabular-nums">{formatCurrency(value)}</span>;
    case 'number':
      return <span className="tabular-nums">{formatNumber(value)}</span>;
    case 'date':
      return formatDate(value);
    case 'relativeDate':
      return formatRelative(value);
    case 'actions':
      return column.actions?.(row) || null;
    default:
      if (column.render && typeof column.render === 'function') return column.render(value, row);
      return value ?? '—';
  }
}

export function DataTable({
  columns,
  data = [],
  isLoading,
  isEmpty,
  error,
  onRetry,
  emptyState,
  compact = false,
  className,
}) {
  if (isLoading) return <TableSkeleton columns={columns.length} rows={8} compact={compact} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty || data.length === 0) {
    return emptyState || <EmptyState title="No data" description="No records found." />;
  }

  return (
    <motion.div
      className={cn('overflow-x-auto rounded-lg border border-surface-3 bg-surface-1 shadow-sm transition-shadow duration-200 hover:shadow-md', className)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-surface-3 bg-surface-2/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'erp-table-header px-3 py-2 text-left',
                  col.align === 'right' && 'text-right',
                  col.sticky === 'right' && 'sticky right-0 bg-surface-2'
                )}
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody variants={tableBody} initial="initial" animate="animate">
          {data.map((row, i) => (
            <motion.tr
              key={row.id || i}
              variants={tableRow}
              className="border-b border-surface-3/80 transition-colors duration-150 hover:bg-surface-2/80 last:border-0"
              style={{ height: compact ? 36 : 40 }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-3 py-1.5 text-[var(--color-text-primary)]',
                    col.align === 'right' && 'text-right',
                    col.sticky === 'right' && 'sticky right-0 bg-surface-0'
                  )}
                >
                  {renderCell(col, row)}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </motion.div>
  );
}
