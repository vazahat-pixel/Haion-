import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EvDropdownEditor({ config = {}, onChange }) {
  const items = config.items ?? [];

  const updateItem = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange?.({ ...config, items: next });
  };

  const addItem = () => onChange?.({ ...config, items: [...items, { label: '', id: '' }] });
  const removeItem = (i) => onChange?.({ ...config, items: items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3 rounded-lg border border-surface-3 p-4">
      <Label>EV Dropdown Menu</Label>
      <div className="space-y-2">
        <Label className="text-xs">Dropdown Label</Label>
        <Input
          value={config.label ?? 'EV'}
          onChange={(e) => onChange?.({ ...config, label: e.target.value })}
          placeholder="EV"
        />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input value={item.label ?? ''} onChange={(e) => updateItem(i, 'label', e.target.value)} placeholder="Label" className="flex-1" />
            <Input value={item.id ?? ''} onChange={(e) => updateItem(i, 'id', e.target.value)} placeholder="ID (scooter)" className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => removeItem(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add EV Service Link
        </Button>
      </div>
    </div>
  );
}
