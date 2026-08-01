import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ShieldX, User, Package, Clock, PlusCircle, CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { complaintsService } from '@/services/complaints.service';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

export default function WalkinComplaintPage() {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!mobileNumber.trim() && !serialNumber.trim()) {
      return toast.error('Please enter a Mobile Number or Serial Number');
    }
    setLoading(true);
    try {
      const data = await complaintsService.search360({
        phone: mobileNumber.trim(),
        serialNo: serialNumber.trim(),
      });
      setCustomerData(data);
      if (data?.found) {
        toast.success('Customer profile & warranty details fetched!');
      } else {
        toast.info('No prior records found for this contact/serial. You can proceed with new details.');
      }
    } catch {
      toast.error('Error fetching customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWalkinComplaint = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) {
      return toast.error('Please enter complaint description');
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: customerData?.customerName || 'Walk-in Customer',
        phone: mobileNumber || customerData?.phone || '',
        product: customerData?.product || 'Standard Appliance',
        serialNo: serialNumber || customerData?.serialNo || '',
        billNo: customerData?.billNo || '',
        description: issueDescription.trim(),
        priority,
        source: 'WALK_IN',
        warrantyEligible: customerData?.warrantyEligible ?? false,
        costType: customerData?.costType || 'PAID',
      };

      await complaintsService.create(payload);
      toast.success('Walk-in Complaint & Job Card created successfully!');
      navigate('/service/complaints');
    } catch (err) {
      toast.error(err.message || 'Failed to create Walk-in Complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Walk-in Service Centre Panel"
      subtitle="Search customer details by Mobile Number or Serial Number to create a Walk-in Complaint"
    >
      <div className="space-y-6 max-w-5xl">
        {/* Search Bar */}
        <div className="rounded-xl border border-surface-3 bg-surface-1 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-surface-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Customer & Product Verification
          </h3>

          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="e.g. 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="serial">Product / Vehicle Serial Number</Label>
              <Input
                id="serial"
                placeholder="e.g. SN-884920"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Searching...' : 'Search Details'}
              </Button>
            </div>
          </form>
        </div>

        {/* Search Results / Details Display */}
        {customerData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer & Product Card */}
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border border-surface-3 bg-surface-1 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-surface-2 pb-3">
                  <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Customer Information
                  </h4>
                  <Badge variant={customerData.warrantyEligible ? 'success' : 'secondary'}>
                    {customerData.costType} SERVICE
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-surface-500">Customer Name</p>
                    <p className="font-medium">{customerData.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Contact Number</p>
                    <p className="font-medium">{customerData.phone || mobileNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Product</p>
                    <p className="font-medium">{customerData.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-500">Serial Number</p>
                    <p className="font-medium font-mono">{customerData.serialNo || serialNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Warranty Status Box */}
              <div className={cn(
                'rounded-xl border p-4 flex items-start gap-3',
                customerData.warrantyEligible
                  ? 'border-green-300 bg-green-50/50 text-green-900'
                  : 'border-amber-300 bg-amber-50/50 text-amber-900'
              )}>
                {customerData.warrantyEligible ? (
                  <ShieldCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldX className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-semibold">
                    Warranty Status: {customerData.warrantyEligible ? 'Under Warranty (FOC)' : 'Out of Warranty (Paid Service)'}
                  </h5>
                  <p className="text-sm opacity-90">{customerData.warrantyReason}</p>
                </div>
              </div>

              {/* Previous Complaint History */}
              {customerData.complaintHistory?.length > 0 && (
                <div className="rounded-xl border border-surface-3 bg-surface-1 p-5">
                  <h4 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Complaint History
                  </h4>
                  <div className="space-y-2">
                    {customerData.complaintHistory.map((cmp) => (
                      <div key={cmp._id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface-2">
                        <div>
                          <span className="font-semibold text-primary">{cmp.ticketNo}</span> - {cmp.product}
                          <p className="text-surface-600">{cmp.description}</p>
                        </div>
                        <Badge variant="outline">{cmp.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Create Complaint Form */}
            <div className="rounded-xl border border-surface-3 bg-surface-1 p-5 space-y-4">
              <h4 className="font-semibold text-surface-900 flex items-center gap-2 border-b border-surface-2 pb-3">
                <PlusCircle className="h-5 w-5 text-primary" /> Register Walk-in Complaint
              </h4>

              <form onSubmit={handleCreateWalkinComplaint} className="space-y-4">
                <div>
                  <Label>Priority</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-surface-1 text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="issue">Complaint Description / Issue</Label>
                  <Textarea
                    id="issue"
                    rows={4}
                    placeholder="Describe the issue reported by the customer..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="p-3 bg-surface-2 rounded-lg text-xs space-y-1">
                  <p><span className="font-semibold">Service Type:</span> {customerData.costType} (Auto-calculated)</p>
                  <p><span className="font-semibold">Source Channel:</span> Walk-in Service Centre</p>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Creating Complaint...' : 'Create Walk-in Complaint & Job Card'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
