import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function SocialLinksEditor({ links = [], onChange }) {
  const update = (index, field, value) => {
    const next = [...links];
    next[index] = { ...next[index], [field]: value };
    onChange?.(next);
  };

  const add = () => {
    onChange?.([...links, { platform: 'facebook', url: '#', icon: 'facebook', isVisible: true, order: links.length }]);
  };

  const remove = (index) => onChange?.(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Social Media Links</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Social Link
        </Button>
      </div>
      {links.map((link, index) => (
        <div key={index} className="rounded-lg border border-surface-3 p-3 grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Platform</Label>
            <Select
              value={link.platform ?? 'facebook'}
              onChange={(e) => {
                update(index, 'platform', e.target.value);
                update(index, 'icon', e.target.value);
              }}
            >
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input value={link.url ?? ''} onChange={(e) => update(index, 'url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch checked={link.isVisible !== false} onCheckedChange={(v) => update(index, 'isVisible', v)} />
              <Label className="text-xs">Visible</Label>
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
