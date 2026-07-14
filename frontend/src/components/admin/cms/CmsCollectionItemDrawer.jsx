import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CmsVisualForm } from './CmsVisualForm';
import { COLLECTION_LABELS } from './schemas/collectionSchemas';

export function CmsCollectionItemDrawer({ open, onOpenChange, item, collection, onSave, saving }) {
  const [order, setOrder] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    if (!open) return;
    setOrder(item?.order ?? 0);
    setIsVisible(item?.isVisible !== false);
    setData(item?.data ?? {});
  }, [open, item]);

  const handleSave = () => {
    onSave?.({ order, isVisible, data });
  };

  const collectionLabel = COLLECTION_LABELS[collection] || collection?.replace(/-/g, ' ');

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={item?.id ? `Edit ${collectionLabel}` : `Add ${collectionLabel}`}
      description="Fill in the fields below to update this item."
      className="max-w-2xl"
    >
      <div className="space-y-5 py-2">
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-surface-3 p-4 bg-surface-2/30">
          <div>
            <Label>Sort Order</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="mt-1" />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
            <Label>Visible on Website</Label>
          </div>
        </div>

        <CmsVisualForm
          type="collection"
          keyName={collection}
          data={data}
          onChange={setData}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-surface-3 sticky bottom-0 bg-surface-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
