import { useState } from 'react';
import { queryKeys } from '@/services/api/queryKeys';
import { dealersService } from '@/services/dealers.service';
import { addressService } from '@/services/address.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { dealerColumns, dealerDetailFields } from './columns.config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploadField } from '@/components/data-entry/FileUploadField';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { DealersEmptyIllustration } from '@/components/illustrations';

export const DealerTable = createListTable({
  service: dealersService,
  queryKey: queryKeys.dealers.list,
  columns: dealerColumns,
  basePath: '/admin/dealers',
  searchKeys: ['name', 'code', 'city', 'gstin'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING_ONBOARDING', label: 'Pending' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ],
  emptyTitle: 'No dealers',
  emptyDescription: 'Onboard your first dealer to start the network.',
  emptyIllustration: DealersEmptyIllustration,
  searchPlaceholder: 'Search dealers…',
});

export const DealerDetail = createDetailView({
  service: dealersService,
  queryKey: queryKeys.dealers.detail,
  fields: dealerDetailFields,
});

const dealerOnboardSchema = z.object({
  name: z.string().min(2, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode').optional().or(z.literal('')),
  gstin: z.string().min(15, 'Valid GSTIN required').max(15),
  contactName: z.string().min(2, 'Required'),
  contactPhone: z.string().min(10, 'Valid phone required'),
  contactEmail: z.string().email('Valid email required'),
  creditLimit: z.coerce.number().min(0),
});

export function DealerOnboardingForm() {
  const navigate = useNavigate();
  const [documentUrl, setDocumentUrl] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(dealerOnboardSchema),
    defaultValues: { name: '', city: '', state: '', pincode: '', gstin: '', contactName: '', contactPhone: '', contactEmail: '', creditLimit: 300000 },
  });

  const lookupPincode = async (pin) => {
    if (!/^\d{6}$/.test(pin)) return;
    try {
      const data = await addressService.lookupPincode(pin);
      setValue('city', data.city);
      setValue('state', data.state);
      toast.success(`Found ${data.city}, ${data.state}`);
    } catch {
      toast.error('Pincode not found');
    }
  };

  const submit = async (data) => {
    try {
      await dealersService.create({ ...data, documentUrl: documentUrl || undefined });
      toast.success('Dealer submitted for onboarding');
      navigate('/admin/dealers');
    } catch {
      toast.error('Failed to submit onboarding');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Dealer Onboarding</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Business Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}</div>
            <div>
              <Label>Pincode</Label>
              <Input {...register('pincode')} placeholder="302001" onBlur={(e) => lookupPincode(e.target.value)} />
            </div>
            <div><Label>City</Label><Input {...register('city')} />{errors.city && <p className="text-xs text-[var(--color-danger)]">{errors.city.message}</p>}</div>
            <div><Label>State</Label><Input {...register('state')} />{errors.state && <p className="text-xs text-[var(--color-danger)]">{errors.state.message}</p>}</div>
            <div><Label>GSTIN</Label><Input {...register('gstin')} />{errors.gstin && <p className="text-xs text-[var(--color-danger)]">{errors.gstin.message}</p>}</div>
            <div><Label>Contact Person</Label><Input {...register('contactName')} /></div>
            <div><Label>Phone</Label><Input type="tel" {...register('contactPhone')} /></div>
            <div><Label>Email</Label><Input type="email" {...register('contactEmail')} /></div>
            <div><Label>Credit Limit</Label><Input type="number" {...register('creditLimit')} /></div>
            <div className="sm:col-span-2">
              <FileUploadField label="GST / Registration Document" value={documentUrl} onChange={setDocumentUrl} accept="image/*,.pdf" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit Onboarding'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/dealers')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
