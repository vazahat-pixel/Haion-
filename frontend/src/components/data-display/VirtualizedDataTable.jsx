import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/utils/cn';

/**
 * VirtualizedDataTable
 * Optimized for rendering extremely large lists (1,000+ rows) smoothly.
 * It renders only the DOM elements currently visible in the scroll container.
 */
export function VirtualizedDataTable({ columns, data = [], height = 400, rowHeight = 48, className }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto border border-surface-3 rounded-lg bg-surface-1", className)}
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-2 border-b border-surface-3 text-xs uppercase tracking-wider text-[var(--color-text-secondary)] font-semibold">
            <tr className="flex w-full">
              {columns.map((col) => (
                <th key={col.key || col.id} className="px-4 py-3 font-semibold flex-1">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="block w-full">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <tr
                  key={virtualRow.key}
                  className="hover:bg-surface-2/50 border-b border-surface-3/50 text-sm transition-colors flex w-full"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.id} className="px-4 py-2 align-middle truncate flex-1 self-center">
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
