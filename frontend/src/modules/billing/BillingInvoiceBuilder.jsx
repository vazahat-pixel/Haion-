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
import { Textarea } from '@/components/ui/textarea';
import { Stepper } from '@/components/data-display/Stepper';
import { NumberTagInput } from '@/components/shared/NumberTagInput';
import { billingService } from '@/services/billing.service';
import { customersService } from '@/services/customers.service';
import { dealerTeamService } from '@/services/dealer-team.service';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import client from '@/services/api/client';
import { calculateGST } from '@/utils/gst';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { gstinOptionalValidator } from '@/validators/common.validators';

const STEPS = ['Customer', 'Line Items', 'Review & GST'];

const schema = z.object({
  customerId: z.string().optional(),
  customer: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().min(3, 'Address is required'),
  customerState: z.string().min(2, 'State is required'),
  customerGstin: gstinOptionalValidator,
  teamMemberId: z.string().optional(),
  isInterstate: z.boolean().optional(),
  appliedReferralCode: z.string().optional(),
  lineItems: z.array(z.object({
    sku: z.string().optional(),
    product: z.string().optional(),
    hsn: z.string().optional(),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0),
    basePrice: z.coerce.number().optional(),
    gstRate: z.coerce.number().min(0).max(28),
    warrantyMonths: z.coerce.number().optional(),
    serialNos: z.array(z.string()).optional(),
    appliedRules: z.array(z.object({
      name: z.string(),
      adjustment: z.number(),
      source: z.string(),
    })).optional(),
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
  const { user } = useAuth();
  const isDealerAdmin = user?.role === ROLES.DEALER_ADMIN;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: customersRes } = useQuery({
    queryKey: ['customers', 'billing'],
    queryFn: () => customersService.getList({ status: 'ACTIVE', perPage: 100 }),
  });
  const customers = customersRes?.data ?? [];

  const { data: teamRes } = useQuery({
    queryKey: ['dealer', 'team', 'billing'],
    queryFn: () => dealerTeamService.getList({ status: 'ACTIVE', perPage: 100 }),
    enabled: isDealerAdmin,
  });
  const teamMembers = teamRes?.data ?? [];

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
      customerPhone: '',
      customerAddress: '',
      customerState: '',
      customerGstin: '',
      teamMemberId: '',
      isInterstate: false,
      appliedReferralCode: '',
      lineItems: [{
        sku: defaultProduct?.sku || '',
        product: defaultProduct?.name || '',
        hsn: defaultProduct?.hsn || '',
        quantity: 1,
        unitPrice: defaultProduct?.unitPrice || 0,
        basePrice: defaultProduct?.basePrice || defaultProduct?.unitPrice || 0,
        gstRate: defaultProduct?.gstRate || 18,
        appliedRules: defaultProduct?.appliedRules || [],
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const watchItems = form.watch('lineItems');
  const totals = calcTotals(watchItems || [], form.watch('isInterstate'));

  const onCustomerSelect = (id) => {
    const c = customers.find((x) => x.id === id);
    if (c) {
      form.setValue('customerId', id, { shouldValidate: true });
      form.setValue('customer', c.name, { shouldValidate: true });
      form.setValue('customerGstin', c.gstin || '', { shouldValidate: true });
      form.setValue('customerPhone', c.phone || '', { shouldValidate: true });
      form.setValue('customerState', c.state || c.city || '', { shouldValidate: true });
      form.setValue('customerAddress', c.address || [c.city, c.state].filter(Boolean).join(', '), { shouldValidate: true });
    }
  };

  const validateStock = (lineItems) => {
    for (const item of lineItems) {
      const p = catalog.find((x) => x.sku === item.sku);
      if (p && item.quantity > p.availableQty) {
        toast.error(`Only ${p.availableQty} units of ${item.product} available`);
        return false;
      }
    }
    return true;
  };

  const onProductSelect = (index, sku) => {
    const p = catalog.find((x) => x.sku === sku);
    if (p) {
      form.setValue(`lineItems.${index}.sku`, p.sku);
      form.setValue(`lineItems.${index}.product`, p.name);
      form.setValue(`lineItems.${index}.hsn`, p.hsn);
      form.setValue(`lineItems.${index}.unitPrice`, p.unitPrice);
      form.setValue(`lineItems.${index}.basePrice`, p.basePrice ?? p.unitPrice);
      form.setValue(`lineItems.${index}.gstRate`, p.gstRate);
      form.setValue(`lineItems.${index}.warrantyMonths`, p.warrantyMonths || 12);
      form.setValue(`lineItems.${index}.serialNos`, Array.from({ length: form.getValues().lineItems[index]?.quantity || 1 }).map(() => ''));
      form.setValue(`lineItems.${index}.appliedRules`, p.appliedRules || []);
    }
  };

  const handleNextToLineItems = async () => {
    const valid = await form.trigger(['customer', 'customerAddress', 'customerState', 'customerGstin']);
    if (valid) {
      setStep(1);
    }
  };

  const handleNextToReview = async () => {
    const items = form.getValues('lineItems');
    if (!items || items.length === 0) {
      toast.error('Add at least one line item');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].sku) {
        toast.error(`Please select a product for row #${i + 1}`);
        return;
      }
    }
    setStep(2);
  };

  const save = async (status) => {
    const data = form.getValues();
    if (status === 'SENT' && !validateStock(data.lineItems)) return;

    setSaving(true);
    try {
      const lineItems = data.lineItems.map((item) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
      }));
      const t = calcTotals(data.lineItems, data.isInterstate);
      const bill = await billingService.create({
        customerId: data.customerId,
        customer: data.customer,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        customerState: data.customerState,
        customerGstin: data.customerGstin,
        teamMemberId: data.teamMemberId || undefined,
        isInterstate: data.isInterstate,
        amount: t.subtotal,
        tax: t.tax,
        total: t.total,
        cgst: t.cgst,
        sgst: t.sgst,
        igst: t.igst,
        lineItems,
        status,
        appliedReferralCode: data.appliedReferralCode ? data.appliedReferralCode.toUpperCase().trim() : undefined,
      });
      toast.success(status === 'DRAFT' ? 'Bill saved as draft' : 'Bill created — warranty certificates generated');
      navigate(`/dealer/billing/${bill.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create bill');
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
                <Label>Customer Name *</Label>
                <Input {...form.register('customer')} placeholder="e.g. Rahul Verma" />
                {form.formState.errors.customer && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.customer.message}</p>
                )}
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...form.register('customerPhone')} placeholder="e.g. 9876543210" />
                {form.formState.errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.customerPhone.message}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label>Address *</Label>
                <Textarea rows={2} {...form.register('customerAddress')} placeholder="Enter customer address" />
                {form.formState.errors.customerAddress && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.customerAddress.message}</p>
                )}
              </div>
              <div>
                <Label>State *</Label>
                <Input {...form.register('customerState')} placeholder="e.g. Uttar Pradesh" />
                {form.formState.errors.customerState && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.customerState.message}</p>
                )}
              </div>
              <div>
                <Label>GSTIN</Label>
                <Input
                  {...form.register('customerGstin')}
                  placeholder="Optional"
                  className="uppercase font-mono tracking-wider"
                  maxLength={15}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                    form.setValue('customerGstin', e.target.value, { shouldValidate: true });
                  }}
                />
                {form.formState.errors.customerGstin && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.customerGstin.message}</p>
                )}
              </div>
            </div>
            {isDealerAdmin && (
              <div>
                <Label>Sales Team Member</Label>
                <Select {...form.register('teamMemberId')}>
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
                  ))}
                </Select>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isInterstate')} className="rounded" />
              Interstate supply (IGST applies)
            </label>
            <div>
              <Label>Referral Code (Optional)</Label>
              <Input
                {...form.register('appliedReferralCode')}
                placeholder="e.g. EV20-K89M2P"
                className="uppercase font-mono tracking-wider"
                onChange={(e) => {
                  form.setValue('appliedReferralCode', e.target.value.toUpperCase().trim());
                }}
              />
              <p className="mt-1 text-xs text-surface-500">If customer was referred by someone, enter their referral code here</p>
            </div>
            <Button type="button" onClick={handleNextToLineItems}>Next: Line Items</Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '', product: '', hsn: '', quantity: 1, unitPrice: 0, basePrice: 0, gstRate: 18, warrantyMonths: 12, serialNos: [], controllerNos: [], batteryNos: [], appliedRules: [] })}>
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
                  {watchItems[i]?.sku && (() => {
                    const avail = catalog.find((p) => p.sku === watchItems[i].sku)?.availableQty;
                    if (avail != null && watchItems[i].quantity > avail) {
                      return <p className="mt-1 text-xs text-red-600">Only {avail} in stock</p>;
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input type="number" {...form.register(`lineItems.${i}.unitPrice`)} />
                  {(watchItems[i]?.appliedRules?.length > 0 || watchItems[i]?.basePrice > watchItems[i]?.unitPrice) && (
                    <div className="mt-1.5 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
                      <p>Base: {formatCurrency(watchItems[i]?.basePrice || watchItems[i]?.unitPrice)}</p>
                      {(watchItems[i]?.appliedRules || []).map((rule, ri) => (
                        <p key={ri}>
                          {rule.name} ({rule.source}): {rule.adjustment >= 0 ? '+' : ''}{formatCurrency(rule.adjustment)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>GST %</Label>
                  <Input type="number" {...form.register(`lineItems.${i}.gstRate`)} />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="text-right w-full">
                    <span className="block text-sm font-medium tabular-nums">{formatCurrency((watchItems[i]?.quantity || 0) * (watchItems[i]?.unitPrice || 0))}</span>
                    {watchItems[i]?.warrantyMonths && (
                      <span className="block mt-1 text-[10px] text-[var(--color-text-secondary)] font-semibold">
                        🛡️ Warranty: {watchItems[i].warrantyMonths} Months
                      </span>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>

                {watchItems[i]?.sku && (
                  <div className="sm:col-span-6 border-t border-dashed border-blue-200 pt-3 mt-1">
                    <p className="mb-2 text-xs font-semibold text-blue-700">
                      📋 Unit Identification Numbers
                      <span className="ml-2 text-[10px] font-normal text-gray-500">
                        (Enter {Number(watchItems[i].quantity) || 1} number(s) each — use OCR to scan)
                      </span>
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="mb-1 text-xs text-blue-700">🔢 Serial Nos *</Label>
                        <NumberTagInput
                          value={watchItems[i]?.serialNos || []}
                          onChange={(v) => form.setValue(`lineItems.${i}.serialNos`, v)}
                          placeholder="e.g. SN001…"
                          expectedCount={Number(watchItems[i].quantity) || 1}
                          label="serial number"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-purple-700">⚙️ Controller Nos</Label>
                        <NumberTagInput
                          value={watchItems[i]?.controllerNos || []}
                          onChange={(v) => form.setValue(`lineItems.${i}.controllerNos`, v)}
                          placeholder="e.g. CTRL001…"
                          expectedCount={Number(watchItems[i].quantity) || 1}
                          label="controller number"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 text-xs text-green-700">🔋 Battery Nos</Label>
                        <NumberTagInput
                          value={watchItems[i]?.batteryNos || []}
                          onChange={(v) => form.setValue(`lineItems.${i}.batteryNos`, v)}
                          placeholder="e.g. BAT001…"
                          expectedCount={Number(watchItems[i].quantity) || 1}
                          label="battery number"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-amber-600">
                      💡 Tip: Click "OCR Scan" to auto-fill by taking a clear, close-up photo of the number sticker in good lighting.
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setStep(0)}>Back</Button>
              <Button type="button" onClick={handleNextToReview}>Next: Review</Button>
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
                    <th className="px-4 py-2">Pricing</th>
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
                      <td className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                        {item.basePrice && item.basePrice !== item.unitPrice && (
                          <span className="block">Base {formatCurrency(item.basePrice)}</span>
                        )}
                        {(item.appliedRules || []).filter((r) => r.adjustment !== 0).map((r, ri) => (
                          <span key={ri} className="block">{r.name}: {r.adjustment >= 0 ? '+' : ''}{formatCurrency(r.adjustment)}</span>
                        ))}
                        {(!item.appliedRules || item.appliedRules.every((r) => r.adjustment === 0)) && item.basePrice === item.unitPrice && 'Standard'}
                      </td>
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
