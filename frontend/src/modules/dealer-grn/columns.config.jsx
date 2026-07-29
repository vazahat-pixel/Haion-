import { StatusBadge } from '@/components/data-display/StatusBadge';

export const dealerGrnColumns = [
  {
    key: 'grnNo',
    label: 'GRN #',
    width: 160,
    render: (val, row) => {
      const isPending = row.status === 'PENDING_VERIFICATION' || row.status === 'PENDING';
      return (
        <div className="flex items-center gap-1.5 font-medium">
          <span className={isPending ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>{val}</span>
          {isPending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              NEW
            </span>
          )}
        </div>
      );
    },
  },
  { key: 'dispatchNo', label: 'Dispatch', width: 140 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'received', label: 'Received', width: 80, align: 'right', render: 'number' },
  {
    key: 'status',
    label: 'Status',
    width: 140,
    render: (val) => {
      const isPending = val === 'PENDING_VERIFICATION' || val === 'PENDING';
      if (isPending) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            PENDING
          </span>
        );
      }
      return <StatusBadge status={val} size="sm" />;
    },
  },
  { key: 'receivedAt', label: 'Date', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const dealerGrnDetailFields = [
  { key: 'grnNo', label: 'GRN Number' },
  { key: 'dispatchNo', label: 'Dispatch Reference' },
  { key: 'items', label: 'Expected Items', format: 'number' },
  { key: 'received', label: 'Received Items', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'receivedAt', label: 'Received At', format: 'datetime' },
];
