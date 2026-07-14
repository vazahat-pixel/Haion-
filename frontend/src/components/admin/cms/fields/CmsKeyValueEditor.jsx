import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CmsKeyValueEditor({ label, value = {}, onChange, helpText }) {
  const entries = Object.entries(value ?? {});

  const updateKey = (oldKey, newKey, val) => {
    const next = { ...value };
    if (oldKey !== newKey) delete next[oldKey];
    next[newKey] = val;
    onChange?.(next);
  };

  const removeEntry = (key) => {
    const next = { ...value };
    delete next[key];
    onChange?.(next);
  };

  const addEntry = () => {
    const key = `key_${Date.now()}`;
    onChange?.({ ...value, [key]: '' });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label>{label}</Label>
          {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
        </Button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">No entries. Click &quot;Add Row&quot; to add specifications.</p>
      )}
      <div className="space-y-2">
        {entries.map(([key, val]) => (
          <div key={key} className="flex gap-2 items-center">
            <Input
              value={key}
              onChange={(e) => updateKey(key, e.target.value, val)}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              value={val}
              onChange={(e) => updateKey(key, key, e.target.value)}
              placeholder="Value"
              className="flex-[2]"
            />
            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeEntry(key)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
