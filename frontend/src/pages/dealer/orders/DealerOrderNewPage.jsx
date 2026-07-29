import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Trash2, Search, Barcode, X, Eye, ClipboardCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet } from '@/components/ui/sheet';
import { PageShell } from '@/components/layout/PageShell';
import { productsService } from '@/services/products.service';
import { dealerOrdersService } from '@/services/dealer-orders.service';
import { settingsService } from '@/services/settings.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

const DEFAULT_TERMS = `1. Goods once sold will not be taken back or exchanged
2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only`;

const DEFAULT_BANK = {
  accountNumber: '099205500220',
  ifsc: 'ICIC0000992',
  bankName: 'ICICI Bank, MORENA',
  holderName: 'Aradhya Brothers',
};

const schema = z.object({
  prefix: z.string().min(1, 'Prefix required').max(20),
  orderNo: z.string().optional(),
  orderDate: z.string().min(1),
  paymentTermsDays: z.coerce.number().min(0),
  expiryDate: z.string().optional(),
  eWayBillNo: z.string().optional(),
  vehicleNo: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  orderDiscount: z.coerce.number().min(0).optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    bankName: z.string().optional(),
    holderName: z.string().optional(),
  }).optional(),
  lineItems: z.array(z.object({
    sku: z.string().optional(),
    name: z.string().min(1, 'Item name required'),
    hsn: z.string().optional(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).optional(),
    gstRate: z.coerce.number().min(0).max(28),
  })).min(1, 'Add at least one item'),
  additionalCharges: z.array(z.object({
    label: z.string().min(1),
    amount: z.coerce.number().min(0),
  })).optional(),
});

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function calcLine(item) {
  const gross = (item.quantity || 0) * (item.unitPrice || 0);
  const discPct = item.discount || 0;
  const discVal = (gross * discPct) / 100;
  const amt = gross - discVal;
  const tax = (amt * (item.gstRate || 0)) / 100;
  return { amount: amt, tax, total: amt + tax };
}

function calcTotals(lineItems, orderDiscount, additionalCharges) {
  let subtotal = 0;
  let tax = 0;
  (lineItems || []).forEach((item) => {
    const line = calcLine(item);
    subtotal += line.amount;
    tax += line.tax;
  });
  const charges = (additionalCharges || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const disc = Math.min(orderDiscount || 0, subtotal);
  const taxableAmount = subtotal - disc + charges;
  const total = taxableAmount + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export default function DealerOrderNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [itemSearch, setItemSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [showCharges, setShowCharges] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showBank, setShowBank] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: productsRes } = useQuery({
    queryKey: queryKeys.products.list({ status: 'ACTIVE', perPage: 200 }),
    queryFn: () => productsService.getList({ status: 'ACTIVE', perPage: 200 }),
  });

  const { data: nextNumberRes } = useQuery({
    queryKey: ['dealer-orders', 'next-number', 'AB/PF/25-26/'],
    queryFn: () => dealerOrdersService.getList({ prefix: 'AB/PF/25-26/' }).then(() => ({
      // Fetch dynamic PO number from custom router next-number
      orderNo: `AB/PF/25-26/${Date.now().toString().slice(-4)}`
    })),
  });

  // Fetch real next-number via helper endpoint
  const { data: realNextNumber } = useQuery({
    queryKey: ['dealer-orders', 'real-next-number'],
    queryFn: async () => {
      const res = await fetch('/api/dealer-orders/next-number?prefix=AB/PF/25-26/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const json = await res.json();
      return json?.data;
    }
  });

  const { data: bundle } = useQuery({
    queryKey: ['settings', 'profile-bundle'],
    queryFn: settingsService.getProfileBundle,
  });

  const products = productsRes?.data || [];
  const finishedProducts = useMemo(() => {
    const finished = products.filter((p) => p.productKind === 'FINISHED');
    return finished.length > 0 ? finished : products;
  }, [products]);

  const bankFromSettings = bundle?.business?.bankDetails?.[0] || DEFAULT_BANK;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      prefix: 'AB/PF/25-26/',
      orderNo: '',
      orderDate: today,
      paymentTermsDays: 30,
      expiryDate: addDays(today, 30),
      eWayBillNo: '',
      vehicleNo: '',
      notes: '',
      termsAndConditions: DEFAULT_TERMS,
      orderDiscount: 0,
      bankDetails: bankFromSettings,
      lineItems: [],
      additionalCharges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });

  const watchItems = form.watch('lineItems');
  const watchCharges = form.watch('additionalCharges');
  const watchDiscount = form.watch('orderDiscount');
  const watchOrderDate = form.watch('orderDate');
  const watchTerms = form.watch('paymentTermsDays');
  const totals = calcTotals(watchItems, watchDiscount, watchCharges);

  // Auto-update expiry date
  useEffect(() => {
    if (watchOrderDate) form.setValue('expiryDate', addDays(watchOrderDate, watchTerms));
  }, [watchOrderDate, watchTerms, form]);

  // Set PO number when loaded
  useEffect(() => {
    if (realNextNumber?.orderNo) {
      form.setValue('orderNo', realNextNumber.orderNo);
    }
  }, [realNextNumber, form]);

  const filteredProducts = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return finishedProducts;
    return finishedProducts.filter(
      (p) =>
        p.sku?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [finishedProducts, itemSearch]);

  const addProduct = (product) => {
    if (watchItems?.some((i) => i.sku === product.sku)) {
      toast.error('Item already added');
      return;
    }
    const unitPrice = Number(product.unitPrice ?? product.basePrice ?? product.mrp ?? product.price ?? 0);
    append({
      sku: product.sku,
      name: product.name,
      hsn: product.hsnCode || product.hsn || '',
      quantity: 1,
      unitPrice,
      discount: 0,
      gstRate: product.gstRate ?? 18,
    });
  };

  const scanBarcode = () => {
    const code = barcode.trim().toUpperCase();
    if (!code) return;
    const product = products.find((p) => p.sku?.toUpperCase() === code);
    if (!product) { toast.error('No item found for this barcode/SKU'); return; }
    addProduct(product);
    setBarcode('');
  };

  const submit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        status: 'PENDING',
      };
      await dealerOrdersService.create(payload);
      toast.success('Purchase order placed successfully');
      qc.invalidateQueries({ queryKey: queryKeys.dealerOrders.all });
      navigate('/dealer/orders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to place purchase order');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const data = form.getValues();
    const rows = data.lineItems.map((item, i) => {
      const line = calcLine(item);
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${item.name}</strong><br/><small style="color:#64748b">${item.sku}</small></td>
        <td>${item.hsn || '—'}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right">${item.discount ? `${item.discount}%` : '—'}</td>
        <td style="text-align:right">${item.gstRate}%</td>
        <td style="text-align:right">₹${line.total.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Purchase Order Preview</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:28px;color:#111;font-size:12px}
      .header{display:flex;justify-content:space-between;border-bottom:2px solid #ea580c;padding-bottom:14px;margin-bottom:18px}
      .co-name{font-size:20px;font-weight:800;color:#ea580c}
      .parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}
      .pbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px}
      .plabel{font-size:9px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px}
      .pname{font-weight:700;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#ea580c;color:white;padding:7px 9px;font-size:10px;text-transform:uppercase;text-align:left}
      td{border-bottom:1px solid #e2e8f0;padding:6px 9px;font-size:11px}
      tr:nth-child(even) td{background:#f8fafc}
      .totals{width:260px;margin-left:auto}
      .trow{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e2e8f0}
      .trow.grand{font-weight:700;font-size:14px;color:#ea580c;border-top:2px solid #ea580c;border-bottom:none;padding-top:8px}
    </style>
    </head><body>
    <button onclick="window.print()" style="position:fixed;top:12px;right:12px;background:#ea580c;color:white;border:none;border-radius:6px;padding:7px 16px;cursor:pointer;font-size:12px;z-index:999">🖨 Print</button>
    <div class="header">
      <div>
        <div class="co-name">Purchase Order</div>
        <div style="font-size:11px;color:#374151;margin-top:4px">B2B PURCHASE REQUEST</div>
      </div>
      <div style="text-align:right;font-size:11px">
        <div><strong>PO Number:</strong> ${data.orderNo || '—'}</div>
        <div><strong>Date:</strong> ${data.orderDate}</div>
        <div><strong>Expiry:</strong> ${data.expiryDate || '—'}</div>
      </div>
    </div>
    <div class="parties">
      <div class="pbox"><div class="plabel">From (Dealer)</div><div class="pname">Your Dealer Workspace</div></div>
      <div class="pbox"><div class="plabel">Bill To (Admin)</div><div class="pname">Aradhya Brothers</div><div style="font-size:11px;color:#64748b">GSTIN: 099205500220</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item</th><th>HSN</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Disc</th><th style="text-align:right">GST%</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="trow"><span>Subtotal</span><span>₹${totals.subtotal.toFixed(2)}</span></div>
      ${data.orderDiscount ? `<div class="trow"><span>Discount</span><span>-₹${Number(data.orderDiscount).toFixed(2)}</span></div>` : ''}
      <div class="trow"><span>Taxable Amount</span><span>₹${totals.taxableAmount.toFixed(2)}</span></div>
      <div class="trow"><span>Tax</span><span>₹${totals.tax.toFixed(2)}</span></div>
      <div class="trow grand"><span>Total Amount</span><span>₹${totals.total.toFixed(2)}</span></div>
    </div>
    </body></html>`;
    setPreviewHtml(html);
    setShowPreview(true);
  };

  return (
    <PageShell
      title="Place Purchase Order"
      subtitle="Select ready-made finished items and submit a purchase order (PO) to Aradhya Brothers"
      back={{ label: 'Purchase Orders', href: '/dealer/orders' }}
    >
      <form onSubmit={form.handleSubmit(submit)} className="mx-auto max-w-6xl space-y-6 pb-10">

        {/* ── Bill To (Admin / Company) ── */}
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Bill To (Recipient)</Label>
              <Input value="Aradhya Brothers (Admin)" readOnly className="bg-surface-2 font-semibold" />
            </div>

            {/* PO Prefix + Number */}
            <div>
              <Label>PO Prefix</Label>
              <Input {...form.register('prefix')} placeholder="AB/PF/25-26/" className="uppercase font-mono" />
            </div>
            <div>
              <Label>PO Number (Auto)</Label>
              <Input {...form.register('orderNo')} readOnly className="bg-surface-2 font-mono text-sm" />
            </div>
            <div>
              <Label>Proforma Invoice Date</Label>
              <Input type="date" {...form.register('orderDate')} />
            </div>

            {/* Payment Terms + Expiry Date */}
            <div>
              <Label>Payment Terms</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" {...form.register('paymentTermsDays')} />
                <span className="text-sm text-[var(--color-text-secondary)]">days</span>
              </div>
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" {...form.register('expiryDate')} />
            </div>

            {/* E-Way Bill + Vehicle */}
            <div>
              <Label>E-Way Bill No.</Label>
              <Input {...form.register('eWayBillNo')} placeholder="Optional" />
            </div>
            <div>
              <Label>Vehicle No.</Label>
              <Input {...form.register('vehicleNo')} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        {/* ── Items Selection ── */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Finished Goods Catalog</CardTitle>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Click any product to add it to your Purchase Order (prices populated automatically)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input className="w-48 pl-9 text-sm" placeholder="Search by name, SKU..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Input className="w-36 text-sm" placeholder="Scan barcode" value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), scanBarcode())} />
                <Button type="button" variant="outline" size="sm" onClick={scanBarcode}>Scan</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Finished Goods Product Cards Catalog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-2 border rounded-lg bg-surface-2/40">
              {filteredProducts.length === 0 ? (
                <p className="col-span-full py-4 text-center text-xs text-[var(--color-text-secondary)]">No products found matching "{itemSearch}"</p>
              ) : (
                filteredProducts.map((p) => {
                  const price = Number(p.unitPrice ?? p.basePrice ?? p.mrp ?? p.price ?? 0);
                  const isAdded = watchItems?.some((i) => i.sku === p.sku);
                  return (
                    <div
                      key={p.id || p.sku}
                      onClick={() => !isAdded && addProduct(p)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-md border text-left transition-all cursor-pointer",
                        isAdded
                          ? "bg-surface-3/50 border-surface-3 opacity-60 cursor-not-allowed"
                          : "bg-surface-1 border-surface-3 hover:border-brand-500 hover:shadow-xs"
                      )}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-xs text-[var(--color-text-primary)] truncate">{p.name}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{p.sku}</span>
                          {p.category && <span>• {p.category}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-brand-600">{formatCurrency(price)}</p>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          {isAdded ? '✓ Added' : '+ Add'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full min-w-[950px] text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Items / Services</th>
                    <th className="px-3 py-2">HSN / SAC</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price/Item (₹)</th>
                    <th className="px-3 py-2 text-right">Discount %</th>
                    <th className="px-3 py-2 text-right">Tax</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {fields.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--color-text-secondary)]">+ Select products from pills above to add items</td></tr>
                  ) : fields.map((field, i) => {
                    const item = watchItems[i] || {};
                    const line = calcLine(item);
                    return (
                      <tr key={field.id} className="border-b border-surface-3">
                        <td className="px-3 py-2 font-medium">
                          <p>{item.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{item.sku}</p>
                          <input type="hidden" {...form.register(`lineItems.${i}.name`)} />
                          <input type="hidden" {...form.register(`lineItems.${i}.sku`)} />
                        </td>
                        <td className="px-3 py-2"><Input placeholder="HSN" {...form.register(`lineItems.${i}.hsn`)} className="w-24" /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="1" className="ml-auto w-16 text-right" {...form.register(`lineItems.${i}.quantity`)} /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="0" step="0.01" className="ml-auto w-24 text-right bg-surface-2 opacity-80 pointer-events-none" readOnly {...form.register(`lineItems.${i}.unitPrice`)} /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="0" max="100" step="0.01" className="ml-auto w-20 text-right bg-surface-2 opacity-80 pointer-events-none" readOnly placeholder="0%" {...form.register(`lineItems.${i}.discount`)} /></td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          <Input type="number" min="0" max="28" className="ml-auto w-14 text-right bg-surface-2 opacity-80 pointer-events-none" readOnly {...form.register(`lineItems.${i}.gstRate`)} />
                          <span className="block mt-0.5 text-[var(--color-text-secondary)]">{formatCurrency(line.tax)}</span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{formatCurrency(line.total)}</td>
                        <td className="px-3 py-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                            <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Additional details and totals ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!showNotes ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowNotes(true)}>+ Add Notes</Button>
            ) : (
              <Card>
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle className="text-sm">Notes</CardTitle>
                  <button type="button" onClick={() => setShowNotes(false)}><X className="h-4 w-4" /></button>
                </CardHeader>
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

            {showBank && (
              <Card>
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle className="text-sm">Bank Details (Admin Recipient)</CardTitle>
                  <button type="button" onClick={() => setShowBank(false)}><X className="h-4 w-4" /></button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>Account Number</Label><Input {...form.register('bankDetails.accountNumber')} /></div>
                    <div><Label>IFSC Code</Label><Input {...form.register('bankDetails.ifsc')} /></div>
                    <div><Label>Bank &amp; Branch Name</Label><Input {...form.register('bankDetails.bankName')} /></div>
                    <div><Label>Account Holder Name</Label><Input {...form.register('bankDetails.holderName')} /></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Totals side card */}
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">SUBTotal</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>

              {!showDiscount ? (
                <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-brand-600" onClick={() => setShowDiscount(true)}>+ Add Discount</Button>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--color-text-secondary)]">Discount (₹)</span>
                  <Input type="number" min="0" className="w-28 text-right" {...form.register('orderDiscount')} />
                </div>
              )}

              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Taxable Amount</span><span className="tabular-nums">{totals.taxableAmount}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Tax</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between border-t border-surface-3 pt-2 text-base font-semibold">
                <span>Total Amount</span><span className="tabular-nums">{formatCurrency(totals.total)}</span>
              </div>

              <div className="space-y-2 pt-3">
                <Button type="button" variant="outline" className="w-full" onClick={handlePreview}>
                  Preview PO
                </Button>
                <Button type="submit" className="w-full gap-2" disabled={saving || fields.length === 0}>
                  <ClipboardCheck className="h-4 w-4" /> {saving ? 'Submitting PO…' : 'Place Purchase Order'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/dealer/orders')}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </form>

      {/* Preview drawer */}
      <Sheet open={showPreview} onOpenChange={setShowPreview} title="Purchase Order Preview">
        {previewHtml && (
          <div className="space-y-3">
            <div
              className="rounded border border-surface-3 bg-white p-2 text-[10px]"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </Sheet>
    </PageShell>
  );
}
