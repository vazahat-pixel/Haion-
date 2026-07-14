import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Search, ShieldCheck } from 'lucide-react';
import { FormCard } from '@/components/data-entry/FormCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { toast } from '@/utils/toast';
import { z } from 'zod';

const schema = z.object({
  customerName: z.string().min(2, 'Customer name required'),
  product: z.string().min(2, 'Product required'),
  serialNo: z.string().optional(),
  billNo: z.string().optional(),
  issue: z.string().min(10, 'Describe the issue (min 10 chars)'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export function ServiceTicketCreateForm() {
  const navigate = useNavigate();
  const [lookupSerial, setLookupSerial] = useState('');
  const [lookupBill, setLookupBill] = useState('');
  const [warrantyResult, setWarrantyResult] = useState(null);

  const lookup = useMutation({
    mutationFn: () => serviceRequestsService.lookupWarranty({
      serialNo: lookupSerial || undefined,
      billNo: lookupBill || undefined,
    }),
    onSuccess: (data) => {
      setWarrantyResult(data);
      if (data.found && data.eligible) toast.success('Warranty validated');
      else if (data.found) toast.warning(data.reason || 'Warranty not eligible');
      else toast.error('No warranty found');
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> Warranty & Bill Lookup</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Serial number" value={lookupSerial} onChange={(e) => setLookupSerial(e.target.value)} />
          <Input placeholder="Bill number" value={lookupBill} onChange={(e) => setLookupBill(e.target.value)} />
        </div>
        <Button type="button" size="sm" className="mt-3" onClick={() => lookup.mutate()} disabled={lookup.isPending || (!lookupSerial && !lookupBill)}>
          <Search className="h-4 w-4" /> Validate
        </Button>
        {warrantyResult?.found && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={warrantyResult.eligible ? 'ACTIVE' : 'EXPIRED'} />
            <span>{warrantyResult.warranty?.product} · {warrantyResult.warranty?.billNo}</span>
          </div>
        )}
      </div>

      <FormCard
        title="New Service Ticket"
        schema={schema}
        defaultValues={{
          customerName: warrantyResult?.warranty?.customerName || '',
          product: warrantyResult?.warranty?.product || '',
          serialNo: lookupSerial || warrantyResult?.warranty?.serialNo || '',
          billNo: lookupBill || warrantyResult?.warranty?.billNo || '',
          issue: '',
          priority: 'MEDIUM',
        }}
        fields={[
          { name: 'customerName', label: 'Customer Name' },
          { name: 'product', label: 'Product' },
          { name: 'serialNo', label: 'Serial Number' },
          { name: 'billNo', label: 'Bill Number' },
          { name: 'priority', label: 'Priority', type: 'select', options: [
            { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' }, { value: 'CRITICAL', label: 'Critical' },
          ]},
          { name: 'issue', label: 'Issue Description', type: 'textarea', fullWidth: true, rows: 4 },
        ]}
        onSubmit={async (data) => {
          const ticket = await serviceRequestsService.create({
            ...data,
            warrantyId: warrantyResult?.warranty?.id,
          });
          toast.success('Service ticket created');
          navigate(`/service/tickets/${ticket.id}`);
        }}
        submitLabel="Create Ticket"
        onCancel={() => navigate('/service/tickets')}
      />
    </div>
  );
}
