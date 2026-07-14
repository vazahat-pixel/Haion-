import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import { uploadService } from '@/services/upload.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import {
  INDIAN_STATES, STATE_CODES, BUSINESS_TYPES, INDUSTRY_TYPES, REGISTRATION_TYPES, assetUrl,
} from '@/constants/business';
import { gstinOptionalValidator } from '@/validators/common.validators';

const schema = z.object({
  businessName: z.string().min(2, 'Business name required'),
  phone: z.string().min(10),
  email: z.string().email(),
  billingAddress: z.string().min(5),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
  city: z.string().min(2),
  businessTypes: z.array(z.string()).min(1),
  industryType: z.string().min(1),
  registrationType: z.string().min(1),
  gstin: gstinOptionalValidator,
  pan: z.string().optional(),
  website: z.string().optional(),
  msmeNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  ifsc: z.string().optional(),
  accountHolderName: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
});

function ImageUpload({ label, value, onChange, hint }) {
  const inputRef = useRef(null);
  const upload = async (file) => {
    const res = await uploadService.upload(file);
    onChange(res.url);
    toast.success(`${label} uploaded`);
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-start gap-3">
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-surface-3 bg-surface-2">
          {value ? (
            <img src={assetUrl(value)} alt="" className="h-full w-full rounded-lg object-contain" />
          ) : (
            <Upload className="h-6 w-6 text-[var(--color-text-tertiary)]" />
          )}
        </div>
        <div className="space-y-1">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Upload</Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-[var(--color-danger)]" onClick={() => onChange(null)}>
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
          {hint && <p className="text-[10px] text-[var(--color-text-secondary)]">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function ManageBusinessForm({ onDirtyChange, formId = 'manage-business-form' }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings', 'business'], queryFn: settingsService.getBusiness });

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    values: data ? { ...data, businessTypes: data.businessTypes || ['Retailer'] } : undefined,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (payload) => settingsService.updateBusiness({
      ...payload,
      stateCode: STATE_CODES[payload.state] || data?.stateCode || '29',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'business'] });
      qc.invalidateQueries({ queryKey: ['settings', 'profile-bundle'] });
      toast.success('Business settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  if (isLoading) return <LoadingState />;

  const selectedTypes = watch('businessTypes') || [];
  const toggleType = (type) => {
    const next = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type];
    setValue('businessTypes', next.length ? next : [type], { shouldDirty: true });
  };

  return (
    <form id={formId} onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ImageUpload label="Company Logo" value={watch('logoUrl')} onChange={(v) => setValue('logoUrl', v, { shouldDirty: true })} />
          </div>
          <div className="lg:col-span-2">
            <Label>Business Name *</Label>
            <Input {...register('businessName')} />
            {errors.businessName && <p className="text-xs text-[var(--color-danger)]">{errors.businessName.message}</p>}
          </div>
          <div><Label>Company Phone Number</Label><Input type="tel" {...register('phone')} /></div>
          <div><Label>Company E-Mail</Label><Input type="email" {...register('email')} /></div>
          <div className="lg:col-span-2"><Label>Billing Address</Label><Textarea rows={3} {...register('billingAddress')} /></div>
          <div><Label>State</Label><Select {...register('state')}>{INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></div>
          <div><Label>Pincode</Label><Input {...register('pincode')} maxLength={6} /></div>
          <div><Label>City</Label><Input {...register('city')} /></div>
          <div>
            <Label>GSTIN</Label>
            <Input
              {...register('gstin')}
              className="uppercase font-mono tracking-wider"
              maxLength={15}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                setValue('gstin', e.target.value, { shouldValidate: true });
              }}
            />
            {errors.gstin && <p className="text-xs text-[var(--color-danger)]">{errors.gstin.message}</p>}
          </div>
          <div><Label>PAN</Label><Input {...register('pan')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Label>Business Type</Label>
            <p className="mb-2 text-[10px] text-[var(--color-text-secondary)]">Select multiple, if applicable</p>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)} className={`rounded-full border px-2.5 py-1 text-[11px] ${selectedTypes.includes(t) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-3'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div><Label>Industry Type</Label><Select {...register('industryType')}>{INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
          <div><Label>Business Registration Type</Label><Select {...register('registrationType')}>{REGISTRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
          <div><Label>Website</Label><Input {...register('website')} /></div>
          <div><Label>MSME Number</Label><Input {...register('msmeNumber')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <p className="lg:col-span-2 text-xs text-[var(--color-text-secondary)]">Note: Details below will be shown on your invoices.</p>
          <div className="lg:col-span-2">
            <ImageUpload label="Signature" value={watch('signatureUrl')} onChange={(v) => setValue('signatureUrl', v, { shouldDirty: true })} hint="Shown on invoice PDFs" />
          </div>
          <div><Label>Account Holder Name</Label><Input {...register('accountHolderName')} /></div>
          <div><Label>Bank Name</Label><Input {...register('bankName')} /></div>
          <div><Label>Account Number</Label><Input {...register('bankAccount')} /></div>
          <div><Label>IFSC Code</Label><Input {...register('ifsc')} /></div>
        </CardContent>
      </Card>
    </form>
  );
}
