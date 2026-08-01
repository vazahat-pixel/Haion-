import { useEffect, useState } from 'react';
import { Headphones, Search, Filter, Wrench, ShieldCheck, ShieldX, CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { complaintsService } from '@/services/complaints.service';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { toast } from '@/utils/toast';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [centers, setCenters] = useState([]);
  const [selectedCmp, setSelectedCmp] = useState(null);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintsService.getList({
        search,
        source: sourceFilter,
        status: statusFilter,
      });
      setComplaints(res.data || []);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const res = await serviceCenterService.getList();
      setCenters(res.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchComplaints();
    fetchCenters();
  }, [search, sourceFilter, statusFilter]);

  const handleAssignCenter = async () => {
    if (!selectedCmp || !selectedCenterId) return toast.error('Select a Service Centre');
    setAssigning(true);
    try {
      const cmpId = selectedCmp.id || selectedCmp._id;
      const targetCenter = centers.find((c) => (c.id || c._id) === selectedCenterId);
      await complaintsService.assignCenter(cmpId, {
        serviceCenterId: selectedCenterId,
        serviceCenterName: targetCenter?.name || 'Service Centre',
      });
      toast.success(`Complaint assigned to ${targetCenter?.name || 'Service Centre'}`);
      setSelectedCmp(null);
      setSelectedCenterId('');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to assign Service Centre');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <PageShell
      title="Admin Complaint Console"
      subtitle="Monitor complaints logged across Walk-in, Toll-Free, and Customer Panel channels, and assign Service Centres"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-1 p-4 rounded-xl border border-surface-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <Input
              placeholder="Search by Ticket #, Customer, Serial, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            className="px-3 py-2 border rounded-md text-sm bg-surface-1"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All Channels</option>
            <option value="CUSTOMER_PANEL">Customer Panel</option>
            <option value="TOLL_FREE">Toll-Free Support</option>
            <option value="WALK_IN">Walk-in Service Centre</option>
          </select>

          <select
            className="px-3 py-2 border rounded-md text-sm bg-surface-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="text-center py-12 text-surface-500">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-surface-1">
            <Headphones className="h-10 w-10 text-surface-400 mx-auto mb-2" />
            <p className="font-semibold text-surface-700">No complaints found</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 border-b border-surface-3 text-surface-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Ticket #</th>
                  <th className="p-4">Channel / Source</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product / Serial</th>
                  <th className="p-4">Warranty Cost</th>
                  <th className="p-4">Service Centre</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {complaints.map((c) => {
                  const cId = c.id || c._id;
                  return (
                    <tr key={cId} className="hover:bg-surface-2/50 transition">
                      <td className="p-4 font-mono font-bold text-primary">{c.ticketNo}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {(c.source || 'CUSTOMER_PANEL').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-surface-900">{c.customer}</p>
                        <p className="text-xs text-surface-500">{c.phone || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-surface-900">{c.product}</p>
                        <p className="text-xs text-surface-500 font-mono">S/N: {c.serialNo || 'N/A'}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={c.costType === 'FOC' || c.warrantyEligible ? 'success' : 'secondary'}>
                          {c.costType || (c.warrantyEligible ? 'FOC' : 'PAID')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {c.serviceCenterName ? (
                          <span className="font-medium text-surface-900">{c.serviceCenterName}</span>
                        ) : (
                          <span className="text-xs text-amber-600 font-semibold italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{c.status}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedCmp(c);
                            setSelectedCenterId(c.serviceCenter || '');
                          }}
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1" /> Assign Centre
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Assign Service Centre */}
        {selectedCmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Assign Service Centre</h3>
              <p className="text-xs text-surface-600">
                Ticket: <span className="font-mono font-bold text-primary">{selectedCmp.ticketNo}</span> | Product: {selectedCmp.product}
              </p>

              <div>
                <label className="text-xs font-semibold text-surface-700">Select Service Centre</label>
                <select
                  className="w-full mt-1.5 px-3 py-2 border rounded-md text-sm bg-surface-1"
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                >
                  <option value="">-- Choose Service Centre --</option>
                  {centers.map((cnt) => {
                    const cntId = cnt.id || cnt._id;
                    return (
                      <option key={cntId} value={cntId}>
                        {cnt.name} ({cnt.city}, {cnt.state})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={() => setSelectedCmp(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignCenter} disabled={assigning}>
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
