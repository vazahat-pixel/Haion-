import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CmsFieldRenderer } from '../CmsFieldRenderer';
import { createEmptyFromFields } from '../utils/cmsFormUtils';

export function CmsRepeater({ label, items = [], fields = [], defaultItem, onChange, helpText }) {
  const addItem = () => {
    const empty = defaultItem ?? createEmptyFromFields(fields);
    onChange?.([...items, { ...empty, id: empty.id ?? `item-${Date.now()}` }]);
  };

  const updateItem = (index, updated) => {
    const next = [...items];
    next[index] = updated;
    onChange?.(next);
  };

  const removeItem = (index) => {
    onChange?.(items.filter((_, i) => i !== index));
  };

  const duplicateItem = (index) => {
    const copy = { ...items[index], id: `copy-${Date.now()}` };
    const next = [...items];
    next.splice(index + 1, 0, copy);
    onChange?.(next);
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange?.(next);
  };

  const getItemTitle = (item, index) => {
    return (
      item?.title ||
      item?.name ||
      item?.label ||
      item?.question ||
      item?.level ||
      item?.tag ||
      `Item ${index + 1}`
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {helpText && <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add New
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-surface-3 p-4 text-center">
          No items yet. Click &quot;Add New&quot; to create one.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item?.id ?? index}
            className="rounded-lg border border-surface-3 bg-surface-2/50 overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-surface-3 bg-surface-2 px-3 py-2">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{getItemTitle(item, index)}</span>
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateItem(index)} title="Duplicate">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(index)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="p-3 space-y-3">
              <CmsFieldRenderer
                schema={fields}
                data={item}
                onChange={(updated) => updateItem(index, updated)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
