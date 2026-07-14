import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';

const NAV_URL_OPTIONS = [
  { value: '#', label: 'Home (scroll)' },
  { value: 'store', label: 'Store Page' },
  { value: 'about', label: 'About Us' },
  { value: 'appliances', label: 'Home Appliances' },
  { value: 'inverter', label: 'Inverter' },
  { value: '#features', label: 'Features Section' },
  { value: '#categories', label: 'Categories Section' },
  { value: '#contact', label: 'Contact Section' },
  { value: '#faq', label: 'FAQ Section' },
  { value: '#download', label: 'Download Section' },
  { value: 'service-safeguard', label: 'Safeguard Service' },
  { value: 'service-scooter', label: 'EV Scooter Service' },
];

export function NavbarLinksEditor({ links = [], onChange }) {
  const updateLink = (index, field, value) => {
    const next = [...links];
    next[index] = { ...next[index], [field]: value };
    onChange?.(next);
  };

  const addLink = () => {
    onChange?.([...links, { label: 'New Link', url: '#', order: links.length, isVisible: true }]);
  };

  const removeLink = (index) => onChange?.(links.filter((_, i) => i !== index));

  const moveLink = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    onChange?.(next.map((l, i) => ({ ...l, order: i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Navigation Links</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLink}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
        </Button>
      </div>
      {links.map((link, index) => (
        <div key={index} className="rounded-lg border border-surface-3 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
            <Input
              value={link.label ?? ''}
              onChange={(e) => updateLink(index, 'label', e.target.value)}
              placeholder="Link Label"
              className="flex-1"
            />
            <div className="flex gap-0.5">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLink(index, -1)} disabled={index === 0}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeLink(index)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 pl-8">
            <div className="space-y-1">
              <Label className="text-xs">Destination</Label>
              <Select value={link.url ?? '#'} onChange={(e) => updateLink(index, 'url', e.target.value)}>
                {NAV_URL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Switch checked={link.isVisible !== false} onCheckedChange={(v) => updateLink(index, 'isVisible', v)} />
              <Label className="text-xs">Visible</Label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
