import { StatusBadge } from '@/components/data-display/StatusBadge';
import { formatCurrency, formatRelative } from '@/utils/format';
import { cn } from '@/utils/cn';

function paymentStatusLabel(status) {
  const map = {
    paid: 'Paid',
    pending: 'Awaiting payment',
    cod_pending: 'Awaiting delivery',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return map[status] || status;
}

function paymentTone(status) {
  if (status === 'paid') return 'text-emerald-600';
  if (status === 'failed' || status === 'refunded') return 'text-red-600';
  return 'text-amber-600';
}

export const storeOrderColumns = [
  {
    key: 'orderNo',
    label: 'Order',
    width: '11%',
    render: (_v, row) => <span className="font-mono text-xs font-semibold truncate block">{row.orderNo}</span>,
  },
  {
    key: 'customerName',
    label: 'Customer',
    width: '17%',
    render: (_v, row) => (
      <div className="min-w-0">
        <p className="font-medium text-sm leading-tight truncate">{row.customerName}</p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{row.phone}</p>
      </div>
    ),
  },
  {
    key: 'lineItems',
    label: 'Product',
    width: '19%',
    render: (_v, row) => {
      const items = row.lineItems || [];
      if (!items.length) return '—';
      const label = items.map((i) => `${i.name}${items.length > 1 ? ` ×${i.quantity}` : ''}`).join(', ');
      return (
        <span className="text-sm truncate block" title={label}>
          {items[0].name}
          {items.length > 1 ? ` +${items.length - 1}` : ''}
        </span>
      );
    },
  },
  {
    key: 'total',
    label: 'Amount',
    width: '11%',
    align: 'right',
    render: (v) => <span className="font-medium tabular-nums whitespace-nowrap">{formatCurrency(v)}</span>,
  },
  {
    key: 'paymentStatus',
    label: 'Payment',
    width: '13%',
    render: (_v, row) => (
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{row.paymentMethod === 'razorpay' ? 'Online' : 'COD'}</p>
        <p className={cn('text-[10px] truncate', paymentTone(row.paymentStatus))}>
          {paymentStatusLabel(row.paymentStatus)}
        </p>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '11%',
    render: (v) => <StatusBadge status={v} size="sm" />,
  },
  {
    key: 'placedAt',
    label: 'Placed',
    width: '11%',
    render: (v) => (
      <span className="text-[var(--color-text-secondary)] whitespace-nowrap" title={v}>
        {formatRelative(v)}
      </span>
    ),
  },
];
