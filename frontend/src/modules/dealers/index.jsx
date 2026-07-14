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
import { cn } from '@/utils/cn';
import { gstinValidator } from '@/validators/common.validators';

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
  fields: [
    ...dealerDetailFields,
    { key: 'gstExpiryDate', label: 'GST Expiry', format: 'date' },
  ],
});

const dealerOnboardSchema = z.object({
  name: z.string().min(2, 'Required'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  pincode: z.string().regex(/^\d{6}$/, '6-digit pincode').optional().or(z.literal('')),
  gstin: gstinValidator,
  gstExpiryDate: z.string().min(1, 'GST expiry date required'),
  contactName: z.string().min(2, 'Required'),
  contactPhone: z.string().min(10, 'Valid phone required'),
  contactEmail: z.string().email('Valid email required'),
  creditLimit: z.coerce.number().min(0),
});

const STEPS = ['Business Details', 'Documents & GST', 'Review & Submit'];

export function DealerOnboardingForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [documentUrl, setDocumentUrl] = useState('');
  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(dealerOnboardSchema),
    defaultValues: {
      name: '', city: '', state: '', pincode: '', gstin: '', gstExpiryDate: '',
      contactName: '', contactPhone: '', contactEmail: '', creditLimit: 300000,
    },
  });

  const values = watch();

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

  const nextStep = async () => {
    const fieldsByStep = [
      ['name', 'city', 'state', 'pincode', 'contactName', 'contactPhone', 'contactEmail', 'creditLimit'],
      ['gstin', 'gstExpiryDate'],
      [],
    ];
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async (data) => {
    if (!documentUrl) {
      toast.error('Upload GST / registration document before submitting');
      setStep(1);
      return;
    }
    const gstExpired = data.gstExpiryDate && new Date(data.gstExpiryDate) < new Date();
    if (gstExpired) {
      toast.warning('GST certificate is expired — dealer will be restricted from billing until renewed');
    }
    try {
      await dealersService.create({ ...data, documentUrl, status: 'PENDING_ONBOARDING' });
      toast.success('Dealer submitted for onboarding');
      navigate('/admin/dealers');
    } catch {
      toast.error('Failed to submit onboarding');
    }
  };

  const gstExpired = values.gstExpiryDate && new Date(values.gstExpiryDate) < new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dealer Onboarding</CardTitle>
        <div className="mt-3 flex gap-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                i === step ? 'bg-brand-100 text-brand-700' : i < step ? 'bg-green-100 text-green-700' : 'bg-surface-2 text-[var(--color-text-tertiary)]'
              )}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Business Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}</div>
              <div>
                <Label>Pincode</Label>
                <Input {...register('pincode')} placeholder="302001" onBlur={(e) => lookupPincode(e.target.value)} />
              </div>
              <div><Label>City</Label><Input {...register('city')} />{errors.city && <p className="text-xs text-[var(--color-danger)]">{errors.city.message}</p>}</div>
              <div><Label>State</Label><Input {...register('state')} />{errors.state && <p className="text-xs text-[var(--color-danger)]">{errors.state.message}</p>}</div>
              <div><Label>Contact Person</Label><Input {...register('contactName')} /></div>
              <div><Label>Phone</Label><Input type="tel" {...register('contactPhone')} /></div>
              <div><Label>Email</Label><Input type="email" {...register('contactEmail')} /></div>
              <div><Label>Credit Limit</Label><Input type="number" {...register('creditLimit')} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>GSTIN *</Label><Input {...register('gstin')} placeholder="ex: 29AABCU9603R1ZM" className="uppercase font-mono tracking-wider" maxLength={15} onChange={(e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15); setValue('gstin', e.target.value, { shouldValidate: true }); }} />{errors.gstin && <p className="text-xs text-[var(--color-danger)]">{errors.gstin.message}</p>}</div>
              <div>
                <Label>GST Certificate Expiry</Label>
                <Input type="date" {...register('gstExpiryDate')} />
                {errors.gstExpiryDate && <p className="text-xs text-[var(--color-danger)]">{errors.gstExpiryDate.message}</p>}
                {gstExpired && <p className="text-xs text-amber-600">Expired GST — billing will be blocked until renewed</p>}
              </div>
              <div className="sm:col-span-2">
                <FileUploadField label="GST / Registration Document" value={documentUrl} onChange={setDocumentUrl} accept="image/*,.pdf" />
              </div>
            </div>
          )}

          {step === 2 && (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[var(--color-text-secondary)]">Business</dt><dd className="font-medium">{values.name}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">Location</dt><dd>{values.city}, {values.state}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">GSTIN</dt><dd className="font-mono">{values.gstin}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">GST Expiry</dt><dd className={gstExpired ? 'text-amber-600 font-medium' : ''}>{values.gstExpiryDate || '—'}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">Contact</dt><dd>{values.contactName} · {values.contactPhone}</dd></div>
              <div><dt className="text-[var(--color-text-secondary)]">Document</dt><dd>{documentUrl ? 'Uploaded ✓' : 'Missing — go back to upload'}</dd></div>
            </dl>
          )}

          <div className="flex gap-2 pt-2">
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>Continue</Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit Onboarding'}</Button>
            )}
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/dealers')}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
