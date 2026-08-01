import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ScrollText, User, Package, Wrench, ShieldCheck, ShieldX, Plus, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { jobCardService } from '@/services/jobCard.service';
import { toast } from '@/utils/toast';

export default function JobCardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobCard, setJobCard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Part state
  const [partSku, setPartSku] = useState('');
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState(0);
  const [addingPart, setAddingPart] = useState(false);

  // Status & Labour state
  const [labour, setLabour] = useState(0);
  const [engineer, setEngineer] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchJobCard = async () => {
    try {
      const data = await jobCardService.getDetail(id);
      setJobCard(data);
      setLabour(data?.labourCharges || 0);
      setEngineer(data?.assignedEngineer?.name || '');
    } catch {
      toast.error('Failed to load Job Card details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCard();
  }, [id]);

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!partSku.trim() || !partName.trim()) {
      return toast.error('Enter part SKU and Name');
    }
    setAddingPart(true);
    try {
      await jobCardService.consumeParts(id, {
        sku: partSku.trim(),
        name: partName.trim(),
        quantity: Number(partQty),
        unitPrice: Number(partPrice),
      });
      toast.success('Part added to Job Card & Service Centre Inventory deducted!');
      setPartSku('');
      setPartName('');
      setPartQty(1);
      setPartPrice(0);
      fetchJobCard();
    } catch (err) {
      toast.error(err.message || 'Failed to add part');
    } finally {
      setAddingPart(false);
    }
  };

  const handleMarkDefective = async (partId, partName) => {
    if (!confirm(`Mark ${partName} as defective and request replacement from Admin?`)) return;
    try {
      await jobCardService.markDefective(id, {
        partId,
        requestReplacement: true,
      });
      toast.success('Part marked defective. Replacement request sent to Admin!');
      fetchJobCard();
    } catch (err) {
      toast.error(err.message || 'Failed to mark defective');
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await jobCardService.updateStatus(id, {
        status: newStatus,
        labourCharges: labour,
        engineerName: engineer,
      });
      toast.success(`Job Card status updated to ${newStatus}`);
      fetchJobCard();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageShell title="Job Card"><div className="p-8 text-center text-surface-500">Loading Job Card...</div></PageShell>;
  if (!jobCard) return <PageShell title="Job Card"><div className="p-8 text-center text-surface-500">Job Card not found.</div></PageShell>;

  const isFOC = jobCard.warrantyStatus?.costType === 'FOC';

  return (
    <PageShell
      title={`Job Card: ${jobCard.jobCardNo}`}
      subtitle={`Source: ${jobCard.source?.replace(/_/g, ' ')} | Status: ${jobCard.status}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print Job Card
        </Button>
      }
    >
      <div className="space-y-6 max-w-5xl">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-semibold text-surface-500 uppercase">Customer Details</h4>
            <p className="font-semibold text-surface-900">{jobCard.customer?.name}</p>
            <p className="text-xs text-surface-600">Phone: {jobCard.customer?.phone || 'N/A'}</p>
            <p className="text-xs text-surface-600">Email: {jobCard.customer?.email || 'N/A'}</p>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-semibold text-surface-500 uppercase">Product Details</h4>
            <p className="font-semibold text-surface-900">{jobCard.product?.name}</p>
            <p className="text-xs text-surface-600 font-mono">Serial: {jobCard.product?.serialNo || 'N/A'}</p>
            <p className="text-xs text-surface-600">Bill #: {jobCard.product?.billNo || 'N/A'}</p>
          </div>

          <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-2">
            <h4 className="text-xs font-semibold text-surface-500 uppercase">Warranty & Billing</h4>
            <div className="flex items-center gap-2">
              <Badge variant={isFOC ? 'success' : 'secondary'}>{jobCard.warrantyStatus?.costType || 'FOC'}</Badge>
              <span className="text-xs font-medium text-surface-700">{jobCard.warrantyStatus?.reason}</span>
            </div>
            <p className="text-xs text-surface-600">Total Amount: <span className="font-bold text-surface-900">₹{jobCard.totalAmount}</span> {isFOC && '(Free of Cost)'}</p>
          </div>
        </div>

        {/* Complaint Description */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl p-5">
          <h4 className="font-semibold text-surface-900 mb-2">Complaint Issue / Description</h4>
          <p className="text-sm text-surface-700 bg-surface-2 p-3 rounded-lg">{jobCard.complaintDescription || 'No description provided.'}</p>
        </div>

        {/* Technician & Labour Charges */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-surface-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Service & Technician Assignment
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Assigned Technician / Engineer</Label>
              <Input
                placeholder="Technician Name"
                value={engineer}
                onChange={(e) => setEngineer(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Labour Charges (₹)</Label>
              <Input
                type="number"
                disabled={isFOC}
                value={labour}
                onChange={(e) => setLabour(Number(e.target.value))}
                className="mt-1"
              />
              {isFOC && <p className="text-xs text-green-600 mt-1">Labour charges waived (FOC Warranty)</p>}
            </div>
          </div>
        </div>

        {/* Parts Used Section */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-surface-900">Parts Used & Consumption</h4>

          {/* Add Part Form */}
          <form onSubmit={handleAddPart} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-surface-2 rounded-xl">
            <div>
              <Label className="text-xs">SKU</Label>
              <Input placeholder="SKU-101" value={partSku} onChange={(e) => setPartSku(e.target.value.toUpperCase())} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Part Name</Label>
              <Input placeholder="Filter Mesh / Rotor" value={partName} onChange={(e) => setPartName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={1} value={partQty} onChange={(e) => setPartQty(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={addingPart} className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Part
              </Button>
            </div>
          </form>

          {/* Parts List */}
          {jobCard.partsUsed?.length === 0 ? (
            <p className="text-sm text-surface-500 italic py-2">No spare parts consumed yet.</p>
          ) : (
            <div className="divide-y border border-surface-2 rounded-xl overflow-hidden">
              {jobCard.partsUsed.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3.5 bg-surface-1 text-sm">
                  <div>
                    <span className="font-semibold font-mono text-primary mr-2">{p.sku}</span>
                    <span>{p.name}</span>
                    <span className="text-xs text-surface-500 ml-3">Qty: {p.quantity}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.isDefective ? (
                      <Badge variant="danger">Defective Logged</Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleMarkDefective(p._id, p.name)}
                        className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Mark Defective
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Actions */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl p-5 space-y-3">
          <h4 className="font-semibold text-surface-900">Update Job Status</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={jobCard.status === 'IN_PROGRESS' ? 'default' : 'outline'}
              size="sm"
              disabled={updating}
              onClick={() => handleStatusChange('IN_PROGRESS')}
            >
              Set In Progress
            </Button>
            <Button
              variant={jobCard.status === 'WAITING_PARTS' ? 'default' : 'outline'}
              size="sm"
              disabled={updating}
              onClick={() => handleStatusChange('WAITING_PARTS')}
            >
              Waiting Parts
            </Button>
            <Button
              variant={jobCard.status === 'REPAIRED' ? 'default' : 'outline'}
              size="sm"
              disabled={updating}
              onClick={() => handleStatusChange('REPAIRED')}
            >
              Mark Repaired
            </Button>
            <Button
              variant={jobCard.status === 'RESOLVED' ? 'default' : 'outline'}
              size="sm"
              disabled={updating}
              onClick={() => handleStatusChange('RESOLVED')}
            >
              Mark Resolved
            </Button>
            <Button
              variant={jobCard.status === 'CLOSED' ? 'default' : 'outline'}
              size="sm"
              disabled={updating}
              onClick={() => handleStatusChange('CLOSED')}
            >
              Close Job Card
            </Button>
          </div>
        </div>

        {/* Customer Feedback section if present */}
        {jobCard.customerFeedback?.rating && (
          <div className="bg-green-50/50 border border-green-200 rounded-xl p-5 space-y-2">
            <h4 className="font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" /> Customer Service Feedback
            </h4>
            <p className="text-sm font-bold text-amber-600">{jobCard.customerFeedback.rating} ★★★★★</p>
            <p className="text-sm text-green-900">{jobCard.customerFeedback.comment || 'No written comment'}</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
