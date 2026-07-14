import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Search, ShieldCheck, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { complaintsService } from '@/services/complaints.service';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

export default function PublicComplaintPage() {
  const [form, setForm] = useState({
    customer: '',
    phone: '',
    email: '',
    billNo: '',
    product: '',
    description: '',
  });
  const [warranty, setWarranty] = useState(null);
  const [validating, setValidating] = useState(false);
  const [ticketNo, setTicketNo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validateBill = async () => {
    if (!form.billNo.trim() && !form.phone.trim() && !form.email.trim()) {
      return toast.error('Enter bill number, phone, or email to validate');
    }
    setValidating(true);
    try {
      const result = form.billNo.trim()
        ? await complaintsService.validateBill({ billNo: form.billNo.trim() })
        : await complaintsService.lookupContact({
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
        });
      setWarranty(result);
      if (result.found === false && !result.eligible) {
        toast.warning(result.warrantyReason || 'No matching bill found');
      } else if (result.eligible) {
        toast.success('Warranty verified — active');
        setForm((prev) => ({
          ...prev,
          product: prev.product || result.product || result.warranty?.product || prev.product,
          customer: prev.customer || result.customerName || result.warranty?.customerName || prev.customer,
          billNo: prev.billNo || result.warranty?.billNo || prev.billNo,
        }));
      } else {
        toast.warning(result.warrantyReason || 'Warranty not eligible');
      }
    } catch {
      toast.error('Could not validate bill');
    } finally {
      setValidating(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await complaintsService.createPublic(form);
      setTicketNo(data.ticketNo);
      toast.success('Complaint submitted');
    } catch {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketNo) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-4 p-6 text-center">
          <Headphones className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="text-xl font-semibold">Complaint Registered</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Your ticket number is <strong className="font-mono">{ticketNo}</strong>. Our support team will contact you shortly.
          </p>
          <Button asChild variant="outline"><Link to={ROUTES.PUBLIC_WARRANTY_CHECK}>Check warranty</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Headphones className="h-5 w-5 text-brand-600" />
          Customer Support
        </CardTitle>
        <p className="text-sm text-[var(--color-text-secondary)]">Submit an issue — validate your bill before submitting</p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-surface-3 bg-surface-1 p-4">
          <Label>Bill / Invoice Number</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              placeholder="e.g. BILL-2024-0892"
              value={form.billNo}
              onChange={(e) => setForm({ ...form, billNo: e.target.value.toUpperCase() })}
              className="max-w-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={validateBill} disabled={validating}>
              <Search className="h-3.5 w-3.5" /> Validate
            </Button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            No bill number? Enter phone or email below and click Validate for fallback lookup.
          </p>
          {warranty && (
            <div className={cn(
              'mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm',
              warranty.eligible ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
            )}>
              {warranty.eligible ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <p className="font-medium">{warranty.eligible ? 'Warranty Active' : 'Warranty Check'}</p>
                <p className="text-xs opacity-90">{warranty.warrantyReason || warranty.reason}</p>
                {warranty.product && <p className="text-xs opacity-90">Product: {warranty.product}</p>}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Your Name</Label>
            <Input required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Product</Label>
            <Input required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          </div>
          <div>
            <Label>Describe the issue</Label>
            <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </Button>
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            <Link to={ROUTES.PUBLIC_WARRANTY_CHECK} className="text-brand-600 hover:underline">Check warranty status</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
