import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/utils/toast';

export function PrintSettingsForm({ onDirtyChange, formId = 'print-settings-form' }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings', 'print'], queryFn: settingsService.getPrint });

  const { register, handleSubmit, control, watch, formState: { isDirty } } = useForm({ values: data || undefined });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: settingsService.updatePrint,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'print'] });
      toast.success('Print settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  if (isLoading) return <LoadingState />;

  const isThermal = watch('printerType') === 'thermal';

  return (
    <form id={formId} onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Printer Setup</CardTitle></CardHeader>
        <CardContent className="space-y-3 p-4">
          <div>
            <Label>Printer Type</Label>
            <Select {...register('printerType')}>
              <option value="regular">Regular Printer (A4/A5)</option>
              <option value="thermal">Thermal Printer</option>
            </Select>
          </div>
          {!isThermal && (
            <>
              <div>
                <Label>Paper Size</Label>
                <Select {...register('paperSize')}>
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                </Select>
              </div>
              <div>
                <Label>Orientation</Label>
                <Select {...register('orientation')}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </Select>
              </div>
            </>
          )}
          {isThermal && (
            <div>
              <Label>Thermal Width (mm)</Label>
              <Select {...register('thermalWidthMm', { valueAsNumber: true })}>
                <option value={58}>58 mm</option>
                <option value={80}>80 mm</option>
              </Select>
            </div>
          )}
          <div>
            <Label>Number of Copies</Label>
            <Input type="number" min={1} max={5} {...register('copies', { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Margins (mm)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-4">
          <div><Label>Top</Label><Input type="number" {...register('marginTopMm', { valueAsNumber: true })} /></div>
          <div><Label>Bottom</Label><Input type="number" {...register('marginBottomMm', { valueAsNumber: true })} /></div>
          <div><Label>Left</Label><Input type="number" {...register('marginLeftMm', { valueAsNumber: true })} /></div>
          <div><Label>Right</Label><Input type="number" {...register('marginRightMm', { valueAsNumber: true })} /></div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="py-3"><CardTitle className="text-sm">Print Options</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3">
          {[
            ['printLogo', 'Print Logo'],
            ['printSignature', 'Print Signature'],
            ['printBankDetails', 'Print Bank Details'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-surface-3 px-3 py-2">
              <span className="text-xs">{label}</span>
              <Controller name={key} control={control} render={({ field }) => (
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              )} />
            </div>
          ))}
        </CardContent>
      </Card>
    </form>
  );
}
