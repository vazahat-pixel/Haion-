import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/utils/toast';

const caReportsSchema = z.object({
  enabled: z.boolean(),
  caName: z.string(),
  caWhatsapp: z.string(),
  caEmail: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.enabled) return;
  if (!data.caName?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CA Name is required', path: ['caName'] });
  }
  const digits = String(data.caWhatsapp || '').replace(/\D/g, '');
  if (digits.length < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid 10-digit WhatsApp number', path: ['caWhatsapp'] });
  }
  if (data.caEmail?.trim() && !z.string().email().safeParse(data.caEmail.trim()).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid email address', path: ['caEmail'] });
  }
});

function getNextReportDateLabel() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const CaReportsSharingForm = forwardRef(function CaReportsSharingForm({ onDirtyChange }, ref) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'ca-reports'],
    queryFn: settingsService.getCaReports,
  });

  const defaultValues = {
    enabled: Boolean(data?.enabled),
    caName: data?.caName || '',
    caWhatsapp: data?.caWhatsapp || '',
    caEmail: data?.caEmail || '',
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(caReportsSchema),
    defaultValues,
    values: isLoading ? undefined : defaultValues,
  });

  const enabled = watch('enabled');

  const onSubmit = useCallback(async (formData) => {
    try {
      await settingsService.updateCaReports({
        enabled: Boolean(formData.enabled),
        caName: formData.caName?.trim() || '',
        caWhatsapp: String(formData.caWhatsapp || '').replace(/\D/g, ''),
        caEmail: formData.caEmail?.trim() || '',
      });
      await qc.invalidateQueries({ queryKey: ['settings', 'ca-reports'] });
      reset({
        enabled: Boolean(formData.enabled),
        caName: formData.caName?.trim() || '',
        caWhatsapp: String(formData.caWhatsapp || '').replace(/\D/g, ''),
        caEmail: formData.caEmail?.trim() || '',
      });
      toast.success('CA reports sharing settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }, [qc, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useImperativeHandle(ref, () => ({
    reset: () => reset(defaultValues),
    submit: handleSubmit(onSubmit),
  }), [defaultValues, handleSubmit, onSubmit, reset]);

  if (isLoading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Settings</h2>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Enable Sharing</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              Control the business reports sharing with your CA
            </p>
          </div>
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </CardContent>
      </Card>

      {enabled && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">CA Details</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="caName">
                  CA Name <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Input
                  id="caName"
                  placeholder="Ex: Ankit Mishra"
                  error={errors.caName}
                  {...register('caName')}
                />
                {errors.caName && (
                  <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.caName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="caWhatsapp">
                  CA WhatsApp Number <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Input
                  id="caWhatsapp"
                  type="tel"
                  placeholder="Ex: 9876543210"
                  error={errors.caWhatsapp}
                  {...register('caWhatsapp')}
                />
                {errors.caWhatsapp && (
                  <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.caWhatsapp.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="caEmail">CA Email ID (optional)</Label>
                <Input
                  id="caEmail"
                  type="email"
                  placeholder="Ex: abc@gmail.com"
                  error={errors.caEmail}
                  {...register('caEmail')}
                />
                {errors.caEmail && (
                  <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.caEmail.message}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)]">
              Note: GSTR Reports will be automatically sent to CA on 1st of every month
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {enabled
            ? `Automatic report sending will be scheduled for the 1st of every month starting from ${getNextReportDateLabel()}.`
            : 'Enable sharing and save CA details to schedule automatic GSTR report delivery on the 1st of every month.'}
        </p>
      </div>
    </form>
  );
});
