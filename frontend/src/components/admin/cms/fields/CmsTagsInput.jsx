import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CmsTagsInput({ label, value = [], onChange, placeholder = 'Add tag', helpText }) {
  const tags = Array.isArray(value) ? value : [];
  const [input, setInput] = useState('');

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange?.([...tags, trimmed]);
    setInput('');
  };

  const removeTag = (tag) => onChange?.(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-surface-3 px-2.5 py-0.5 text-xs">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-red-500">
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(input);
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={() => addTag(input)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}