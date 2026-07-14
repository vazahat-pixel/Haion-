import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
} from '@/components/ui/select';
import { CMSImageUploader } from './CMSImageUploader';
import { RichTextEditor } from './fields/RichTextEditor';
import { CmsRepeater } from './fields/CmsRepeater';
import { CmsKeyValueEditor } from './fields/CmsKeyValueEditor';
import { CmsStringList } from './fields/CmsStringList';
import { CmsTagsInput } from './fields/CmsTagsInput';
import { getNestedValue, updateFieldValue } from './utils/cmsFormUtils';

function ColorField({ label, value, onChange, helpText }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      <div className="flex items-center gap-3">
        <Input
          type="color"
          className="h-10 w-16 p-1 shrink-0"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </div>
  );
}

function ImageUrlField({ label, value, onChange, helpText }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {value && (
        <img src={value} alt="" className="h-20 w-auto rounded-lg border border-surface-3 object-cover" />
      )}
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="/image.webp or https://..." />
    </div>
  );
}

function renderField(field, data, onFieldChange) {
  const rawValue = field.key.includes('.') ? getNestedValue(data, field.key) : data?.[field.key];
  const setValue = (val) => onFieldChange(field.key, val);

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <Input
            value={rawValue ?? ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <Textarea
            rows={4}
            value={rawValue ?? ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );

    case 'richtext':
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <RichTextEditor value={rawValue ?? ''} onChange={setValue} placeholder={field.placeholder} />
        </div>
      );

    case 'image':
      return (
        <div key={field.key}>
          <CMSImageUploader
            label={field.label}
            value={rawValue ?? { url: '', alt: '', publicId: '' }}
            onChange={setValue}
          />
          {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
        </div>
      );

    case 'imageurl':
      return <ImageUrlField key={field.key} label={field.label} value={rawValue} onChange={setValue} helpText={field.helpText} />;

    case 'color':
      return <ColorField key={field.key} label={field.label} value={rawValue} onChange={setValue} helpText={field.helpText} />;

    case 'number':
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <Input
            type="number"
            value={rawValue ?? ''}
            onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center gap-3" key={field.key}>
          <Switch checked={!!rawValue} onCheckedChange={setValue} />
          <div>
            <Label>{field.label}</Label>
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
          <Select value={rawValue ?? ''} onChange={(e) => setValue(e.target.value)}>
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      );

    case 'repeater':
      return (
        <CmsRepeater
          key={field.key}
          label={field.label}
          items={rawValue ?? []}
          fields={field.fields ?? []}
          defaultItem={field.defaultItem}
          onChange={setValue}
          helpText={field.helpText}
        />
      );

    case 'group': {
      const groupValue = rawValue ?? {};
      return (
        <fieldset key={field.key} className="rounded-lg border border-surface-3 p-4 space-y-3">
          <legend className="text-sm font-semibold px-1">{field.label}</legend>
          {field.helpText && <p className="text-xs text-muted-foreground -mt-1">{field.helpText}</p>}
          <CmsFieldRenderer
            schema={field.fields ?? []}
            data={groupValue}
            onChange={(updated) => setValue(updated)}
          />
        </fieldset>
      );
    }

    case 'keyvalue':
      return (
        <CmsKeyValueEditor
          key={field.key}
          label={field.label}
          value={rawValue ?? {}}
          onChange={setValue}
          helpText={field.helpText}
        />
      );

    case 'stringlist':
      return (
        <CmsStringList
          key={field.key}
          label={field.label}
          value={rawValue ?? []}
          onChange={setValue}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'tags':
      return (
        <CmsTagsInput
          key={field.key}
          label={field.label}
          value={rawValue ?? []}
          onChange={setValue}
          placeholder={field.placeholder}
          helpText={field.helpText}
        />
      );

    case 'info':
      return (
        <div key={field.key} className="rounded-lg bg-surface-2 border border-surface-3 px-3 py-2">
          <p className="text-sm text-muted-foreground">{field.helpText || field.label}</p>
        </div>
      );

    default:
      return (
        <div className="space-y-2" key={field.key}>
          <Label>{field.label}</Label>
          <Input value={rawValue ?? ''} onChange={(e) => setValue(e.target.value)} />
        </div>
      );
  }
}

export function CmsFieldRenderer({ schema = [], data = {}, onChange }) {
  const handleFieldChange = (key, value) => {
    onChange?.(updateFieldValue(data, key, value));
  };

  if (!schema.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No editable fields defined for this content.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {schema.map((field) => renderField(field, data, handleFieldChange))}
    </div>
  );
}
