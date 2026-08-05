/**
 * NumberTagInput.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tag-style input for entering multiple serial / controller / battery numbers.
 * - Press Enter or comma to add a tag
 * - Each tag can be deleted with ×
 * - Integrates with OcrScanButton for auto-fill
 * - Shows count vs expected quantity
 */
import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OcrScanButton } from './OcrScanButton';
import { cn } from '@/utils/cn';

/**
 * @param {Object} props
 * @param {string[]} props.value          - current list of tags
 * @param {function(string[])} props.onChange - called when tags change
 * @param {string} [props.placeholder]   - input placeholder text
 * @param {number} [props.expectedCount] - expected qty (shows counter)
 * @param {boolean} [props.disabled]
 * @param {string} [props.label]         - label for the tag group
 * @param {boolean} [props.showOcr]      - show OCR scan button (default true)
 */
export function NumberTagInput({
  value = [],
  onChange,
  placeholder = 'Type number, press Enter…',
  expectedCount,
  disabled = false,
  label = '',
  showOcr = true,
}) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  const addTag = (raw = '') => {
    const cleaned = raw.trim().toUpperCase();
    if (!cleaned) return;
    if (value.includes(cleaned)) return; // no duplicate
    onChange([...value, cleaned]);
    setInputVal('');
  };

  const removeTag = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length) {
      removeTag(value.length - 1);
    }
  };

  const handleOcr = (tokens) => {
    const next = [...value];
    tokens.forEach((t) => {
      const c = t.trim().toUpperCase();
      if (c && !next.includes(c)) next.push(c);
    });
    onChange(next);
    inputRef.current?.focus();
  };

  const isExact = expectedCount != null && value.length === expectedCount;
  const isOver = expectedCount != null && value.length > expectedCount;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-medium text-blue-800"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="ml-0.5 text-blue-500 hover:text-blue-700"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputVal && addTag(inputVal)}
            placeholder={value.length === 0 ? placeholder : '+ Add…'}
            className="min-w-[120px] flex-1 rounded border-0 bg-transparent p-0 text-xs font-mono outline-none placeholder:text-gray-400 focus:ring-0"
            disabled={disabled}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {showOcr && !disabled && (
          <OcrScanButton
            onExtracted={handleOcr}
            label={`Scan ${label || 'number'} with camera`}
          />
        )}
        {expectedCount != null && (
          <span
            className={cn(
              'text-xs font-medium',
              isExact ? 'text-green-600' : isOver ? 'text-red-600' : 'text-amber-600'
            )}
          >
            {value.length}/{expectedCount} {isExact ? '✓' : isOver ? '— too many!' : '— enter more'}
          </span>
        )}
      </div>
    </div>
  );
}
