import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { purchaseReturnsService } from '@/services/purchaseReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerPurchaseReturnDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.purchaseReturns.detail(id),
    queryFn: () => purchaseReturnsService.getDetail(id),
  });

  const ship = useMutation({
    mutationFn: () => purchaseReturnsService.ship(id),
    onSuccess: () => {
      toast.success('Marked as shipped');
      qc.invalidateQueries({ queryKey: queryKeys.purchaseReturns.all });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const canShip = data.status === 'REQUESTED';
  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell
      back={{ label: 'Purchase Returns', href: '/dealer/purchase-returns' }}
      title={data.returnNo}
      subtitle={`${(data.lineItems || []).length} item(s)`}
      actions={canShip ? (
        <Button size="sm" disabled={ship.isPending} onClick={() => ship.mutate()}>
          <Truck className="h-3.5 w-3.5" /> Mark as Shipped
        </Button>
      ) : null}
    >
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Return Summary</CardTitle>
            <StatusBadge status={data.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Return No</dt><dd className="font-mono font-semibold">{data.returnNo}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Return Amount</dt><dd className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.returnAmount)}</dd></div>
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Date</dt><dd>{fmtDate(data.createdAt)}</dd></div>
              {data.rejectReason && <div className="sm:col-span-3"><dt className="text-xs text-[var(--color-text-secondary)]">Reject Reason</dt><dd>{data.rejectReason}</dd></div>}
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
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.lineItems || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-surface-3">
                      <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                      <td className="px-3 py-2">{item.product}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
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
