import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';

export function CMSImageUploader({ value, onChange, label = 'Image' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await cmsAdminService.uploadImage(file);
      onChange?.({ url: result.url, alt: result.alt ?? '', publicId: result.publicId ?? '' });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {value?.url && (
        <img src={value.url} alt={value.alt || ''} className="h-24 w-auto rounded-lg border border-surface-3 object-cover" />
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          value={value?.url ?? ''}
          onChange={(e) => onChange?.({ ...value, url: e.target.value })}
          placeholder="/uploads/... or /image.webp"
        />
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
