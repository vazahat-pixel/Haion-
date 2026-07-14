import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import { z } from 'zod';
import { FormCard } from '@/components/data-entry/FormCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { complaintsService } from '@/services/complaints.service';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

const complaintSchema = z.object({
  customer: z.string().min(2, 'Required'),
  billNo: z.string().optional(),
  product: z.string().min(2, 'Required'),
  priority: z.string().min(1, 'Required'),
  description: z.string().min(10, 'Describe the issue (min 10 chars)'),
});

export function ComplaintCreateForm() {
  const navigate = useNavigate();
  const [billNo, setBillNo] = useState('');
  const [warranty, setWarranty] = useState(null);
  const [checking, setChecking] = useState(false);

  const validateBill = async () => {
    if (!billNo.trim()) return toast.error('Enter a bill number');
    setChecking(true);
    try {
      const result = await complaintsService.validateBill({ billNo: billNo.trim() });
      setWarranty(result);
      if (result.eligible) toast.success('Warranty verified — active');
      else toast.warning(result.warrantyReason || 'Warranty not eligible');
    } catch {
      toast.error('Could not validate bill');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
        <Label htmlFor="bill-lookup">Bill Number (PRD lookup key)</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="bill-lookup"
            placeholder="e.g. BILL-2024-0892"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value.toUpperCase())}
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={validateBill} disabled={checking}>
            <Search className="h-3.5 w-3.5" /> Validate Warranty
          </Button>
        </div>
        {warranty && (
          <div className={cn(
            'mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm',
            warranty.eligible ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
          )}>
            {warranty.eligible ? <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" /> : <ShieldX className="h-4 w-4 shrink-0 mt-0.5" />}
            <div>
              <p className="font-medium">{warranty.warrantyReason}</p>
              {warranty.product && <p className="text-xs opacity-80">Product: {warranty.product}</p>}
              {warranty.customerName && <p className="text-xs opacity-80">Customer: {warranty.customerName}</p>}
            </div>
          </div>
        )}
      </div>

      <FormCard
        title="Register Complaint"
        schema={complaintSchema}
        defaultValues={{
          customer: warranty?.customerName || '',
          billNo: billNo || '',
          product: warranty?.product || '',
          priority: 'MEDIUM',
          description: '',
        }}
        fields={[
          { name: 'customer', label: 'Customer Name' },
          { name: 'billNo', label: 'Bill Number' },
          { name: 'product', label: 'Product', type: 'select', options: [
            { value: 'Industrial Motor 5HP', label: 'Industrial Motor 5HP' },
            { value: 'Control Panel XL', label: 'Control Panel XL' },
            { value: 'Hydraulic Pump', label: 'Hydraulic Pump' },
          ]},
          { name: 'priority', label: 'Priority', type: 'select', options: [
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'CRITICAL', label: 'Critical' },
          ]},
          { name: 'description', label: 'Issue Description', type: 'textarea', fullWidth: true, rows: 4 },
        ]}
        onSubmit={async (data) => {
          await complaintsService.create({ ...data, billNo: data.billNo || billNo });
          navigate('/service/complaints');
        }}
        submitLabel="Submit Complaint"
        onCancel={() => navigate('/service/complaints')}
      />
    </div>
  );
}
