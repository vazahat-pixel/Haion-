import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { InvoicePreview } from './InvoicePreview';
import { InvoiceThemeStore } from './InvoiceThemeStore';
import { resolveInvoiceLogo } from '@/constants/business';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';

export function InvoiceSettingsForm({ onDirtyChange, formId = 'invoice-settings-form' }) {
  const qc = useQueryClient();
  const [zoomLevel, setZoomLevel] = useState(0.55); // Default to fit screen vertically
  const { data: bundle, isLoading } = useQuery({
    queryKey: ['settings', 'profile-bundle'],
    queryFn: settingsService.getProfileBundle,
  });

  const invoice = bundle?.invoice;
  const business = bundle?.business;

  const { register, handleSubmit, control, watch, setValue, formState: { isDirty } } = useForm({
    values: invoice || undefined,
  });

  const mutation = useMutation({
    mutationFn: (payload) => settingsService.updateInvoice(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'profile-bundle'] });
      qc.invalidateQueries({ queryKey: ['settings', 'invoice'] });
      toast.success('Invoice settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const liveInvoice = watch();
  const [termsText, setTermsText] = useState('');

  useEffect(() => {
    if (invoice?.termsAndConditions) {
      setTermsText(invoice.termsAndConditions.join('\n'));
    }
  }, [invoice]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-surface-3 py-2.5">
          <CardTitle className="text-sm">Invoice Preview</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1.5 h-8">
                <Maximize2 className="h-3.5 w-3.5" /> Fullscreen Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-4 md:p-6" style={{ maxWidth: '980px' }}>
              <DialogHeader className="mb-3 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <DialogTitle>Full Invoice Preview</DialogTitle>
                <div className="flex gap-1 items-center mr-8 bg-surface-2 p-1 rounded-md border border-surface-3">
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-medium px-1">Zoom:</span>
                  <Button
                    type="button"
                    variant={zoomLevel === 0.55 ? 'brand' : 'ghost'}
                    size="sm"
                    onClick={() => setZoomLevel(0.55)}
                    className="h-6 px-2 text-[10px] py-0"
                  >
                    Fit Screen
                  </Button>
                  <Button
                    type="button"
                    variant={zoomLevel === 0.75 ? 'brand' : 'ghost'}
                    size="sm"
                    onClick={() => setZoomLevel(0.75)}
                    className="h-6 px-2 text-[10px] py-0"
                  >
                    75%
                  </Button>
                  <Button
                    type="button"
                    variant={zoomLevel === 1.0 ? 'brand' : 'ghost'}
                    size="sm"
                    onClick={() => setZoomLevel(1.0)}
                    className="h-6 px-2 text-[10px] py-0"
                  >
                    100%
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto overflow-x-auto bg-gradient-to-br from-slate-100 to-slate-200/80 p-4 md:p-6 rounded-lg flex items-start justify-center">
                <div
                  className="rounded-xl bg-white p-2 shadow-2xl transition-all duration-200 shrink-0"
                  style={{
                    zoom: zoomLevel,
                    width: '800px',
                  }}
                >
                  <InvoicePreview business={business} invoice={liveInvoice} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="overflow-x-auto bg-gradient-to-br from-slate-100 to-slate-200/80 p-6">
          <div className="mx-auto min-w-[680px] max-w-3xl rounded-xl bg-white p-2 shadow-xl shadow-slate-300/40">
            <InvoicePreview business={business} invoice={liveInvoice} />
          </div>
        </CardContent>
      </Card>

      <form id={formId} onSubmit={handleSubmit((d) => mutation.mutate({
        ...d,
        termsAndConditions: termsText.split('\n').map((s) => s.trim()).filter(Boolean),
      }))} className="space-y-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Company Logo</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-surface-3 bg-surface-2 p-1">
                <img
                  src={resolveInvoiceLogo(business?.logoUrl)}
                  alt="Invoice logo"
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Haion logo shows by default. Upload your own from <strong>Manage Business</strong> to replace it.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/business/manage">Upload / Change Logo</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Themes</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center justify-between rounded-md border border-surface-3 px-2.5 py-2">
              <div>
                <p className="text-xs font-medium">Auto festival theme</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Use this month&apos;s festival theme on bills automatically</p>
              </div>
              <Controller name="autoFestivalTheme" control={control} render={({ field }) => (
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              )} />
            </div>
            <Controller name="theme" control={control} render={({ field }) => (
              <InvoiceThemeStore value={field.value} onChange={field.onChange} />
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-3">
            <div><Label>Invoice Title</Label><Input {...register('invoiceTitle')} /></div>
            <div><Label>Copy Label</Label><Input {...register('copyLabel')} /></div>
            <div><Label>Due Date (days)</Label><Input type="number" {...register('dueDateDays', { valueAsNumber: true })} /></div>
            <div><Label>Notes</Label><Textarea rows={2} {...register('notes')} /></div>
            <div>
              <Label>Terms & Conditions (one per line)</Label>
              <Textarea rows={4} value={termsText} onChange={(e) => { setTermsText(e.target.value); setValue('termsAndConditions', e.target.value.split('\n'), { shouldDirty: true }); }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-3">
            {[
              ['showLogo', 'Show Logo'],
              ['showSignature', 'Show Signature'],
              ['showBankDetails', 'Show Bank Details'],
              ['showNotes', 'Show Notes'],
              ['showTerms', 'Show Terms'],
              ['showHsn', 'Show HSN'],
              ['showDiscount', 'Show Discount'],
              ['showTaxBreakdown', 'Show Tax Breakdown'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs">{label}</span>
                <Controller name={key} control={control} render={({ field }) => (
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                )} />
              </div>
            ))}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
