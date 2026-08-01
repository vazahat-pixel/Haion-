import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Send } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { saleReturnsService } from '@/services/saleReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

const emptyLine = () => ({ sku: '', product: '', quantity: 1, unitPrice: 0 });

export default function DealerSaleReturnNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [billNo, setBillNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [reason, setReason] = useState('');
  const [restock, setRestock] = useState(true);
  const [lineItems, setLineItems] = useState([emptyLine()]);

  const updateLine = (idx, key, value) => {
    setLineItems((items) => items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };
  const addLine = () => setLineItems((items) => [...items, emptyLine()]);
  const removeLine = (idx) => setLineItems((items) => items.filter((_, i) => i !== idx));

  const total = lineItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);

  const create = useMutation({
    mutationFn: () => saleReturnsService.create({
      billNo,
      customerName,
      customerPhone,
      reason,
      restock,
      lineItems: lineItems.map((i) => ({
        sku: i.sku,
        product: i.product,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    }),
    onSuccess: (data) => {
      toast.success('Sale return recorded');
      qc.invalidateQueries({ queryKey: queryKeys.saleReturns.all });
      navigate(`/dealer/sale-returns/${data.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to record sale return'),
  });

  const isValid = customerName && reason && lineItems.every((i) => i.sku && i.product && Number(i.quantity) > 0);

  return (
    <PageShell
      title="New Sale Return"
      subtitle="Record a product a customer has returned to your shop"
      back={{ label: 'Sale Returns', href: '/dealer/sale-returns' }}
    >
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div>
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer full name" />
            </div>
            <div>
              <Label>Customer Phone</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>Original Bill No</Label>
              <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Optional reference" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={restock} onCheckedChange={setRestock} />
              <span className="text-sm">Restock item to my inventory</span>
            </div>
            <div className="sm:col-span-2">
              <Label>Reason *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why is this being returned?" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Items Returned</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </CardHeader>
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
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-surface-3">
                      <td className="px-3 py-2"><Input className="w-28 font-mono uppercase" value={item.sku} onChange={(e) => updateLine(idx, 'sku', e.target.value)} placeholder="SKU" /></td>
                      <td className="px-3 py-2"><Input value={item.product} onChange={(e) => updateLine(idx, 'product', e.target.value)} placeholder="Product name" /></td>
                      <td className="px-3 py-2 text-right"><Input type="number" min="1" className="ml-auto w-16 text-right" value={item.quantity} onChange={(e) => updateLine(idx, 'quantity', e.target.value)} /></td>
                      <td className="px-3 py-2 text-right"><Input type="number" min="0" className="ml-auto w-24 text-right" value={item.unitPrice} onChange={(e) => updateLine(idx, 'unitPrice', e.target.value)} /></td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</td>
                      <td className="px-3 py-2">
                        <Button type="button" variant="ghost" size="sm" disabled={lineItems.length === 1} onClick={() => removeLine(idx)}>
                          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end text-sm">
              <span className="text-[var(--color-text-secondary)] mr-2">Total Refund:</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/dealer/sale-returns')}>Cancel</Button>
          <Button disabled={!isValid || create.isPending} onClick={() => create.mutate()}>
            <Send className="h-4 w-4" /> Record Sale Return
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
