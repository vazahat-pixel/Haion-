import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { billingService } from '@/services/billing.service';
import { customersService } from '@/services/customers.service';
import client from '@/services/api/client';
import { calculateGST } from '@/utils/gst';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

async function fetchBillingCatalog() {
  const res = await client.get('/dealer/billing-catalog');
  return res.normalized?.data ?? [];
}

export function DealerMobileQuickSale() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('Rajasthan');
  const [selectedSku, setSelectedSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['dealer', 'billing-catalog'],
    queryFn: fetchBillingCatalog,
  });

  const { data: customersRes } = useQuery({
    queryKey: ['dealer', 'customers', 'quick-sale'],
    queryFn: () => customersService.getList({ perPage: 100 }),
  });
  const customers = customersRes?.data ?? [];

  const product = catalog.find((p) => p.sku === selectedSku);
  const available = product?.availableQty ?? 0;
  const lineAmount = product ? quantity * product.unitPrice : 0;
  const gst = product
    ? calculateGST({ amount: lineAmount, rate: product.gstRate || 18, isInterstate: false })
    : { cgst: 0, sgst: 0, igst: 0 };
  const total = lineAmount + gst.cgst + gst.sgst + gst.igst;

  const onCustomerPick = (id) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setCustomerAddress(c.address || [c.city, c.state].filter(Boolean).join(', '));
    setCustomerState(c.state || 'Rajasthan');
  };

  const submit = async () => {
    if (!customerName.trim() || customerPhone.trim().length < 10) {
      return toast.error('Customer name and valid phone required');
    }
    if (!product) return toast.error('Select a product');
    if (quantity > available) return toast.error(`Only ${available} in stock`);

    setSaving(true);
    try {
      const lineItems = [{
        sku: product.sku,
        product: product.name,
        hsn: product.hsn,
        quantity,
        unitPrice: product.unitPrice,
        gstRate: product.gstRate || 18,
        amount: lineAmount,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
      }];

      const matched = customers.find((c) => c.phone === customerPhone.trim());
      const bill = await billingService.create({
        customerId: matched?.id,
        customer: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim() || `${customerState}`,
        customerState,
        lineItems,
        amount: lineAmount,
        tax: gst.cgst + gst.sgst + gst.igst,
        total,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        status: 'SENT',
      });

      toast.success('Sale complete — bill sent & warranty generated');
      navigate(`/dealer/billing/${bill.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Sale failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length > 0 && (
            <div>
              <Label className="text-xs">Quick pick</Label>
              <select
                className="mt-1 w-full rounded-md border border-surface-3 bg-surface-1 px-3 py-2.5 text-sm"
                defaultValue=""
                onChange={(e) => onCustomerPick(e.target.value)}
              >
                <option value="">Select existing customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Name *</Label>
            <Input className="h-11 text-base" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input className="h-11 text-base" type="tel" inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="10-digit mobile" />
          </div>
          <div>
            <Label>Address</Label>
            <Input className="h-11" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="City, area" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-[var(--color-text-secondary)]">Loading stock…</p>}
          {!isLoading && catalog.length === 0 && (
            <p className="text-sm text-amber-700">No stock available. Receive goods via GRN first.</p>
          )}
          <div className="grid gap-2">
            {catalog.map((p) => (
              <button
                key={p.sku}
                type="button"
                onClick={() => { setSelectedSku(p.sku); setQuantity(1); }}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-3 text-left transition-colors',
                  selectedSku === p.sku
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-surface-3 bg-surface-1 active:bg-surface-2'
                )}
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{p.sku} · Stock {p.availableQty}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(p.unitPrice)}</p>
              </button>
            ))}
          </div>

          {product && (
            <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2ch] text-center text-lg font-semibold tabular-nums">{quantity}</span>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity((q) => Math.min(available, q + 1))} disabled={quantity >= available}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {product && (
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50/80 to-surface-1">
          <CardContent className="space-y-2 p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(lineAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
              <span>GST</span>
              <span className="tabular-nums">{formatCurrency(gst.cgst + gst.sgst + gst.igst)}</span>
            </div>
            <div className="flex justify-between border-t border-brand-100 pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums text-brand-700">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="h-12 w-full gap-2 text-base"
        disabled={saving || !product || !customerName.trim()}
        onClick={submit}
      >
        <ShoppingCart className="h-5 w-5" />
        {saving ? 'Processing…' : 'Complete Sale & Send Bill'}
      </Button>
    </div>
  );
}
