import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { dispatchService } from '@/services/dispatch.service';
import { dealersService } from '@/services/dealers.service';
import { warehousesService } from '@/services/warehouses.service';
import { productsService } from '@/services/products.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';

const emptyLine = () => ({ sku: '', name: '', quantity: 1 });

export function DispatchCreateDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [dealerId, setDealerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const { data: dealersRes } = useQuery({
    queryKey: ['dealers', 'dispatch-create'],
    queryFn: () => dealersService.getList({ perPage: 100, status: 'ACTIVE' }),
    enabled: open,
  });
  const { data: whRes } = useQuery({
    queryKey: ['warehouses', 'dispatch-create'],
    queryFn: () => warehousesService.getList({ perPage: 50 }),
    enabled: open,
  });
  const { data: productsRes } = useQuery({
    queryKey: ['products', 'dispatch-create', 'finished'],
    queryFn: () => productsService.getList({ perPage: 200, status: 'ACTIVE', productKind: 'FINISHED' }),
    enabled: open,
  });
  const { data: allProductsRes } = useQuery({
    queryKey: ['products', 'dispatch-create', 'all'],
    queryFn: () => productsService.getList({ perPage: 200, status: 'ACTIVE' }),
    enabled: open,
  });

  const dealers = dealersRes?.data || [];
  const warehouses = whRes?.data || [];
  const finishedProducts = productsRes?.data || [];
  const products = finishedProducts.length
    ? finishedProducts
    : (allProductsRes?.data || []);

  const pickProduct = (idx, sku) => {
    const p = products.find((x) => x.sku === sku);
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, sku, name: p?.name || l.name } : l)));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!dealerId || !warehouseId) {
      toast.error('Select dealer and warehouse');
      return;
    }
    const lineItems = lines.filter((l) => l.sku && l.quantity > 0);
    if (!lineItems.length) {
      toast.error('Add at least one line item');
      return;
    }
    setSaving(true);
    try {
      await dispatchService.create({ dealerId, warehouseId, lineItems });
      toast.success('Dispatch created');
      qc.invalidateQueries({ queryKey: queryKeys.dispatch.all });
      setDealerId('');
      setWarehouseId('');
      setLines([emptyLine()]);
      onOpenChange?.(false);
    } catch {
      toast.error('Failed to create dispatch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Create Dispatch" description="Ship stock from warehouse to dealer">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Dealer</Label>
          <Select value={dealerId} onChange={(e) => setDealerId(e.target.value)} required>
            <option value="">Select dealer…</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Warehouse</Label>
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            <option value="">Select warehouse…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name || w.code}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Line Items</Label>
          {lines.map((line, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={line.sku} onChange={(e) => pickProduct(idx, e.target.value)}>
                  <option value="">{finishedProducts.length ? 'Finished good SKU…' : 'Product SKU…'}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>{p.sku} — {p.name}</option>
                  ))}
                </Select>
              </div>
              <Input
                type="number"
                min={1}
                className="w-20"
                value={line.quantity}
                onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, quantity: Number(e.target.value) } : l)))}
              />
              {lines.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Creating…' : 'Create Dispatch'}</Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  );
}
