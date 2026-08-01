import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { saleReturnsService } from '@/services/saleReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminSaleReturnDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [voidNotes, setVoidNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.saleReturns.detail(id),
    queryFn: () => saleReturnsService.getDetail(id),
  });

  const voidReturn = useMutation({
    mutationFn: () => saleReturnsService.void(id, { notes: voidNotes }),
    onSuccess: () => {
      toast.success('Sale return voided');
      qc.invalidateQueries({ queryKey: queryKeys.saleReturns.all });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to void return'),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const canVoid = data.status === 'COMPLETED';
  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell
      back={{ label: 'Dealer Sale Returns', href: '/admin/dealer-sale-returns' }}
      title={data.returnNo}
      subtitle={`${data.dealerName} · ${data.customerName}`}
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
              <div><dt className="text-xs text-[var(--color-text-secondary)]">Dealer</dt><dd className="font-medium">{data.dealerName}</dd></div>
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

        {canVoid && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Void This Return</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Notes (optional)" value={voidNotes} onChange={(e) => setVoidNotes(e.target.value)} />
              <Button
                size="sm"
                variant="destructive"
                disabled={voidReturn.isPending}
                onClick={() => {
                  if (confirm('Void this sale return? Restocked inventory will be reversed.')) voidReturn.mutate();
                }}
              >
                <Ban className="h-3.5 w-3.5" /> Void Return
              </Button>
            </CardContent>
          </Card>
        )}

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
