import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/utils/toast';

export function DrawerForm({
  open,
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  fields,
  onSubmit,
  submitLabel = 'Save',
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  });

  const submit = async (data) => {
    try {
      await onSubmit(data);
      toast.success('Saved successfully');
      reset(defaultValues);
      onOpenChange?.(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save';
      toast.error(msg);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            {field.type === 'select' ? (
              <Select id={field.name} {...register(field.name)} error={errors[field.name]}>
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : field.type === 'textarea' ? (
              <Textarea id={field.name} rows={field.rows || 3} {...register(field.name)} error={errors[field.name]} />
            ) : (
              <Input id={field.name} type={field.type || 'text'} readOnly={field.readOnly} disabled={field.readOnly} {...register(field.name)} error={errors[field.name]} />
            )}
            {errors[field.name] && (
              <p className="mt-1 text-xs text-[var(--color-danger)]">{errors[field.name].message}</p>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  );
}
