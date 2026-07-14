import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, Barcode, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet } from '@/components/ui/sheet';
import { partiesService } from '@/services/parties.service';
import { productsService } from '@/services/products.service';
import { warehousesService } from '@/services/warehouses.service';
import { purchasesService } from '@/services/purchases.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { gstinOptionalValidator } from '@/validators/common.validators';

const DEFAULT_TERMS = `1. Goods once sold will not be taken back or exchanged
2. All disputes are subject to jurisdiction only`;

const schema = z.object({
  partyId: z.string().min(1, 'Select bill from party'),
  billNo: z.string().min(1, 'Purchase invoice number required'),
  purchaseInvDate: z.string().min(1),
  originalInvNo: z.string().optional(),
  paymentTermsDays: z.coerce.number().min(0),
  dueDate: z.string().optional(),
  warehouseId: z.string().min(1, 'Select warehouse'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  orderDiscount: z.coerce.number().min(0).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  lineItems: z.array(z.object({
    productId: z.string().optional(),
    sku: z.string().min(1),
    name: z.string().min(1),
    hsn: z.string().optional(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).optional(),
    gstRate: z.coerce.number().min(0).max(28),
  })).min(1, 'Add at least one line item'),
  additionalCharges: z.array(z.object({
    label: z.string().min(1),
    amount: z.coerce.number().min(0),
  })).optional(),
});

const quickPartySchema = z.object({
  name: z.string().min(2, 'Party name is required'),
  type: z.enum(['SUPPLIER', 'DEALER', 'CUSTOMER', 'EMPLOYEE', 'OTHER']).default('SUPPLIER'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstin: gstinOptionalValidator,
  billingAddress: z.string().optional(),
});

function calcLine(item) {
  const gross = (item.quantity || 0) * (item.unitPrice || 0);
  const discount = Math.min(item.discount || 0, gross);
  const amount = gross - discount;
  const tax = (amount * (item.gstRate || 0)) / 100;
  return { amount, tax, total: amount + tax };
}

function calcTotals(lineItems, orderDiscount, additionalCharges, amountPaid) {
  let subtotal = 0;
  let tax = 0;
  (lineItems || []).forEach((item) => {
    const line = calcLine(item);
    subtotal += line.amount;
    tax += line.tax;
  });
  const charges = (additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const discount = Math.min(orderDiscount || 0, subtotal);
  const taxableAmount = subtotal - discount + charges;
  const total = taxableAmount + tax;
  const paid = amountPaid || 0;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    balance: Math.round((total - paid) * 100) / 100,
  };
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

/* ──────────────────────────────────────────────────────
   Quick Add Party Drawer — opens inline, no page reload
   ────────────────────────────────────────────────────── */
function AddPartyDrawer({ open, onOpenChange, onCreated }) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(quickPartySchema),
    defaultValues: { name: '', type: 'SUPPLIER', phone: '', email: '', gstin: '', billingAddress: '' },
  });

  const submit = async (data) => {
    try {
      const created = await partiesService.create(data);
      toast.success(`Party "${created.name || data.name}" added`);
      reset();
      onOpenChange(false);
      onCreated?.(created);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create party');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add New Party" description="Quickly add a supplier to continue with your purchase">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <Label>Party Name *</Label>
          <Input {...register('name')} placeholder="Enter party name" autoFocus />
          {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
        </div>
        <div>
          <Label>Type</Label>
          <Select {...register('type')}>
            <option value="SUPPLIER">Supplier</option>
            <option value="DEALER">Dealer</option>
            <option value="CUSTOMER">Customer</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label>Mobile Number</Label>
          <Input {...register('phone')} placeholder="Enter mobile number" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" {...register('email')} placeholder="Enter email" />
        </div>
        <div>
          <Label>GSTIN</Label>
          <Input
            {...register('gstin')}
            placeholder="ex: 29AABCU9603R1ZM"
            className="uppercase font-mono tracking-wider"
            maxLength={15}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
              setValue('gstin', e.target.value, { shouldValidate: true });
            }}
          />
          {errors.gstin && <p className="text-xs text-[var(--color-danger)]">{errors.gstin.message}</p>}
        </div>
        <div>
          <Label>Billing Address</Label>
          <Textarea {...register('billingAddress')} placeholder="Enter address" rows={2} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving…' : 'Save Party'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  );
}

export function PurchaseForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [showCharges, setShowCharges] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [partyDrawerOpen, setPartyDrawerOpen] = useState(false);
  const partyListFilters = { status: 'ACTIVE', search: supplierSearch, perPage: 100 };

  const { data: suppliersRes, isLoading: partiesLoading, refetch: refetchParties } = useQuery({
    queryKey: queryKeys.parties.list(partyListFilters),
    queryFn: () => partiesService.getList(partyListFilters),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: productsRes } = useQuery({
    queryKey: queryKeys.products.list({ status: 'ACTIVE', perPage: 200 }),
    queryFn: () => productsService.getList({ status: 'ACTIVE', perPage: 200 }),
  });

  const { data: warehousesRes } = useQuery({
    queryKey: queryKeys.warehouses.list({ perPage: 50 }),
    queryFn: () => warehousesService.getList({ perPage: 50 }),
  });

  const suppliers = suppliersRes?.data || [];
  const products = productsRes?.data || [];
  const warehouses = warehousesRes?.data || [];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      partyId: '',
      billNo: '1',
      purchaseInvDate: today,
      originalInvNo: '',
      paymentTermsDays: 30,
      dueDate: addDays(today, 30),
      warehouseId: '',
      notes: '',
      termsAndConditions: DEFAULT_TERMS,
      orderDiscount: 0,
      amountPaid: 0,
      lineItems: [],
      additionalCharges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const { fields: chargeFields, append: appendCharge, remove: removeCharge } = useFieldArray({
    control: form.control,
    name: 'additionalCharges',
  });

  const watchItems = form.watch('lineItems');
  const watchCharges = form.watch('additionalCharges');
  const watchDiscount = form.watch('orderDiscount');
  const watchPaid = form.watch('amountPaid');
  const watchInvDate = form.watch('purchaseInvDate');
  const watchTerms = form.watch('paymentTermsDays');
  const totals = calcTotals(watchItems, watchDiscount, watchCharges, watchPaid);

  useEffect(() => {
    if (watchInvDate) {
      form.setValue('dueDate', addDays(watchInvDate, watchTerms));
    }
  }, [watchInvDate, watchTerms, form]);

  const filteredProducts = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.sku?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
  }, [products, itemSearch]);

  const addProduct = (product) => {
    if (watchItems?.some((i) => i.sku === product.sku)) {
      toast.error('Item already added');
      return;
    }
    append({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      hsn: product.hsn || product.hsnCode || '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      gstRate: product.gstRate ?? 18,
    });
  };

  const scanBarcode = () => {
    const code = barcode.trim().toUpperCase();
    if (!code) return;
    const product = products.find((p) => p.sku?.toUpperCase() === code);
    if (!product) {
      toast.error('No item found for this barcode/SKU');
      return;
    }
    addProduct(product);
    setBarcode('');
  };

  const handlePartyCreated = (newParty) => {
    // Refresh parties list and auto-select the new party
    qc.invalidateQueries({ queryKey: queryKeys.parties.all });
    refetchParties().then(() => {
      if (newParty?.id) {
        form.setValue('partyId', newParty.id);
      }
    });
  };

  const submit = async (data) => {
    setSaving(true);
    try {
      const purchase = await purchasesService.create(data);
      toast.success('Purchase saved');
      navigate(`/admin/purchases/${purchase.id}`);
    } catch {
      toast.error('Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-6xl space-y-6 pb-10">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-[240px] flex-1">
                  <Label>Bill From</Label>
                  <div className="relative mt-1 mb-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                    <Input className="pl-9" placeholder="Search party by name, mobile, GSTIN…" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} />
                  </div>
                  <Select {...form.register('partyId')} disabled={partiesLoading}>
                    <option value="">{partiesLoading ? 'Loading parties…' : 'Select party…'}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type}){s.phone ? ` · ${s.phone}` : ''}
                      </option>
                    ))}
                  </Select>
                  {!partiesLoading && suppliers.length === 0 && (
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      No active parties found — add one using &quot;Add Party&quot; below.
                    </p>
                  )}
                  {form.formState.errors.partyId && <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.partyId.message}</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchParties()}>
                    Refresh
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPartyDrawerOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Party
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Purchase Inv No</Label>
              <Input {...form.register('billNo')} />
            </div>
            <div>
              <Label>Purchase Inv Date</Label>
              <Input type="date" {...form.register('purchaseInvDate')} />
            </div>
            <div>
              <Label>Original Inv No.</Label>
              <Input {...form.register('originalInvNo')} placeholder="Optional" />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" {...form.register('paymentTermsDays')} />
                <span className="text-sm text-[var(--color-text-secondary)]">days</span>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" {...form.register('dueDate')} />
            </div>
            <div>
              <Label>Warehouse (for inventory)</Label>
              <Select {...form.register('warehouseId')}>
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </Select>
              {form.formState.errors.warehouseId && <p className="text-xs text-[var(--color-danger)]">{form.formState.errors.warehouseId.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Items / Services</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input className="w-48 pl-9" placeholder="Search items…" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Input className="w-36" placeholder="Scan barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), scanBarcode())} />
                <Button type="button" variant="outline" size="sm" onClick={scanBarcode}><Barcode className="h-4 w-4" /> Scan</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {filteredProducts.slice(0, 10).map((p) => (
                <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addProduct(p)}>
                  <Plus className="h-3 w-3" /> {p.sku}
                </Button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">HSN/SAC</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price/Item (₹)</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Tax</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--color-text-secondary)]">+ Add Item from catalog above</td></tr>
                  ) : fields.map((field, i) => {
                    const item = watchItems[i];
                    const line = calcLine(item || {});
                    return (
                      <tr key={field.id} className="border-b border-surface-3">
                        <td className="px-3 py-2">
                          <p className="font-medium">{item?.name}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">{item?.sku}</p>
                        </td>
                        <td className="px-3 py-2">{item?.hsn || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" min="1" className="ml-auto w-16 text-right" {...form.register(`lineItems.${i}.quantity`)} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" min="0" step="0.01" className="ml-auto w-24 text-right" {...form.register(`lineItems.${i}.unitPrice`)} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Input type="number" min="0" step="0.01" className="ml-auto w-20 text-right" {...form.register(`lineItems.${i}.discount`)} />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          {item?.gstRate}%<br />{formatCurrency(line.tax)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(line.total)}</td>
                        <td className="px-3 py-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!showNotes ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNotes(true)}>+ Add Notes</Button>
            ) : (
              <Card>
                <CardHeader className="flex flex-row justify-between"><CardTitle className="text-sm">Notes</CardTitle><button type="button" onClick={() => setShowNotes(false)}><X className="h-4 w-4" /></button></CardHeader>
                <CardContent><Textarea {...form.register('notes')} rows={3} /></CardContent>
              </Card>
            )}

            {showTerms && (
              <Card>
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle className="text-sm">Terms and Conditions</CardTitle>
                  <button type="button" onClick={() => setShowTerms(false)}><X className="h-4 w-4" /></button>
                </CardHeader>
                <CardContent><Textarea {...form.register('termsAndConditions')} rows={4} /></CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">SUB Total</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>

              {!showCharges ? (
                <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-brand-600" onClick={() => { setShowCharges(true); appendCharge({ label: 'Freight', amount: 0 }); }}>+ Add Additional Charges</Button>
              ) : (
                <div className="space-y-2 rounded border border-surface-3 p-3">
                  {chargeFields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input placeholder="Label" {...form.register(`additionalCharges.${i}.label`)} />
                      <Input type="number" className="w-24" {...form.register(`additionalCharges.${i}.amount`)} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCharge({ label: '', amount: 0 })}>+ Charge</Button>
                </div>
              )}

              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Taxable Amount</span><span className="tabular-nums">{formatCurrency(totals.taxableAmount)}</span></div>

              {!showDiscount ? (
                <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-brand-600" onClick={() => setShowDiscount(true)}>+ Add Discount</Button>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--color-text-secondary)]">Discount</span>
                  <Input type="number" min="0" className="w-28 text-right" {...form.register('orderDiscount')} />
                </div>
              )}

              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Tax</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between border-t border-surface-3 pt-2 text-base font-semibold">
                <span>Total Amount</span><span className="tabular-nums">{formatCurrency(totals.total)}</span>
              </div>
              <div>
                <Label>Amount Paid</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">₹</span>
                  <Input type="number" min="0" step="0.01" className="pl-8" {...form.register('amountPaid')} />
                </div>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[var(--color-text-secondary)]">Balance Amount</span>
                <span className="tabular-nums">{formatCurrency(totals.balance)}</span>
              </div>
              <div className="border-t border-surface-3 pt-3">
                <p className="text-xs text-[var(--color-text-tertiary)]">Authorized signatory</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" disabled>+ Add Signature</Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/admin/purchases')}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Add Party Drawer — slides in smoothly, no page reload */}
      <AddPartyDrawer
        open={partyDrawerOpen}
        onOpenChange={setPartyDrawerOpen}
        onCreated={handlePartyCreated}
      />
    </>
  );
}
