import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Stepper } from '@/components/data-display/Stepper';
import { billingService } from '@/services/billing.service';
import { customersService } from '@/services/customers.service';
import client from '@/services/api/client';
import { calculateGST } from '@/utils/gst';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

const STEPS = ['Customer', 'Line Items', 'Review & GST'];

const schema = z.object({
  customerId: z.string().min(1, 'Select a customer'),
  customer: z.string().min(2),
  customerGstin: z.string().optional(),
  isInterstate: z.boolean().optional(),
  lineItems: z.array(z.object({
    sku: z.string(),
    product: z.string(),
    hsn: z.string(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(1),
    gstRate: z.coerce.number().min(0).max(28),
  })).min(1, 'Add at least one line item'),
});

function calcTotals(lineItems, isInterstate) {
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  lineItems.forEach((item) => {
    const amount = item.quantity * item.unitPrice;
    subtotal += amount;
    const gst = calculateGST({ amount, rate: item.gstRate, isInterstate });
    cgst += gst.cgst;
    sgst += gst.sgst;
    igst += gst.igst;
  });
  return { subtotal, cgst, sgst, igst, tax: cgst + sgst + igst, total: subtotal + cgst + sgst + igst };
}

async function fetchBillingCatalog() {
  const res = await client.get('/dealer/billing-catalog');
  return res.normalized?.data ?? [];
}

export function BillingInvoiceBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: customersRes } = useQuery({
    queryKey: ['customers', 'billing'],
    queryFn: () => customersService.getList({ status: 'ACTIVE', perPage: 100 }),
  });
  const customers = customersRes?.data ?? [];

  const { data: catalog = [] } = useQuery({
    queryKey: ['dealer', 'billing-catalog'],
    queryFn: fetchBillingCatalog,
  });

  const defaultProduct = catalog[0];
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      customer: '',
      customerGstin: '',
      isInterstate: false,
      lineItems: [{
        sku: defaultProduct?.sku || '',
        product: defaultProduct?.name || '',
        hsn: defaultProduct?.hsn || '',
        quantity: 1,
        unitPrice: defaultProduct?.unitPrice || 0,
        gstRate: defaultProduct?.gstRate || 18,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const watchItems = form.watch('lineItems');
  const totals = calcTotals(watchItems || [], form.watch('isInterstate'));

  const onCustomerSelect = (id) => {
    const c = customers.find((x) => x.id === id);
    if (c) {
      form.setValue('customerId', id);
      form.setValue('customer', c.name);
      form.setValue('customerGstin', c.gstin || '');
    }
  };

  const onProductSelect = (index, sku) => {
    const p = catalog.find((x) => x.sku === sku);
    if (p) {
      form.setValue(`lineItems.${index}.sku`, p.sku);
      form.setValue(`lineItems.${index}.product`, p.name);
      form.setValue(`lineItems.${index}.hsn`, p.hsn);
      form.setValue(`lineItems.${index}.unitPrice`, p.unitPrice);
      form.setValue(`lineItems.${index}.gstRate`, p.gstRate);
    }
  };

  const save = async (status) => {
    setSaving(true);
    try {
      const data = form.getValues();
      const lineItems = data.lineItems.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      }));
      const t = calcTotals(data.lineItems, data.isInterstate);
      const bill = await billingService.create({
        customerId: data.customerId,
        customer: data.customer,
        customerGstin: data.customerGstin,
        isInterstate: data.isInterstate,
        amount: t.subtotal,
        tax: t.tax,
        total: t.total,
        cgst: t.cgst,
        sgst: t.sgst,
        igst: t.igst,
        lineItems,
        status,
      });
      toast.success(status === 'DRAFT' ? 'Bill saved as draft' : 'Bill created and sent');
      navigate(`/dealer/billing/${bill.id}`);
    } catch {
      toast.error('Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} currentStep={step} />

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Customer</Label>
              <Select value={form.watch('customerId')} onChange={(e) => onCustomerSelect(e.target.value)}>
                <option value="">Choose customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.city}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Customer Name</Label>
                <Input {...form.register('customer')} />
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input {...form.register('customerGstin')} placeholder="Optional" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isInterstate')} className="rounded" />
              Interstate supply (IGST applies)
            </label>
            <Button onClick={form.handleSubmit(() => setStep(1))}>Next: Line Items</Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', product: '', hsn: '', quantity: 1, unitPrice: 0, gstRate: 18 })}>
              <Plus className="h-3.5 w-3.5" /> Add Row
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {catalog.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">No stock available for billing. Receive inventory via dispatch GRN first.</p>
            )}
            {fields.map((field, i) => (
              <div key={field.id} className="grid gap-3 rounded-lg border border-surface-3 p-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Label>Product</Label>
                  <Select value={watchItems[i]?.sku} onChange={(e) => onProductSelect(i, e.target.value)}>
                    <option value="">Select…</option>
                    {catalog.map((p) => (
                      <option key={p.sku} value={p.sku}>{p.name} (qty: {p.availableQty})</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Qty</Label>
                  <Input type="number" {...form.register(`lineItems.${i}.quantity`)} />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input type="number" {...form.register(`lineItems.${i}.unitPrice`)} />
                </div>
                <div>
                  <Label>GST %</Label>
                  <Input type="number" {...form.register(`lineItems.${i}.gstRate`)} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency((watchItems[i]?.quantity || 0) * (watchItems[i]?.unitPrice || 0))}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={form.handleSubmit(() => setStep(2))}>Next: Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review & GST Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">HSN</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {watchItems.map((item, i) => (
                    <tr key={i} className="border-b border-surface-3">
                      <td className="px-4 py-2">{item.product}</td>
                      <td className="px-4 py-2">{item.hsn}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-[var(--color-text-secondary)]">Subtotal</dt><dd className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</dd></div>
              {totals.igst > 0 ? (
                <div className="flex justify-between"><dt>IGST</dt><dd className="tabular-nums">{formatCurrency(totals.igst)}</dd></div>
              ) : (
                <>
                  <div className="flex justify-between"><dt>CGST</dt><dd className="tabular-nums">{formatCurrency(totals.cgst)}</dd></div>
                  <div className="flex justify-between"><dt>SGST</dt><dd className="tabular-nums">{formatCurrency(totals.sgst)}</dd></div>
                </>
              )}
              <div className="flex justify-between border-t border-surface-3 pt-2 text-base font-semibold">
                <dt>Grand Total</dt><dd className="tabular-nums">{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="outline" disabled={saving} onClick={() => save('DRAFT')}>Save Draft</Button>
              <Button disabled={saving} onClick={() => save('SENT')}>{saving ? 'Creating…' : 'Create & Send'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
