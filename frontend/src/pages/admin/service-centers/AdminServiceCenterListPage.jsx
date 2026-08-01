import { useEffect, useState } from 'react';
import { Wrench, Search, Plus, MapPin, Phone, Mail, Package } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { toast } from '@/utils/toast';

export default function AdminServiceCenterListPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCenter, setSelectedCenter] = useState(null);
  const [centerInventory, setCenterInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const res = await serviceCenterService.getList({ search });
      setCenters(res.data || []);
    } catch {
      toast.error('Failed to load Service Centres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, [search]);

  const handleSelectCenter = async (center) => {
    setSelectedCenter(center);
    setInvLoading(true);
    const centerId = center?.id || center?._id;
    try {
      const res = await serviceCenterService.getInventory(centerId);
      setCenterInventory(res.data || []);
    } catch {
      toast.error('Failed to load inventory for selected centre');
    } finally {
      setInvLoading(false);
    }
  };

  const handleCreateCenter = async (e) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !state.trim()) {
      return toast.error('Enter Name, City, and State');
    }
    setSaving(true);
    try {
      await serviceCenterService.create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        city: city.trim(),
        state: state.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      toast.success('Service Centre created successfully!');
      setShowAddModal(false);
      setCode('');
      setName('');
      setCity('');
      setState('');
      setPhone('');
      setEmail('');
      fetchCenters();
    } catch (err) {
      toast.error(err.message || 'Failed to create Service Centre');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Service Centres & Inventory Monitoring"
      subtitle="Manage registered Service Centres, inspect live inventories, low stock items, and assign in-charge users"
      actions={
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Service Centre
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="flex items-center gap-3 bg-surface-1 p-4 rounded-xl border border-surface-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search Service Centre by Code, Name, City, State..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* List of Centres */}
        {loading ? (
          <div className="text-center py-12 text-surface-500">Loading Service Centres...</div>
        ) : centers.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-surface-1">
            <Wrench className="h-10 w-10 text-surface-400 mx-auto mb-2" />
            <p className="font-semibold text-surface-700">No Service Centres found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Centre Cards */}
            <div className="lg:col-span-1 space-y-3">
              {centers.map((c) => {
                const cId = c.id || c._id;
                const selId = selectedCenter?.id || selectedCenter?._id;
                return (
                  <div
                    key={cId}
                    onClick={() => handleSelectCenter(c)}
                    className={`p-4 border rounded-xl cursor-pointer transition ${
                      selId === cId
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-surface-3 bg-surface-1 hover:border-surface-4'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-primary text-xs">{c.code}</span>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'secondary'}>{c.status}</Badge>
                    </div>
                    <h4 className="font-semibold text-surface-900 mt-1">{c.name}</h4>
                    <p className="text-xs text-surface-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-surface-400" /> {c.city}, {c.state}
                    </p>
                    <div className="text-xs text-surface-500 mt-2 pt-2 border-t border-surface-2 flex items-center justify-between">
                      <span>{c.phone || 'No phone'}</span>
                      <span className="text-primary font-medium">Inspect Inventory →</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Centre Inventory Details */}
            <div className="lg:col-span-2 bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-4">
              {selectedCenter ? (
                <>
                  <div className="border-b border-surface-2 pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-surface-900">{selectedCenter.name}</h3>
                      <Badge variant="outline">{selectedCenter.code}</Badge>
                    </div>
                    <p className="text-xs text-surface-500 mt-1">
                      {selectedCenter.city}, {selectedCenter.state} | Phone: {selectedCenter.phone || 'N/A'} | Email: {selectedCenter.email || 'N/A'}
                    </p>
                  </div>

                  <h4 className="font-semibold text-sm text-surface-900 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Live Service Centre Inventory
                  </h4>

                  {invLoading ? (
                    <div className="py-8 text-center text-xs text-surface-500">Loading inventory items...</div>
                  ) : centerInventory.length === 0 ? (
                    <div className="py-8 text-center text-xs text-surface-500 italic">No inventory stocked at this centre yet.</div>
                  ) : (
                    <div className="border border-surface-2 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-2 text-surface-700 uppercase font-semibold">
                          <tr>
                            <th className="p-3">SKU</th>
                            <th className="p-3">Part Name</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Defective</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-2">
                          {centerInventory.map((item) => (
                            <tr key={item._id}>
                              <td className="p-3 font-mono font-semibold text-primary">{item.sku}</td>
                              <td className="p-3 font-medium">{item.name}</td>
                              <td className="p-3 font-bold">{item.availableStock}</td>
                              <td className="p-3 text-red-600 font-semibold">{item.defectiveStock || 0}</td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    item.availableStock <= 0
                                      ? 'danger'
                                      : item.availableStock <= item.reorderLevel
                                      ? 'warning'
                                      : 'success'
                                  }
                                >
                                  {item.availableStock <= 0 ? 'OUT' : item.availableStock <= item.reorderLevel ? 'LOW' : 'IN STOCK'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center text-surface-500 space-y-2">
                  <Wrench className="h-10 w-10 text-surface-400 mx-auto" />
                  <p className="font-semibold text-surface-700">Select a Service Centre</p>
                  <p className="text-xs">Click on any centre from the left list to inspect its live inventory & defective stock.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Add Service Centre */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Add Service Centre</h3>
              <form onSubmit={handleCreateCenter} className="space-y-3">
                <div>
                  <Label>Code (Optional)</Label>
                  <Input placeholder="e.g. SC-003" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div>
                  <Label>Service Centre Name</Label>
                  <Input placeholder="e.g. SpeedTech Service Hub" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input placeholder="Contact Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Centre'}
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
