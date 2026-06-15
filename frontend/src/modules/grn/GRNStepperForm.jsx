import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Stepper } from '@/components/data-display/Stepper';
import { LoadingState } from '@/components/feedback/LoadingState';
import { grnService } from '@/services/grn.service';
import { warehousesService } from '@/services/warehouses.service';
import { productsService } from '@/services/products.service';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

const steps = ['Receipt Details', 'Line Items', 'Review & Submit'];

const headerSchema = z.object({
  warehouseId: z.string().min(1, 'Select a warehouse'),
  supplier: z.string().min(1, 'Supplier is required'),
  invoiceRef: z.string().optional(),
});

function buildLineItemsFromProducts(products) {
  return (products || []).slice(0, 5).map((p) => ({
    sku: p.sku,
    name: p.name,
    expectedQty: 10,
    receivedQty: 10,
    notes: '',
  }));
}

export function GRNStepperForm({ warehouseId: presetWarehouseId, onComplete }) {
  const [step, setStep] = useState(0);
  const [lineItems, setLineItems] = useState([]);

  const { data: warehouses, isLoading: whLoading } = useQuery({
    queryKey: ['warehouses', 'list'],
    queryFn: () => warehousesService.getList({ perPage: 50 }),
  });

  const { data: productRes, isLoading: prodLoading } = useQuery({
    queryKey: ['products', 'grn-lines'],
    queryFn: () => productsService.getList({ perPage: 20 }),
  });

  useEffect(() => {
    const rows = productRes?.data || [];
    if (lineItems.length === 0 && rows.length) {
      setLineItems(buildLineItemsFromProducts(rows));
    }
  }, [productRes, lineItems.length]);

  const form = useForm({
    resolver: zodResolver(headerSchema),
    defaultValues: { warehouseId: presetWarehouseId || '', supplier: '', invoiceRef: '' },
  });

  useEffect(() => {
    if (presetWarehouseId) form.setValue('warehouseId', presetWarehouseId);
  }, [presetWarehouseId, form]);

  const whList = warehouses?.data || [];
  const total = lineItems.reduce((s, i) => s + (i.receivedQty || 0) * (i.unitPrice || 0), 0);

  const updateLine = (index, field, value) => {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const submit = async () => {
    const header = form.getValues();
    if (!lineItems.length) {
      toast.error('Add at least one line item');
      return;
    }
    try {
      await grnService.create({
        warehouseId: header.warehouseId,
        supplier: header.supplier,
        lineItems: lineItems.map(({ sku, name, expectedQty, receivedQty, notes }) => ({
          sku,
          name,
          expectedQty: Number(expectedQty) || 0,
          receivedQty: Number(receivedQty) || 0,
          notes: notes || '',
        })),
        status: 'PENDING_VERIFICATION',
      });
      toast.success('GRN created successfully');
      onComplete?.();
    } catch {
      toast.error('Failed to create GRN');
    }
  };

  if (whLoading || (prodLoading && !lineItems.length)) {
    return <LoadingState message="Loading GRN form…" />;
  }

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentStep={step} />

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Receipt Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Warehouse</Label>
                <Select {...form.register('warehouseId')}>
                  <option value="">Select warehouse…</option>
                  {whList.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Supplier</Label>
                <Input {...form.register('supplier')} placeholder="e.g. Bosch India" />
              </div>
              <div className="sm:col-span-2">
                <Label>Supplier Invoice Ref</Label>
                <Input {...form.register('invoiceRef')} placeholder="INV-SUP-2024-xxx" />
              </div>
            </div>
            <Button onClick={form.handleSubmit(() => setStep(1))}>Next: Line Items</Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-4 py-2">SKU</th>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2 text-right">Expected</th>
                    <th className="px-4 py-2 text-right">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={`${item.sku}-${i}`} className="border-b border-surface-3">
                      <td className="px-4 py-2">{item.sku}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          className="ml-auto w-20 text-right"
                          value={item.expectedQty}
                          onChange={(e) => updateLine(i, 'expectedQty', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Input
                          type="number"
                          min="0"
                          className="ml-auto w-20 text-right"
                          value={item.receivedQty}
                          onChange={(e) => updateLine(i, 'receivedQty', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lineItems.length === 0 && (
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">No products available — add products in catalog first.</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)} disabled={!lineItems.length}>Next: Review</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Review & Submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-[var(--color-text-secondary)]">Warehouse</dt><dd className="font-medium">{whList.find((w) => w.id === form.getValues('warehouseId'))?.name || '—'}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">Supplier</dt><dd className="font-medium">{form.getValues('supplier')}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">Line Items</dt><dd className="font-medium">{lineItems.length}</dd></div>
              {total > 0 && <div><dt className="text-[var(--color-text-secondary)]">Est. Value</dt><dd className="font-medium">{formatCurrency(total)}</dd></div>}
            </dl>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={submit}>Create GRN</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
