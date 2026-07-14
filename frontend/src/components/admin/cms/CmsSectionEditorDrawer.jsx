import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CmsVisualForm } from './CmsVisualForm';

export function CmsSectionEditorDrawer({ open, onOpenChange, section, onSave, saving }) {
  const [content, setContent] = useState({});

  useEffect(() => {
    if (!open || !section) return;
    setContent(section.content ?? {});
  }, [open, section]);

  const handleSave = () => {
    const cleaned = { ...content };
    delete cleaned._info;
    onSave?.(cleaned);
  };

  if (!section) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit: ${section.sectionLabel || section.sectionKey}`}
      description="Update section content using the visual editor below."
      className="max-w-2xl"
    >
      <div className="space-y-4 py-2">
        <CmsVisualForm
          type="section"
          keyName={section.sectionKey}
          data={content}
          onChange={setContent}
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
