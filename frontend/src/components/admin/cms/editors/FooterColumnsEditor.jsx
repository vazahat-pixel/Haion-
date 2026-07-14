import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FooterColumnsEditor({ columns = [], onChange }) {
  const updateColumn = (colIndex, field, value) => {
    const next = [...columns];
    next[colIndex] = { ...next[colIndex], [field]: value };
    onChange?.(next);
  };

  const updateLink = (colIndex, linkIndex, field, value) => {
    const next = [...columns];
    const links = [...(next[colIndex].links ?? [])];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    next[colIndex] = { ...next[colIndex], links };
    onChange?.(next);
  };

  const addColumn = () => onChange?.([...columns, { heading: 'New Column', links: [] }]);
  const removeColumn = (i) => onChange?.(columns.filter((_, idx) => idx !== i));

  const addLink = (colIndex) => {
    const next = [...columns];
    next[colIndex] = {
      ...next[colIndex],
      links: [...(next[colIndex].links ?? []), { label: '', url: '' }],
    };
    onChange?.(next);
  };

  const removeLink = (colIndex, linkIndex) => {
    const next = [...columns];
    next[colIndex] = {
      ...next[colIndex],
      links: next[colIndex].links.filter((_, i) => i !== linkIndex),
    };
    onChange?.(next);
  };

  const moveColumn = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    onChange?.(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Footer Columns</Label>
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Column
        </Button>
      </div>
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="rounded-lg border border-surface-3 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={col.heading ?? ''}
              onChange={(e) => updateColumn(colIndex, 'heading', e.target.value)}
              placeholder="Column Heading"
              className="flex-1 font-medium"
            />
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveColumn(colIndex, -1)} disabled={colIndex === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveColumn(colIndex, 1)} disabled={colIndex === columns.length - 1}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeColumn(colIndex)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2 pl-2">
            {(col.links ?? []).map((link, linkIndex) => (
              <div key={linkIndex} className="flex gap-2">
                <Input
                  value={link.label ?? ''}
                  onChange={(e) => updateLink(colIndex, linkIndex, 'label', e.target.value)}
                  placeholder="Link Label"
                  className="flex-1"
                />
                <Input
                  value={link.url ?? ''}
                  onChange={(e) => updateLink(colIndex, linkIndex, 'url', e.target.value)}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeLink(colIndex, linkIndex)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addLink(colIndex)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
