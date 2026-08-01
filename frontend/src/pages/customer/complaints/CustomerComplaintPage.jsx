import { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldX, Headphones, CheckCircle, Star } from 'lucide-react';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { complaintsService } from '@/services/complaints.service';
import { jobCardService } from '@/services/jobCard.service';
import { toast } from '@/utils/toast';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerComplaintPage() {
  const { user } = useAuth();
  const [serialNo, setSerialNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [myComplaints, setMyComplaints] = useState([]);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);

  const fetchMyComplaints = async () => {
    try {
      const res = await complaintsService.getList({ search: user?.email || user?.phone });
      setMyComplaints(res.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [user]);

  const handleFetchProduct = async (e) => {
    e?.preventDefault();
    if (!serialNo.trim()) return toast.error('Enter Product or Vehicle Serial Number');
    setLoading(true);
    try {
      const data = await complaintsService.search360({ serialNo: serialNo.trim() });
      setProductInfo(data);
      if (data?.found) toast.success('Product and warranty details fetched successfully!');
      else toast.info('No existing record found for serial. You can still raise a complaint.');
    } catch {
      toast.error('Error searching product details');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Please describe your issue');

    setSubmitting(true);
    try {
      await complaintsService.create({
        customer: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Valued Customer',
        phone: user?.phone || '',
        email: user?.email || '',
        product: productInfo?.product || 'Product Unit',
        serialNo: serialNo.trim().toUpperCase(),
        billNo: productInfo?.billNo || '',
        description: description.trim(),
        source: 'CUSTOMER_PANEL',
        warrantyEligible: productInfo?.warrantyEligible ?? false,
        costType: productInfo?.costType || 'PAID',
      });
      toast.success('Complaint raised successfully! Our support team will process it shortly.');
      setDescription('');
      fetchMyComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewJobCard = async (complaintId) => {
    try {
      const card = await jobCardService.getByComplaint(complaintId);
      setSelectedJobCard(card);
    } catch {
      toast.error('Job card not generated yet for this complaint');
    }
  };

  const handleSendFeedback = async () => {
    if (!selectedJobCard) return;
    setFeedbackSending(true);
    try {
      await jobCardService.submitFeedback(selectedJobCard._id, { rating, comment });
      toast.success('Thank you for rating our service!');
      setSelectedJobCard(null);
      fetchMyComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <CustomerPageShell title="Customer Service & Complaint Portal" subtitle="Enter your Product Serial Number to fetch warranty details and raise a complaint">
      <div className="space-y-6 max-w-4xl">
        {/* Step 1: Product Serial Lookup */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-surface-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Step 1: Enter Product / Vehicle Serial Number
          </h3>

          <form onSubmit={handleFetchProduct} className="flex gap-3">
            <Input
              placeholder="e.g. SN-884920"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value.toUpperCase())}
              className="max-w-md"
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch Product Details'}
            </Button>
          </form>
        </div>

        {/* Step 2: Display Product & Warranty Details */}
        {productInfo && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-surface-2 pb-3">
              <div>
                <h4 className="font-bold text-lg text-surface-900">{productInfo.product}</h4>
                <p className="text-xs text-surface-500 font-mono">Serial #: {productInfo.serialNo || serialNo}</p>
              </div>
              <Badge variant={productInfo.warrantyEligible ? 'success' : 'secondary'}>
                {productInfo.costType} SERVICE
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-2">
              {productInfo.warrantyEligible ? (
                <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
              ) : (
                <ShieldX className="h-6 w-6 text-amber-600 shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  Warranty Status: {productInfo.warrantyEligible ? 'Active (Free of Cost Repair)' : 'Expired (Paid Service)'}
                </p>
                <p className="text-xs text-surface-600">{productInfo.warrantyReason}</p>
              </div>
            </div>

            {/* Raise Complaint Form */}
            <form onSubmit={handleRaiseComplaint} className="space-y-4 pt-2">
              <h4 className="font-semibold text-surface-900 flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" /> Step 2: Raise Complaint
              </h4>
              <div>
                <Label htmlFor="desc">Describe the Problem / Symptom</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  placeholder="Explain what is not working properly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Submitting Complaint...' : 'Submit Complaint'}
              </Button>
            </form>
          </div>
        )}

        {/* Existing Complaints & Job Card Tracking */}
        {myComplaints.length > 0 && (
          <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-surface-900">My Raised Complaints & Service History</h3>

            <div className="space-y-3">
              {myComplaints.map((cmp) => (
                <div key={cmp._id} className="p-4 border border-surface-2 rounded-xl flex items-center justify-between bg-surface-1">
                  <div>
                    <span className="font-mono font-bold text-primary mr-2">{cmp.ticketNo}</span>
                    <span className="font-medium text-surface-900">{cmp.product}</span>
                    <p className="text-xs text-surface-500 mt-1">{cmp.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{cmp.status}</Badge>
                    <Button size="xs" variant="outline" onClick={() => handleViewJobCard(cmp._id)}>
                      View Job Card & Feedback
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Card & Feedback Modal */}
        {selectedJobCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface-1 border border-surface-3 rounded-xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-lg font-bold text-surface-900">Job Card: {selectedJobCard.jobCardNo}</h3>

              <div className="p-3 bg-surface-2 rounded-lg text-xs space-y-1">
                <p><span className="font-semibold">Product:</span> {selectedJobCard.product?.name}</p>
                <p><span className="font-semibold">Status:</span> {selectedJobCard.status}</p>
                <p><span className="font-semibold">Warranty:</span> {selectedJobCard.warrantyStatus?.costType}</p>
                <p><span className="font-semibold">Technician:</span> {selectedJobCard.assignedEngineer?.name || 'Assigned'}</p>
              </div>

              {/* Feedback Form if resolved/closed */}
              {['RESOLVED', 'CLOSED', 'REPAIRED'].includes(selectedJobCard.status) && (
                <div className="space-y-3 border-t border-surface-2 pt-3">
                  <h4 className="font-semibold text-sm text-surface-900">Give Feedback for Service Received</h4>

                  <div>
                    <Label className="text-xs">Rating (1 to 5 Stars)</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-surface-1"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Good</option>
                      <option value={3}>3 Stars - Average</option>
                      <option value={2}>2 Stars - Poor</option>
                      <option value={1}>1 Star - Very Poor</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Comments / Feedback</Label>
                    <Textarea
                      placeholder="Share your experience with the service..."
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSendFeedback} disabled={feedbackSending} className="w-full" size="sm">
                    {feedbackSending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedJobCard(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomerPageShell>
  );
}
