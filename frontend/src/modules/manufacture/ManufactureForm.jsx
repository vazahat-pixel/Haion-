import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, Factory, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { warehousesService } from '@/services/warehouses.service';
import { productsService } from '@/services/products.service';
import { manufactureService } from '@/services/manufacture.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

const emptyNewProduct = () => ({
  name: '',
  sku: '',
  category: 'Finished Goods',
  brand: '',
  hsnCode: '8703',
  gstRate: 18,
  unitOfMeasure: 'Piece',
});

export function ManufactureForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState('');
  const [mode, setMode] = useState('existing'); // existing | new
  const [finishedProductId, setFinishedProductId] = useState('');
  const [newProduct, setNewProduct] = useState(emptyNewProduct());
  const [qtyProduced, setQtyProduced] = useState(1);
  const [sellingPrice, setSellingPrice] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [selected, setSelected] = useState({}); // sku -> { sku, name, productId, qtyPerUnit, available, unitPrice }
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: whRes } = useQuery({
    queryKey: queryKeys.warehouses.list({ perPage: 50 }),
    queryFn: () => warehousesService.getList({ perPage: 50 }),
  });

  const { data: fgRes } = useQuery({
    queryKey: queryKeys.products.list({ status: 'ACTIVE', productKind: 'FINISHED', perPage: 200 }),
    queryFn: () => productsService.getList({ status: 'ACTIVE', productKind: 'FINISHED', perPage: 200 }),
  });

  const { data: materials = [], isLoading: materialsLoading, isFetching: materialsFetching } = useQuery({
    queryKey: queryKeys.manufacture.materials(warehouseId),
    queryFn: () => manufactureService.getMaterials(warehouseId),
    enabled: Boolean(warehouseId),
  });

  const warehouses = whRes?.data || [];
  const finishedProducts = fgRes?.data || [];

  const selectedFinishedSku = useMemo(() => {
    if (mode === 'new') return (newProduct.sku || '').toUpperCase().trim();
    const p = finishedProducts.find((x) => x.id === finishedProductId);
    return p?.sku || '';
  }, [mode, newProduct.sku, finishedProductId, finishedProducts]);

  const filteredMaterials = useMemo(() => {
    const q = materialSearch.trim().toLowerCase();
    return (materials || []).filter((m) => {
      if (selectedFinishedSku && m.sku === selectedFinishedSku) return false;
      if (!q) return true;
      return (
        m.sku?.toLowerCase().includes(q)
        || m.name?.toLowerCase().includes(q)
        || m.category?.toLowerCase().includes(q)
      );
    });
  }, [materials, materialSearch, selectedFinishedSku]);

  // Drop selection if warehouse changes
  useEffect(() => {
    setSelected({});
  }, [warehouseId]);

  const toggleMaterial = (item) => {
    setSelected((prev) => {
      if (prev[item.sku]) {
        const next = { ...prev };
        delete next[item.sku];
        return next;
      }
      return {
        ...prev,
        [item.sku]: {
          sku: item.sku,
          name: item.name,
          productId: item.productId || undefined,
          qtyPerUnit: 1,
          available: item.quantity,
          unitPrice: item.unitPrice || 0,
        },
      };
    });
  };

  const setQtyPerUnit = (sku, value) => {
    const n = Number(value);
    setSelected((prev) => ({
      ...prev,
      [sku]: { ...prev[sku], qtyPerUnit: n },
    }));
  };

  const selectedList = Object.values(selected);
  const estimatedCost = selectedList.reduce(
    (sum, line) => sum + (line.unitPrice || 0) * (line.qtyPerUnit || 0) * (qtyProduced || 0),
    0
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!warehouseId) {
      toast.error('Select a warehouse');
      return;
    }
    if (mode === 'existing' && !finishedProductId) {
      toast.error('Select a finished product');
      return;
    }
    if (mode === 'new') {
      if (!newProduct.name?.trim() || !newProduct.sku?.trim()) {
        toast.error('Enter finished product name and SKU');
        return;
      }
    }
    if (!qtyProduced || qtyProduced < 1) {
      toast.error('Produce at least 1 unit');
      return;
    }
    const priceNum = Number(sellingPrice);
    if (sellingPrice === '' || Number.isNaN(priceNum) || priceNum < 0) {
      toast.error('Enter selling price decided by admin (₹ per unit)');
      return;
    }
    if (!selectedList.length) {
      toast.error('Select at least one purchased material');
      return;
    }

    for (const line of selectedList) {
      const need = (line.qtyPerUnit || 0) * qtyProduced;
      if (!line.qtyPerUnit || line.qtyPerUnit <= 0) {
        toast.error(`Enter qty per unit for ${line.sku}`);
        return;
      }
      if (need > line.available) {
        toast.error(`Not enough ${line.sku} — need ${need}, available ${line.available}`);
        return;
      }
    }

    const payload = {
      warehouseId,
      qtyProduced: Number(qtyProduced),
      sellingPrice: priceNum,
      notes: notes || undefined,
      components: selectedList.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        qtyPerUnit: Number(l.qtyPerUnit),
      })),
    };

    if (mode === 'existing') {
      payload.finishedProductId = finishedProductId;
    } else {
      payload.newFinishedProduct = {
        ...newProduct,
        sku: newProduct.sku.toUpperCase().trim(),
        gstRate: Number(newProduct.gstRate),
      };
    }

    setSaving(true);
    try {
      const created = await manufactureService.create(payload);
      toast.success(created?.message || 'Product manufactured — added to Finished Goods');
      qc.invalidateQueries({ queryKey: queryKeys.manufacture.all });
      qc.invalidateQueries({ queryKey: queryKeys.inventory.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
      qc.invalidateQueries({ queryKey: queryKeys.stockMovements.all });
      navigate(`/admin/manufacture/${created.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to manufacture product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-4 w-4" /> Make Finished Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Warehouse *</Label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name || w.code}</option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Purchased materials from this warehouse will be listed below
              </p>
            </div>
            <div>
              <Label>Quantity to produce *</Label>
              <Input
                type="number"
                min={1}
                value={qtyProduced}
                onChange={(e) => setQtyProduced(Number(e.target.value))}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Selling price / unit (₹) *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Admin decides finished product price"
                required
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                This is the price you set for the finished good. Material cost below is only a reference
                (sum of purchased raw material prices).
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === 'existing' ? 'default' : 'outline'}
              onClick={() => setMode('existing')}
            >
              Existing finished product
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'new' ? 'default' : 'outline'}
              onClick={() => setMode('new')}
            >
              <Plus className="h-4 w-4" /> Create new product
            </Button>
          </div>

          {mode === 'existing' ? (
            <div>
              <Label>Finished Product *</Label>
              <Select value={finishedProductId} onChange={(e) => setFinishedProductId(e.target.value)} required>
                <option value="">Select finished product…</option>
                {finishedProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                ))}
              </Select>
              {!finishedProducts.length && (
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                  No finished products yet — switch to “Create new product” (e.g. Electric Scooter)
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-[var(--color-border)] p-4">
              <div className="sm:col-span-2">
                <Label>Product Name *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Electric Scooter"
                  required={mode === 'new'}
                />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value.toUpperCase() }))}
                  placeholder="e.g. ESC-001"
                  className="uppercase font-mono"
                  required={mode === 'new'}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                />
              </div>
              <div>
                <Label>HSN</Label>
                <Input
                  value={newProduct.hsnCode}
                  onChange={(e) => setNewProduct((p) => ({ ...p, hsnCode: e.target.value }))}
                />
              </div>
              <div>
                <Label>GST %</Label>
                <Select
                  value={String(newProduct.gstRate)}
                  onChange={(e) => setNewProduct((p) => ({ ...p, gstRate: Number(e.target.value) }))}
                >
                  {[0, 5, 12, 18, 28].map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional production notes"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Select purchased materials
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <Input
              className="pl-8"
              placeholder="Search purchased items…"
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              disabled={!warehouseId}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!warehouseId ? (
            <p className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">
              Select a warehouse to see purchased stock available for manufacturing
            </p>
          ) : materialsLoading || materialsFetching ? (
            <p className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">Loading materials…</p>
          ) : !filteredMaterials.length ? (
            <p className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">
              No purchased stock in this warehouse. Receive a purchase first.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-muted)]/40 text-left">
                  <tr>
                    <th className="p-3 w-10" />
                    <th className="p-3">SKU</th>
                    <th className="p-3">Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Available</th>
                    <th className="p-3 text-right">Qty / unit</th>
                    <th className="p-3 text-right">Total use</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((item) => {
                    const isOn = Boolean(selected[item.sku]);
                    const qtyPer = selected[item.sku]?.qtyPerUnit || 1;
                    const totalUse = isOn ? qtyPer * (qtyProduced || 0) : 0;
                    const over = isOn && totalUse > item.quantity;
                    return (
                      <tr
                        key={item.sku}
                        className={`border-t border-[var(--color-border)] ${isOn ? 'bg-[var(--color-primary)]/5' : ''}`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isOn}
                            onChange={() => toggleMaterial(item)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="p-3 font-mono text-xs">{item.sku}</td>
                        <td className="p-3">{item.name}</td>
                        <td className="p-3 text-[var(--color-muted-foreground)]">{item.category}</td>
                        <td className="p-3 text-right tabular-nums">{item.quantity}</td>
                        <td className="p-3 text-right">
                          {isOn ? (
                            <Input
                              type="number"
                              min={0.001}
                              step="any"
                              className="ml-auto w-24 text-right"
                              value={qtyPer}
                              onChange={(e) => setQtyPerUnit(item.sku, e.target.value)}
                            />
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className={`p-3 text-right tabular-nums ${over ? 'text-[var(--color-danger)] font-medium' : ''}`}>
                          {isOn ? totalUse : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedList.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Selected materials ({selectedList.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedList.map((line) => (
                  <span
                    key={line.sku}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs"
                  >
                    {line.sku} × {line.qtyPerUnit}/unit
                    <button type="button" onClick={() => toggleMaterial(line)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Estimated material cost (auto): <strong>{formatCurrency(estimatedCost)}</strong>
                {sellingPrice !== '' && !Number.isNaN(Number(sellingPrice)) && (
                  <> · Selling price (admin): <strong>{formatCurrency(Number(sellingPrice))}</strong>/unit</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate('/admin/manufacture')}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Manufacturing…' : 'Manufacture & move to Finished Goods'}
        </Button>
      </div>
    </form>
  );
}
