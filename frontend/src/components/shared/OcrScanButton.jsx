/**
 * OcrScanButton.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Camera / gallery button that uploads an image and returns OCR-extracted text.
 * Used by dealers to auto-fill serial / controller / battery number fields.
 */
import { useRef, useState } from 'react';
import { Camera, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import client from '@/services/api/client';
import { toast } from '@/utils/toast';

/**
 * @param {Object} props
 * @param {function(string[])} props.onExtracted  - called with array of extracted tokens
 * @param {string} [props.label]                 - optional tooltip label
 * @param {boolean} [props.disabled]
 */
export function OcrScanButton({ onExtracted, label = 'Scan with camera', disabled = false }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [lastConfidence, setLastConfidence] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    setLoading(true);
    setLastConfidence(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await client.post('/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.normalized?.data || res.data?.data || res.data;

      if (!data?.text) {
        toast.warning('No text detected in image. Try a clearer photo.');
        return;
      }

      setLastConfidence(data.confidence);

      // Quality warning
      if (!data.qualityOk) {
        toast.warning(data.tip || 'Image quality is low — please use a clear, close-up photo.');
      } else {
        toast.success(`Text extracted! Confidence: ${data.confidence}%`);
      }

      onExtracted(data.tokens || [data.text]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'OCR scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload image for OCR"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={() => fileInputRef.current?.click()}
        title={label}
        className="gap-1.5 border-dashed border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-500"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {loading ? 'Scanning…' : 'OCR Scan'}
      </Button>
      {lastConfidence !== null && (
        <span
          title={`OCR confidence: ${lastConfidence}%`}
          className={`text-xs font-medium ${lastConfidence >= 60 ? 'text-green-600' : 'text-amber-600'}`}
        >
          {lastConfidence >= 60 ? (
            <CheckCircle2 className="inline h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="inline h-3.5 w-3.5" />
          )}{' '}
          {lastConfidence}%
        </span>
      )}
    </div>
  );
}
