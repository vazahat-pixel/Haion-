import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { insuranceService } from '@/services/insurance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';

const initialForm = {
  customerName: '',
  customerPhone: '',
  product: '',
  serialNo: '',
  policyNo: '',
  incidentDate: '',
  claimAmount: '',
  description: '',
};

export default function DealerInsuranceClaimNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const create = useMutation({
    mutationFn: () => insuranceService.createClaim({
      ...form,
      claimAmount: Number(form.claimAmount),
    }),
    onSuccess: (data) => {
      toast.success('Insurance claim submitted');
      qc.invalidateQueries({ queryKey: queryKeys.insuranceClaims.all });
      navigate(`/dealer/insurance/claims/${data.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to submit claim'),
  });

  const isValid = form.customerName && form.product && Number(form.claimAmount) > 0;

  return (
    <PageShell
      title="New Insurance Claim"
      subtitle="Submit a customer's insurance claim for admin review"
      back={{ label: 'Insurance', href: '/dealer/insurance' }}
    >
      <Card className="max-w-2xl">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <Label>Customer Name *</Label>
            <Input value={form.customerName} onChange={set('customerName')} placeholder="Customer full name" />
          </div>
          <div>
            <Label>Customer Phone</Label>
            <Input value={form.customerPhone} onChange={set('customerPhone')} placeholder="Optional" />
          </div>
          <div>
            <Label>Product *</Label>
            <Input value={form.product} onChange={set('product')} placeholder="e.g. Solar Inverter 5kVA" />
          </div>
          <div>
            <Label>Serial No</Label>
            <Input value={form.serialNo} onChange={set('serialNo')} placeholder="Optional" />
          </div>
          <div>
            <Label>Policy No</Label>
            <Input value={form.policyNo} onChange={set('policyNo')} placeholder="Optional" />
          </div>
          <div>
            <Label>Incident Date</Label>
            <Input type="date" value={form.incidentDate} onChange={set('incidentDate')} />
          </div>
          <div>
            <Label>Claim Amount *</Label>
            <Input type="number" min="1" value={form.claimAmount} onChange={set('claimAmount')} placeholder="e.g. 15000" />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Describe the issue / reason for the claim" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate('/dealer/insurance')}>Cancel</Button>
            <Button disabled={!isValid || create.isPending} onClick={() => create.mutate()}>
              <Send className="h-4 w-4" /> Submit Claim
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
