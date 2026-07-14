import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageCheck, XCircle } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { PurchaseDetail } from '@/modules/purchases';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.purchases.detail(id),
    queryFn: () => purchasesService.getDetail(id),
  });

  const receive = useMutation({
    mutationFn: () => purchasesService.receive(id),
    onSuccess: () => {
      toast.success('Purchase received — inventory updated');
      qc.invalidateQueries({ queryKey: queryKeys.purchases.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
    onError: (err) => toast.error(err?.message || 'Failed to receive purchase'),
  });

  const cancel = useMutation({
    mutationFn: () => purchasesService.cancel(id),
    onSuccess: () => {
      toast.success('Purchase cancelled');
      qc.invalidateQueries({ queryKey: queryKeys.purchases.all });
    },
    onError: () => toast.error('Failed to cancel purchase'),
  });

  const isPending = data?.status === 'PENDING';
  const lineItems = data?.lineItems || [];

  return (
    <DetailPageShell
      back={{ label: 'Purchases', href: '/admin/purchases' }}
      title={data?.purchaseNo || 'Purchase Details'}
      subtitle={data ? `${data.partyName} · Bill ${data.billNo}` : 'Purchase information'}
      actions={data && isPending ? (
        <>
          <Button size="sm" onClick={() => receive.mutate()} disabled={receive.isPending}>
            <PackageCheck className="h-4 w-4" /> {receive.isPending ? 'Receiving…' : 'Receive to Inventory'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
            <XCircle className="h-4 w-4" /> Cancel
          </Button>
        </>
      ) : null}
    >
      <PurchaseDetail id={id} />

      {lineItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-[var(--color-text-secondary)]">
                  <th className="pb-2 pr-4">SKU</th>
                  <th className="pb-2 pr-4">Item</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Rate</th>
                  <th className="pb-2 pr-4 text-right">GST</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.sku} className="border-b border-surface-3">
                    <td className="py-2 pr-4">{item.sku}</td>
                    <td className="py-2 pr-4">{item.name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{item.gstRate}%</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data?.status === 'RECEIVED' && (
        <p className="mt-4 text-sm text-[var(--color-success)]">
          Stock has been added to warehouse inventory. Check Inventory to view updated quantities.
        </p>
      )}
    </DetailPageShell>
  );
}
