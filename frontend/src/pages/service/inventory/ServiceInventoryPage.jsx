import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Plus, Search, RefreshCw, Send, CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { sparesService } from '@/services/spares.service';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';

export default function ServiceInventoryPage() {
  const { user } = useAuth();
  const serviceCenterId = user?.serviceCenterId || user?._id || 'default_center';

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState(10);
  const [reorder, setReorder] = useState(5);
  const [saving, setSaving] = useState(false);

  // Request Spare Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqPartName, setReqPartName] = useState('');
  const [reqSku, setReqSku] = useState('');
  const [reqQty, setReqQty] = useState(1);
  const [reqNotes, setReqNotes] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await serviceCenterService.getInventory(serviceCenterId, { search });
      setInventory(res.data || []);
    } catch {
      toast.error('Failed to load Service Centre Inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return toast.error('Enter SKU and Name');
    setSaving(true);
    try {
      await serviceCenterService.upsertInventoryItem(serviceCenterId, {
        sku: sku.toUpperCase(),
        name,
        availableStock: Number(qty),
        reorderLevel: Number(reorder),
      });
      toast.success('Inventory item updated successfully!');
      setShowAddModal(false);
      setSku('');
      setName('');
      fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSpare = async (e) => {
    e.preventDefault();
    if (!reqPartName.trim() || !reqSku.trim()) return toast.error('Enter Part Name and SKU');
    setSubmittingReq(true);
    try {
      await sparesService.create({
        partName: reqPartName.trim(),
        sku: reqSku.trim().toUpperCase(),
        quantity: Number(reqQty),
        notes: reqNotes.trim(),
        requestedBy: user?.firstName || 'Service Center',
      });
      toast.success('Parts request sent to Admin successfully!');
      setShowRequestModal(false);
      setReqPartName('');
      setReqSku('');
      setReqQty(1);
      setReqNotes('');
    } catch (err) {
      toast.error(err.message || 'Failed to submit parts request');
    } finally {
      setSubmittingReq(false);
    }
  };

  const lowStockCount = inventory.filter((item) => item.availableStock <= item.reorderLevel).length;
  const defectiveTotal = inventory.reduce((sum, item) => sum + (item.defectiveStock || 0), 0);

  return (
    <PageShell
      title="Service Centre Inventory"
      subtitle="Independent inventory management for spare parts, available stock, low stock alerts, and defective parts"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRequestModal(true)}>
            <Send className="h-4 w-4 mr-2" /> Request Parts from Admin
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Stock Item
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-1 border border-surface-3 p-4 rounded-xl flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-surface-500 font-medium">Total Inventory SKUs</p>
              <p className="text-xl font-bold text-surface-900">{inventory.length}</p>
            </div>
          </div>

          <div className="bg-surface-1 border border-surface-3 p-4 rounded-xl flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-surface-500 font-medium">Low Stock Items</p>
              <p className="text-xl font-bold text-amber-700">{lowStockCount}</p>
            </div>
          </div>

          <div className="bg-surface-1 border border-surface-3 p-4 rounded-xl flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-surface-500 font-medium">Defective Stock Units</p>
              <p className="text-xl font-bold text-red-700">{defectiveTotal}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-surface-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search parts by SKU, Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="text-center py-12 text-surface-500">Loading Inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-surface-1">
            <Package className="h-10 w-10 text-surface-400 mx-auto mb-2" />
            <p className="font-semibold text-surface-700">No inventory items found</p>
            <p className="text-sm text-surface-500">Click 'Add Stock Item' to seed your Service Centre inventory.</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Part Name</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Defective Stock</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-2/50 transition">
                    <td className="p-4 font-mono font-semibold text-primary">{item.sku}</td>
                    <td className="p-4 font-medium text-surface-900">{item.name}</td>
                    <td className="p-4">
                      <span className="font-bold">{item.availableStock}</span> units
                    </td>
                    <td className="p-4 text-red-600 font-semibold">{item.defectiveStock || 0} units</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          item.availableStock <= 0
                            ? 'danger'
                            : item.availableStock <= item.reorderLevel
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {item.availableStock <= 0
                          ? 'OUT OF STOCK'
                          : item.availableStock <= item.reorderLevel
                          ? 'LOW STOCK'
                          : 'IN STOCK'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Add Stock Item */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Add / Update Stock Item</h3>
              <form onSubmit={handleSaveItem} className="space-y-3">
                <div>
                  <Label>SKU</Label>
                  <Input placeholder="e.g. MTR-VALVE-01" value={sku} onChange={(e) => setSku(e.target.value)} />
                </div>
                <div>
                  <Label>Part Name</Label>
                  <Input placeholder="e.g. Solenoid Valve" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input type="number" min={1} value={reorder} onChange={(e) => setReorder(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Stock'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Parts from Admin */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Request Parts from Admin</h3>
              <form onSubmit={handleRequestSpare} className="space-y-3">
                <div>
                  <Label>Part Name</Label>
                  <Input placeholder="e.g. Circuit Board V2" value={reqPartName} onChange={(e) => setReqPartName(e.target.value)} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input placeholder="e.g. PCB-V2" value={reqSku} onChange={(e) => setReqSku(e.target.value)} />
                </div>
                <div>
                  <Label>Quantity Needed</Label>
                  <Input type="number" min={1} value={reqQty} onChange={(e) => setReqQty(e.target.value)} />
                </div>
                <div>
                  <Label>Notes / Reason</Label>
                  <Input placeholder="Low inventory / Walk-in requirement" value={reqNotes} onChange={(e) => setReqNotes(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingReq}>
                    {submittingReq ? 'Sending...' : 'Send Request to Admin'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
