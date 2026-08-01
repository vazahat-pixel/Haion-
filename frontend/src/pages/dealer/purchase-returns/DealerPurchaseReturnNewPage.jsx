import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Send } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dealerInventoryService } from '@/services/dealer-inventory.service';
import { purchaseReturnsService } from '@/services/purchaseReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

export default function DealerPurchaseReturnNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [lineItems, setLineItems] = useState([]);

  const { data: inventoryRes } = useQuery({
    queryKey: ['dealer-inventory', 'purchase-return-picker'],
    queryFn: () => dealerInventoryService.getList({ perPage: 200 }),
  });
  const inventory = inventoryRes?.data || [];

  const filteredInventory = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    const available = inventory.filter((i) => i.quantity > 0);
    if (!q) return available;
    return available.filter((i) => i.sku?.toLowerCase().includes(q) || i.name?.toLowerCase().includes(q));
  }, [inventory, itemSearch]);

  const addItem = (item) => {
    if (lineItems.some((i) => i.sku === item.sku)) {
      toast.error('Item already added');
      return;
    }
    setLineItems((items) => [...items, { sku: item.sku, product: item.name, quantity: 1, maxQuantity: item.quantity, unitPrice: 0 }]);
  };

  const updateLine = (idx, key, value) => {
    setLineItems((items) => items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };
  const removeLine = (idx) => setLineItems((items) => items.filter((_, i) => i !== idx));

  const create = useMutation({
    mutationFn: () => purchaseReturnsService.create({
      reason,
      lineItems: lineItems.map((i) => ({ sku: i.sku, product: i.product, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    }),
    onSuccess: (data) => {
      toast.success('Purchase return requested');
      qc.invalidateQueries({ queryKey: queryKeys.purchaseReturns.all });
      navigate(`/dealer/purchase-returns/${data.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to request purchase return'),
  });

  const isValid = reason && lineItems.length > 0 && lineItems.every((i) => Number(i.quantity) > 0 && Number(i.quantity) <= i.maxQuantity);

  return (
    <PageShell
      title="New Purchase Return"
      subtitle="Request to send stock back to admin"
      back={{ label: 'Purchase Returns', href: '/dealer/purchase-returns' }}
    >
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why are you returning this stock?" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pick Items From Your Inventory</CardTitle>
            <div className="relative mt-2 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <Input className="pl-9 text-sm" placeholder="Search by name, SKU…" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-2 border rounded-lg bg-surface-2/40">
              {filteredInventory.length === 0 ? (
                <p className="col-span-full py-4 text-center text-xs text-[var(--color-text-secondary)]">No in-stock items found</p>
              ) : (
                filteredInventory.map((item) => {
                  const isAdded = lineItems.some((i) => i.sku === item.sku);
                  return (
                    <div
                      key={item.id || item.sku}
                      onClick={() => !isAdded && addItem(item)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-md border text-left transition-all cursor-pointer',
                        isAdded ? 'bg-surface-3/50 border-surface-3 opacity-60 cursor-not-allowed' : 'bg-surface-1 border-surface-3 hover:border-brand-500'
                      )}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-xs truncate">{item.name}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] font-mono">{item.sku} · Qty: {item.quantity}</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium shrink-0">{isAdded ? '✓ Added' : '+ Add'}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 text-right">Return Qty</th>
                    <th className="px-3 py-2 text-right">Available</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--color-text-secondary)]">Select items above to add them here</td></tr>
                  ) : lineItems.map((item, idx) => (
                    <tr key={item.sku} className="border-b border-surface-3">
                      <td className="px-3 py-2 font-mono text-xs">{item.sku}</td>
                      <td className="px-3 py-2">{item.product}</td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number" min="1" max={item.maxQuantity}
                          className="ml-auto w-20 text-right"
                          value={item.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-[var(--color-text-secondary)]">{item.maxQuantity}</td>
                      <td className="px-3 py-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)}>
                          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/dealer/purchase-returns')}>Cancel</Button>
          <Button disabled={!isValid || create.isPending} onClick={() => create.mutate()}>
            <Send className="h-4 w-4" /> Submit Return Request
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
