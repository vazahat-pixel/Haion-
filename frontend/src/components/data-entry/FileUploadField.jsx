import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { uploadService } from '@/services/upload.service';
import { toast } from '@/utils/toast';

export function FileUploadField({ label, value, onChange, accept = 'image/*,.pdf' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.upload(file);
      onChange(result.url);
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Choose file'}
        </Button>
        {value && (
          <>
            <span className="truncate text-xs text-[var(--color-text-secondary)]">{value}</span>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange('')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
