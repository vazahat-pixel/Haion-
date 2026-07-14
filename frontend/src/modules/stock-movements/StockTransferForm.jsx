import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { inventoryService } from '@/services/inventory.service';
import { warehousesService } from '@/services/warehouses.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';

export function StockTransferForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    sku: '',
    quantity: 1,
    notes: '',
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: queryKeys.warehouses.list({}),
    queryFn: async () => (await warehousesService.getList({ perPage: 100 })).data,
  });

  const transfer = useMutation({
    mutationFn: () => inventoryService.transferStock(form),
    onSuccess: (data) => {
      toast.success(data?.message || 'Stock transferred');
      qc.invalidateQueries({ queryKey: queryKeys.stockMovements.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      setForm((f) => ({ ...f, sku: '', quantity: 1, notes: '' }));
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Transfer failed'),
  });

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-4 w-4" /> Inter-Warehouse Transfer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            transfer.mutate();
          }}
        >
          <div>
            <Label>From Warehouse</Label>
            <Select
              value={form.fromWarehouseId}
              onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
            >
              <option value="">Select source…</option>
              {warehouseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>To Warehouse</Label>
            <Select
              value={form.toWarehouseId}
              onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
            >
              <option value="">Select destination…</option>
              {warehouseOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              placeholder="e.g. MOT-5HP-001"
              required
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reason for transfer"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={transfer.isPending || !form.fromWarehouseId || !form.toWarehouseId || !form.sku}>
              {transfer.isPending ? 'Transferring…' : 'Transfer Stock'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
