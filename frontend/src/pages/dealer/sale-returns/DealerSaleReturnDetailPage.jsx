import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { saleReturnsService } from '@/services/saleReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerSaleReturnDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.saleReturns.detail(id),
    queryFn: () => saleReturnsService.getDetail(id),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell back={{ label: 'Sale Returns', href: '/dealer/sale-returns' }} title={data.returnNo} subtitle={data.customerName}>
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Return Summary</CardTitle>
            <StatusBadge status={data.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Return No</dt><dd className="font-mono font-semibold">{data.returnNo}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Customer</dt><dd className="font-medium">{data.customerName}</dd></div>
              {data.customerPhone && <div><dt className="text-xs text-[var(--color-text-secondary)]">Phone</dt><dd>{data.customerPhone}</dd></div>}
              {data.billNo && <div><dt className="text-xs text-[var(--color-text-secondary)]">Original Bill No</dt><dd className="font-mono text-xs">{data.billNo}</dd></div>}
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Refund Amount</dt><dd className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.refundAmount)}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Restocked</dt><dd>{data.restock ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Date</dt><dd>{fmtDate(data.createdAt)}</dd></div>
            </dl>
            {data.reason && (
              <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-[var(--color-text-secondary)]">{data.reason}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Items</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.lineItems || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-surface-3">
                      <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                      <td className="px-3 py-2">{item.product}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {timelineEvents.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle></CardHeader>
            <CardContent><Timeline events={timelineEvents} /></CardContent>
          </Card>
        )}
      </div>
    </DetailPageShell>
  );
}
