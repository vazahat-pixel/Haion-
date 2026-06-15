import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/utils/toast';

export function FormCard({ title, schema, defaultValues, fields, onSubmit, submitLabel = 'Save', onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  });

  const submit = async (data) => {
    try {
      await onSubmit(data);
      toast.success('Saved successfully');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'select' ? (
                  <Select id={field.name} {...register(field.name)} error={errors[field.name]}>
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea id={field.name} rows={field.rows || 3} {...register(field.name)} error={errors[field.name]} />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id={field.name}
                      type="checkbox"
                      className="h-4 w-4 rounded border-surface-3"
                      {...register(field.name)}
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">{field.hint || 'Enabled'}</span>
                  </div>
                ) : (
                  <Input id={field.name} type={field.type || 'text'} {...register(field.name)} error={errors[field.name]} />
                )}
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-[var(--color-danger)]">{errors[field.name].message}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : submitLabel}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
