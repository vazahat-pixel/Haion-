import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackageCheck, Ban } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { purchaseReturnsService } from '@/services/purchaseReturns.service';
import { warehousesService } from '@/services/warehouses.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminPurchaseReturnDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.purchaseReturns.detail(id),
    queryFn: () => purchaseReturnsService.getDetail(id),
  });

  const { data: warehousesRes } = useQuery({
    queryKey: queryKeys.warehouses.list({ perPage: 100 }),
    queryFn: () => warehousesService.getList({ perPage: 100 }),
    enabled: data?.status === 'SHIPPED',
  });
  const warehouses = warehousesRes?.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.purchaseReturns.all });

  const receive = useMutation({
    mutationFn: () => purchaseReturnsService.receive(id, { warehouseId }),
    onSuccess: () => { toast.success('Purchase return received — stock updated'); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to receive return'),
  });

  const reject = useMutation({
    mutationFn: () => purchaseReturnsService.reject(id, { reason: rejectReason }),
    onSuccess: () => { toast.success('Purchase return rejected'); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to reject return'),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const canReject = ['REQUESTED', 'SHIPPED'].includes(data.status);
  const canReceive = data.status === 'SHIPPED';
  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell
      back={{ label: 'Dealer Purchase Returns', href: '/admin/dealer-purchase-returns' }}
      title={data.returnNo}
      subtitle={data.dealerName}
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

        {canReceive && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Receive Into Warehouse</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="max-w-xs">
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </Select>
              <div>
                <Button size="sm" disabled={!warehouseId || receive.isPending} onClick={() => receive.mutate()}>
                  <PackageCheck className="h-3.5 w-3.5" /> Receive Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {canReject && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Reject This Return</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              <Button size="sm" variant="destructive" disabled={reject.isPending} onClick={() => reject.mutate()}>
                <Ban className="h-3.5 w-3.5" /> Reject Return
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
