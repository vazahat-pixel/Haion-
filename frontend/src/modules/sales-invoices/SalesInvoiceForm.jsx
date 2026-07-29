import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Trash2, Search, Barcode, X, Printer, FileDown, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet } from '@/components/ui/sheet';
import { dealersService } from '@/services/dealers.service';
import { productsService } from '@/services/products.service';
import { salesInvoicesService } from '@/services/sales-invoices.service';
import { settingsService } from '@/services/settings.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

const DEFAULT_TERMS = `1. Goods once sold will not be taken back or exchanged
2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only`;

const DEFAULT_BANK = {
  accountNumber: '099205500220',
  ifsc: 'ICIC0000992',
  bankName: 'ICICI Bank, MORENA',
  holderName: 'Aradhya Brothers',
};

const schema = z.object({
  dealerId: z.string().min(1, 'Select a dealer'),
  prefix: z.string().min(1, 'Prefix required').max(10),
  invoiceNo: z.string().optional(),
  invoiceDate: z.string().min(1),
  paymentTermsDays: z.coerce.number().min(0),
  dueDate: z.string().optional(),
  eWayBillNo: z.string().optional(),
  vehicleNo: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  orderDiscount: z.coerce.number().min(0).optional(),
  amountReceived: z.coerce.number().min(0).optional(),
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
  const disc = Math.min(item.discount || 0, gross);
  const amt = gross - disc;
  const tax = (amt * (item.gstRate || 0)) / 100;
  return { amount: amt, tax, total: amt + tax };
}

function calcTotals(lineItems, orderDiscount, additionalCharges, amountReceived) {
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
  const received = amountReceived || 0;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    balance: Math.round((total - received) * 100) / 100,
  };
}

export function SalesInvoiceForm({ initialData, isEdit = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [dealerSearch, setDealerSearch] = useState('');
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

  const { data: dealersRes } = useQuery({
    queryKey: queryKeys.dealers.list({ status: 'ACTIVE', search: dealerSearch, perPage: 100 }),
    queryFn: () => dealersService.getList({ status: 'ACTIVE', search: dealerSearch, perPage: 100 }),
  });

  const { data: productsRes } = useQuery({
    queryKey: queryKeys.products.list({ status: 'ACTIVE', productKind: 'FINISHED', perPage: 200 }),
    queryFn: () => productsService.getList({ status: 'ACTIVE', productKind: 'FINISHED', perPage: 200 }),
  });

  const { data: nextNumberRes } = useQuery({
    queryKey: queryKeys.salesInvoices.nextNumber('SI'),
    queryFn: () => salesInvoicesService.getNextNumber('SI'),
    enabled: !isEdit,
  });

  const { data: bundle } = useQuery({
    queryKey: ['settings', 'profile-bundle'],
    queryFn: settingsService.getProfileBundle,
  });

  const dealers = dealersRes?.data || [];
  const products = productsRes?.data || [];
  const bankFromSettings = bundle?.business?.bankDetails?.[0] || DEFAULT_BANK;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      dealerId: '',
      prefix: 'SI',
      invoiceNo: nextNumberRes?.invoiceNo || '',
      invoiceDate: today,
      paymentTermsDays: 30,
      dueDate: addDays(today, 30),
      eWayBillNo: '',
      vehicleNo: '',
      notes: '',
      termsAndConditions: DEFAULT_TERMS,
      orderDiscount: 0,
      amountReceived: 0,
      bankDetails: bankFromSettings,
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
  const watchPaid = form.watch('amountReceived');
  const watchInvDate = form.watch('invoiceDate');
  const watchTerms = form.watch('paymentTermsDays');
  const watchPrefix = form.watch('prefix');
  const totals = calcTotals(watchItems, watchDiscount, watchCharges, watchPaid);

  // Auto-update due date
  useEffect(() => {
    if (watchInvDate) form.setValue('dueDate', addDays(watchInvDate, watchTerms));
  }, [watchInvDate, watchTerms, form]);

  // Set invoice number when loaded
  useEffect(() => {
    if (nextNumberRes?.invoiceNo && !isEdit) {
      form.setValue('invoiceNo', nextNumberRes.invoiceNo);
    }
  }, [nextNumberRes, isEdit, form]);

  // Set bank details from settings
  useEffect(() => {
    if (bundle?.business) {
      const b = bundle.business;
      form.setValue('bankDetails', {
        accountNumber: b.bankAccountNumber || DEFAULT_BANK.accountNumber,
        ifsc: b.bankIfsc || DEFAULT_BANK.ifsc,
        bankName: b.bankName || DEFAULT_BANK.bankName,
        holderName: b.businessName || DEFAULT_BANK.holderName,
      });
    }
  }, [bundle, form]);

  const prefill = location.state?.prefillFromPO;
  useEffect(() => {
    if (prefill) {
      form.setValue('dealerId', prefill.dealer);
      form.setValue('notes', `Converted from Order: ${prefill.orderNo}\n${prefill.notes || ''}`);
      if (prefill.lineItems?.length && products.length) {
        const mappedItems = prefill.lineItems.map((item) => {
          const prodObj = products.find((p) => p.sku === item.sku);
          return {
            sku: item.sku,
            name: item.name,
            hsn: prodObj?.hsnCode || prodObj?.hsn || '',
            quantity: item.quantity,
            unitPrice: prodObj?.mrp || prodObj?.basePrice || 0,
            discount: 0,
            gstRate: prodObj?.gstRate || 18,
          };
        });
        form.setValue('lineItems', mappedItems);
      }
    }
  }, [prefill, products, form]);


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
      sku: product.sku,
      name: product.name,
      hsn: product.hsn || product.hsnCode || '',
      quantity: 1,
      unitPrice: product.mrp || product.basePrice || 0,
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

  const onDealerSelect = (id) => {
    form.setValue('dealerId', id);
  };

  const submit = async (data, status = 'DRAFT') => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        status,
      };
      let result;
      if (isEdit && initialData?.id) {
        result = await salesInvoicesService.update(initialData.id, payload);
        toast.success('Invoice updated');
      } else {
        result = await salesInvoicesService.create(payload);
        toast.success(status === 'SENT' ? 'Invoice created & sent to dealer' : 'Invoice saved as draft');
      }
      qc.invalidateQueries({ queryKey: queryKeys.salesInvoices.all });
      navigate(`/admin/sales-invoices/${result.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const data = form.getValues();
    const dealer = dealers.find((d) => d.id === data.dealerId);
    const rows = data.lineItems.map((item, i) => {
      const line = calcLine(item);
      return `<tr>
        <td>${i + 1}</td>
        <td><strong>${item.name}</strong>${item.sku ? `<br/><small style="color:#64748b">${item.sku}</small>` : ''}</td>
        <td>${item.hsn || '—'}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">₹${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right">${item.discount ? `${item.discount}%` : '—'}</td>
        <td style="text-align:right">${item.gstRate}%</td>
        <td style="text-align:right">₹${line.total.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice Preview</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:28px;color:#111;font-size:12px}
      .header{display:flex;justify-content:space-between;border-bottom:2px solid #1e40af;padding-bottom:14px;margin-bottom:18px}
      .co-name{font-size:20px;font-weight:800;color:#1e40af}
      .parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}
      .pbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px}
      .plabel{font-size:9px;text-transform:uppercase;color:#64748b;font-weight:700;margin-bottom:4px}
      .pname{font-weight:700;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#1e40af;color:white;padding:7px 9px;font-size:10px;text-transform:uppercase;text-align:left}
      td{border-bottom:1px solid #e2e8f0;padding:6px 9px;font-size:11px}
      tr:nth-child(even) td{background:#f8fafc}
      .totals{width:260px;margin-left:auto}
      .trow{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #e2e8f0}
      .trow.grand{font-weight:700;font-size:14px;color:#1e40af;border-top:2px solid #1e40af;border-bottom:none;padding-top:8px}
    </style>
    </head><body>
    <button onclick="window.print()" style="position:fixed;top:12px;right:12px;background:#1e40af;color:white;border:none;border-radius:6px;padding:7px 16px;cursor:pointer;font-size:12px;z-index:999">🖨 Print</button>
    <div class="header">
      <div>
        <div class="co-name">${bundle?.business?.businessName || 'Company'}</div>
        <div style="font-size:11px;color:#374151;margin-top:4px">SALES INVOICE (DRAFT PREVIEW)</div>
      </div>
      <div style="text-align:right;font-size:11px">
        <div><strong>Invoice No:</strong> ${data.invoiceNo || '—'}</div>
        <div><strong>Date:</strong> ${data.invoiceDate}</div>
        <div><strong>Due Date:</strong> ${data.dueDate || '—'}</div>
        ${data.eWayBillNo ? `<div><strong>E-Way Bill:</strong> ${data.eWayBillNo}</div>` : ''}
        ${data.vehicleNo ? `<div><strong>Vehicle:</strong> ${data.vehicleNo}</div>` : ''}
      </div>
    </div>
    <div class="parties">
      <div class="pbox"><div class="plabel">From (Seller)</div><div class="pname">${bundle?.business?.businessName || 'Seller'}</div></div>
      <div class="pbox"><div class="plabel">Bill To (Dealer)</div><div class="pname">${dealer?.name || '—'}</div><div style="font-size:11px;color:#64748b">${dealer?.gstin ? `GSTIN: ${dealer.gstin}` : ''}</div></div>
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
      <div class="trow grand"><span>Total</span><span>₹${totals.total.toFixed(2)}</span></div>
      ${data.amountReceived ? `<div class="trow"><span style="color:#16a34a">Received</span><span style="color:#16a34a">₹${Number(data.amountReceived).toFixed(2)}</span></div>` : ''}
    </div>
    </body></html>`;
    setPreviewHtml(html);
    setShowPreview(true);
  };

  return (
    <>
      <form onSubmit={form.handleSubmit((d) => submit(d, 'SENT'))} className="mx-auto max-w-6xl space-y-6 pb-10">

        {/* ── Bill To (Dealer) ── */}
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-[240px] flex-1">
                  <Label>Bill To — Select Dealer *</Label>
                  <div className="relative mt-1 mb-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                    <Input className="pl-9" placeholder="Search dealer by name…" value={dealerSearch} onChange={(e) => setDealerSearch(e.target.value)} />
                  </div>
                  <Select {...form.register('dealerId')} onChange={(e) => onDealerSelect(e.target.value)}>
                    <option value="">Select registered dealer…</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} · {d.city}</option>
                    ))}
                  </Select>
                  {form.formState.errors.dealerId && <p className="text-xs text-[var(--color-danger)] mt-1">{form.formState.errors.dealerId.message}</p>}
                </div>
              </div>
            </div>

            {/* Invoice Prefix + Number */}
            <div>
              <Label>Invoice Prefix</Label>
              <Input {...form.register('prefix')} placeholder="SI" maxLength={10} className="uppercase" />
            </div>
            <div>
              <Label>Invoice Number (Auto)</Label>
              <Input {...form.register('invoiceNo')} readOnly className="bg-surface-2 font-mono text-sm" />
            </div>
            <div>
              <Label>Sales Invoice Date</Label>
              <Input type="date" {...form.register('invoiceDate')} />
            </div>

            {/* Payment Terms + Due Date */}
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

        {/* ── Items / Services ── */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Items / Services</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input className="w-44 pl-9" placeholder="Search items…" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
              </div>
              <div className="flex gap-1">
                <Input className="w-36" placeholder="Scan barcode" value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), scanBarcode())} />
                <Button type="button" variant="outline" size="sm" onClick={scanBarcode}><Barcode className="h-4 w-4" /> Scan</Button>
              </div>
              <Button type="button" variant="outline" size="sm"
                onClick={() => append({ sku: '', name: '', hsn: '', quantity: 1, unitPrice: 0, discount: 0, gstRate: 18 })}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick product pills */}
            <div className="flex flex-wrap gap-2">
              {filteredProducts.slice(0, 8).map((p) => (
                <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addProduct(p)}>
                  <Plus className="h-3 w-3" /> {p.sku}
                </Button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full min-w-[950px] text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Items / Services</th>
                    <th className="px-3 py-2">HSN / SAC</th>
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
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--color-text-secondary)]">+ Add Item from catalog above or manually</td></tr>
                  ) : fields.map((field, i) => {
                    const item = watchItems[i] || {};
                    const line = calcLine(item);
                    return (
                      <tr key={field.id} className="border-b border-surface-3">
                        <td className="px-3 py-2">
                          <Input placeholder="Item name" {...form.register(`lineItems.${i}.name`)} className="min-w-[140px]" />
                          <Input placeholder="SKU (optional)" {...form.register(`lineItems.${i}.sku`)} className="mt-1 text-xs" />
                        </td>
                        <td className="px-3 py-2"><Input placeholder="HSN" {...form.register(`lineItems.${i}.hsn`)} className="w-24" /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="1" className="ml-auto w-16 text-right" {...form.register(`lineItems.${i}.quantity`)} /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="0" step="0.01" className="ml-auto w-24 text-right" {...form.register(`lineItems.${i}.unitPrice`)} /></td>
                        <td className="px-3 py-2 text-right"><Input type="number" min="0" step="0.01" className="ml-auto w-20 text-right" placeholder="₹0" {...form.register(`lineItems.${i}.discount`)} /></td>
                        <td className="px-3 py-2 text-right tabular-nums text-xs">
                          <Input type="number" min="0" max="28" className="ml-auto w-14 text-right" {...form.register(`lineItems.${i}.gstRate`)} />
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

        {/* ── Notes + Terms + Bank + Totals ── */}
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
            {!showTerms && (
              <Button type="button" variant="ghost" size="sm" className="text-brand-600" onClick={() => setShowTerms(true)}>+ Terms and Conditions</Button>
            )}

            {showBank && (
              <Card>
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle className="text-sm">Bank Details</CardTitle>
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
            {!showBank && (
              <Button type="button" variant="ghost" size="sm" className="text-brand-600" onClick={() => setShowBank(true)}>+ Add Bank Details</Button>
            )}
          </div>

          {/* Totals Card */}
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">SUBTotal</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>

              {!showCharges ? (
                <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-brand-600"
                  onClick={() => { setShowCharges(true); appendCharge({ label: 'Freight', amount: 0 }); }}>
                  + Add Additional Charges
                </Button>
              ) : (
                <div className="space-y-2 rounded border border-surface-3 p-3">
                  {chargeFields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input placeholder="Label" {...form.register(`additionalCharges.${i}.label`)} />
                      <Input type="number" className="w-24" {...form.register(`additionalCharges.${i}.amount`)} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendCharge({ label: '', amount: 0 })}>+ Add Charge</Button>
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
                <Label>Amount Received</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">₹</span>
                  <Input type="number" min="0" step="0.01" className="pl-8" {...form.register('amountReceived')} />
                </div>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[var(--color-text-secondary)]">Balance Amount</span>
                <span className="tabular-nums">{formatCurrency(totals.balance)}</span>
              </div>

              <div className="border-t border-surface-3 pt-3 text-xs text-[var(--color-text-tertiary)]">
                Authorized signatory for {bundle?.business?.businessName || 'Company'}
              </div>

              <div className="space-y-2 pt-1">
                <Button type="button" variant="outline" className="w-full gap-2" onClick={handlePreview}>
                  <Eye className="h-4 w-4" /> Preview Invoice
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1"
                    disabled={saving} onClick={form.handleSubmit((d) => submit(d, 'DRAFT'))}>
                    Save Draft
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? 'Saving…' : 'Save & Send'}
                  </Button>
                </div>
                <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/admin/sales-invoices')}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Invoice Preview Drawer */}
      <Sheet open={showPreview} onOpenChange={setShowPreview} title="Invoice Preview" description="Preview before saving">
        {previewHtml && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const w = window.open('', '_blank');
                w.document.write(previewHtml);
                w.document.close();
              }}>
                <Printer className="h-4 w-4" /> Open for Print
              </Button>
            </div>
            <div
              className="rounded border border-surface-3 bg-white p-2 text-[10px]"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </Sheet>
    </>
  );
}
