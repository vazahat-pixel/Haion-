import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CmsStringList({ label, value = [], onChange, placeholder = 'Enter value', helpText }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, val) => {
    const next = [...items];
    next[index] = val;
    onChange?.(next);
  };

  const addItem = () => onChange?.([...items, '']);
  const removeItem = (index) => onChange?.(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label>{label}</Label>
          {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
            />
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeItem(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
