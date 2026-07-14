import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';
import { notifyCmsUpdated } from '@/utils/cmsSync';
import { CMSImageUploader } from '@/components/admin/cms/CMSImageUploader';
import { NavbarLinksEditor } from '@/components/admin/cms/editors/NavbarLinksEditor';
import { FooterColumnsEditor } from '@/components/admin/cms/editors/FooterColumnsEditor';
import { SocialLinksEditor } from '@/components/admin/cms/editors/SocialLinksEditor';
import { EvDropdownEditor } from '@/components/admin/cms/editors/EvDropdownEditor';
import { CmsTagsInput } from '@/components/admin/cms/fields/CmsTagsInput';
import { CmsStringList } from '@/components/admin/cms/fields/CmsStringList';

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-40 shrink-0">{label}</Label>
      <Input type="color" className="h-10 w-16 p-1 shrink-0" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="flex-1" />
    </div>
  );
}

export default function CmsSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['cms', 'admin', 'settings'],
    queryFn: cmsAdminService.getSettings,
  });
  const [form, setForm] = useState(null);

  const settings = form ?? data;

  const saveMutation = useMutation({
    mutationFn: (payload) => cmsAdminService.updateSettings(payload),
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const update = (path, value) => {
    setForm((prev) => {
      const base = structuredClone(prev ?? data);
      const keys = path.split('.');
      let cur = base;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return base;
    });
  };

  if (isLoading && !settings) {
    return <PageShell title="Website Settings" subtitle="Loading…" />;
  }

  return (
    <PageShell
      title="Website Settings"
      subtitle="Manage global site configuration — no code required"
      actions={
        <Button onClick={() => saveMutation.mutate(settings)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      }
    >
      <Tabs defaultValue="general" className="max-w-4xl">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="navbar">Navbar</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="commerce">Commerce</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Company Information</h2>
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={settings?.siteName ?? ''} onChange={(e) => update('siteName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={settings?.tagline ?? ''} onChange={(e) => update('tagline', e.target.value)} />
            </div>
            <CMSImageUploader
              label="Logo"
              value={settings?.logo ?? { url: '', alt: '', publicId: '' }}
              onChange={(v) => update('logo', v)}
            />
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input value={settings?.favicon?.url ?? ''} onChange={(e) => update('favicon.url', e.target.value)} placeholder="/favicon.svg" />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Contact Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={settings?.contact?.email ?? ''} onChange={(e) => update('contact.email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={settings?.contact?.phone ?? ''} onChange={(e) => update('contact.phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={settings?.contact?.whatsapp ?? ''} onChange={(e) => update('contact.whatsapp', e.target.value)} placeholder="+91..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={settings?.contact?.address ?? ''} onChange={(e) => update('contact.address', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Google Maps Embed URL</Label>
              <Input value={settings?.contact?.mapEmbedUrl ?? ''} onChange={(e) => update('contact.mapEmbedUrl', e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Social Media</h2>
            <SocialLinksEditor
              links={settings?.socialLinks ?? []}
              onChange={(v) => update('socialLinks', v)}
            />
          </section>
        </TabsContent>

        {/* ── Navbar ── */}
        <TabsContent value="navbar" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Navbar Settings</h2>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={settings?.navbar?.isSticky !== false} onCheckedChange={(v) => update('navbar.isSticky', v)} />
                <Label>Sticky Navbar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={settings?.navbar?.showLogo !== false} onCheckedChange={(v) => update('navbar.showLogo', v)} />
                <Label>Show Logo</Label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Download App Button Text</Label>
                <Input value={settings?.navbar?.ctaButton?.label ?? ''} onChange={(e) => update('navbar.ctaButton.label', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Download App Button URL</Label>
                <Input value={settings?.navbar?.ctaButton?.url ?? ''} onChange={(e) => update('navbar.ctaButton.url', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Careers Button Text</Label>
                <Input value={settings?.navbar?.careersButton?.label ?? 'Work With Us'} onChange={(e) => update('navbar.careersButton.label', e.target.value)} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={settings?.navbar?.ctaButton?.isVisible !== false} onCheckedChange={(v) => update('navbar.ctaButton.isVisible', v)} />
                <Label>Show CTA Button</Label>
              </div>
            </div>
            <NavbarLinksEditor
              links={settings?.navbar?.links ?? []}
              onChange={(v) => update('navbar.links', v)}
            />
            <EvDropdownEditor
              config={settings?.navbar?.evDropdown ?? {}}
              onChange={(v) => update('navbar.evDropdown', v)}
            />
            <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-surface-3 p-4">
              <div className="space-y-2">
                <Label>Safeguard Nav Label</Label>
                <Input
                  value={settings?.navbar?.safeguardLink?.label ?? ''}
                  onChange={(e) => update('navbar.safeguardLink.label', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Safeguard Service ID</Label>
                <Input
                  value={settings?.navbar?.safeguardLink?.url ?? 'service-safeguard'}
                  onChange={(e) => update('navbar.safeguardLink.url', e.target.value)}
                  placeholder="service-safeguard"
                />
              </div>
            </div>
          </section>
        </TabsContent>

        {/* ── Footer ── */}
        <TabsContent value="footer" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Footer</h2>
            <div className="space-y-2">
              <Label>Copyright Text</Label>
              <Input value={settings?.footer?.copyrightText ?? ''} onChange={(e) => update('footer.copyrightText', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={settings?.footer?.showSocialLinks !== false} onCheckedChange={(v) => update('footer.showSocialLinks', v)} />
              <Label>Show Social Links in Footer</Label>
            </div>
            <FooterColumnsEditor
              columns={settings?.footer?.columns ?? []}
              onChange={(v) => update('footer.columns', v)}
            />
          </section>
        </TabsContent>

        {/* ── Theme ── */}
        <TabsContent value="theme" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Theme & Colors</h2>
            <ColorPicker label="Primary Color" value={settings?.theme?.primaryColor} onChange={(v) => update('theme.primaryColor', v)} />
            <ColorPicker label="Secondary Color" value={settings?.theme?.secondaryColor} onChange={(v) => update('theme.secondaryColor', v)} />
            <ColorPicker label="Accent Color" value={settings?.theme?.accentColor} onChange={(v) => update('theme.accentColor', v)} />
            <ColorPicker label="Background Color" value={settings?.theme?.backgroundColor} onChange={(v) => update('theme.backgroundColor', v)} />
            <ColorPicker label="Text Color" value={settings?.theme?.textColor} onChange={(v) => update('theme.textColor', v)} />
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Input value={settings?.theme?.fontFamily ?? ''} onChange={(e) => update('theme.fontFamily', e.target.value)} placeholder="Poppins" />
            </div>
            <div className="space-y-2">
              <Label>Heading Font Family</Label>
              <Input value={settings?.theme?.headingFontFamily ?? ''} onChange={(e) => update('theme.headingFontFamily', e.target.value)} placeholder="Poppins" />
            </div>
            <div className="space-y-2">
              <Label>Base Font Size</Label>
              <Input value={settings?.theme?.baseFontSize ?? '16px'} onChange={(e) => update('theme.baseFontSize', e.target.value)} />
            </div>
          </section>
        </TabsContent>

        {/* ── SEO ── */}
        <TabsContent value="seo" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">SEO Defaults</h2>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={settings?.seo?.metaTitle ?? ''} onChange={(e) => update('seo.metaTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={settings?.seo?.metaDescription ?? ''} onChange={(e) => update('seo.metaDescription', e.target.value)} rows={3} />
            </div>
            <CmsTagsInput
              label="Meta Keywords"
              value={settings?.seo?.metaKeywords ?? []}
              onChange={(v) => update('seo.metaKeywords', v)}
              placeholder="Add keyword"
            />
            <CMSImageUploader
              label="Open Graph Image"
              value={settings?.seo?.ogImage ?? { url: '', alt: '', publicId: '' }}
              onChange={(v) => update('seo.ogImage', v)}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Analytics & Tracking</h2>
            <div className="space-y-2">
              <Label>Google Analytics ID</Label>
              <Input value={settings?.analytics?.googleAnalyticsId ?? ''} onChange={(e) => update('analytics.googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Hotjar ID</Label>
              <Input value={settings?.analytics?.hotjarId ?? ''} onChange={(e) => update('analytics.hotjarId', e.target.value)} />
            </div>
          </section>
        </TabsContent>

        {/* ── Commerce ── */}
        <TabsContent value="commerce" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Checkout & Cart</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Merchant Name</Label>
                <Input value={settings?.checkout?.merchantName ?? ''} onChange={(e) => update('checkout.merchantName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Order ID Prefix</Label>
                <Input value={settings?.checkout?.orderIdPrefix ?? 'HAION-'} onChange={(e) => update('checkout.orderIdPrefix', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>COD Label</Label>
                <Input value={settings?.checkout?.codLabel ?? 'Cash on Delivery'} onChange={(e) => update('checkout.codLabel', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Online Payment Label</Label>
                <Input value={settings?.checkout?.onlineLabel ?? 'Pay Online'} onChange={(e) => update('checkout.onlineLabel', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cart Title</Label>
              <Input value={settings?.cart?.title ?? 'Your Cart'} onChange={(e) => update('cart.title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empty Cart Title</Label>
              <Input value={settings?.cart?.emptyTitle ?? ''} onChange={(e) => update('cart.emptyTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Empty Cart Message</Label>
              <Textarea value={settings?.cart?.emptyBody ?? ''} onChange={(e) => update('cart.emptyBody', e.target.value)} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Lead Popup</h2>
            <div className="flex items-center gap-2">
              <Switch checked={settings?.leadPopup?.enabled !== false} onCheckedChange={(v) => update('leadPopup.enabled', v)} />
              <Label>Enable Lead Popup</Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Popup Delay (milliseconds)</Label>
                <Input type="number" value={settings?.leadPopup?.delayMs ?? 2500} onChange={(e) => update('leadPopup.delayMs', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Popup Title</Label>
                <Input value={settings?.leadPopup?.title ?? ''} onChange={(e) => update('leadPopup.title', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Popup Subtitle</Label>
              <Textarea value={settings?.leadPopup?.subtitle ?? ''} onChange={(e) => update('leadPopup.subtitle', e.target.value)} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">App Download Links</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>iOS App Store URL</Label>
                <Input value={settings?.appLinks?.iosUrl ?? ''} onChange={(e) => update('appLinks.iosUrl', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Google Play Store URL</Label>
                <Input value={settings?.appLinks?.androidUrl ?? ''} onChange={(e) => update('appLinks.androidUrl', e.target.value)} />
              </div>
            </div>
          </section>
        </TabsContent>

        {/* ── Advanced ── */}
        <TabsContent value="advanced" className="space-y-6">
          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Maintenance Mode</h2>
              <Switch
                checked={settings?.maintenanceMode?.isEnabled ?? false}
                onCheckedChange={(v) => update('maintenanceMode.isEnabled', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea
                value={settings?.maintenanceMode?.message ?? ''}
                onChange={(e) => update('maintenanceMode.message', e.target.value)}
                placeholder="Message shown to visitors when maintenance mode is on"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Guest Profile Defaults</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Guest Name</Label>
                <Input value={settings?.profile?.guestName ?? ''} onChange={(e) => update('profile.guestName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guest Phone</Label>
                <Input value={settings?.profile?.guestPhone ?? ''} onChange={(e) => update('profile.guestPhone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Guest Email</Label>
                <Input value={settings?.profile?.guestEmail ?? ''} onChange={(e) => update('profile.guestEmail', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Member Tier Badge</Label>
                <Input value={settings?.profile?.memberTier ?? ''} onChange={(e) => update('profile.memberTier', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Order Tracking</h2>
            <div className="space-y-2">
              <Label>Estimated Delivery Text</Label>
              <Input value={settings?.orderTracking?.estimatedDelivery ?? ''} onChange={(e) => update('orderTracking.estimatedDelivery', e.target.value)} />
            </div>
            <CmsStringList
              label="Tracking Step Labels"
              value={(settings?.orderTracking?.steps ?? []).map((s) => s.label)}
              onChange={(labels) => {
                const steps = labels.map((label, i) => ({
                  key: ['placed', 'confirmed', 'shipped', 'delivered'][i] ?? `step-${i}`,
                  label,
                }));
                update('orderTracking.steps', steps);
              }}
              placeholder="Step label"
            />
          </section>

          <section className="space-y-4 rounded-xl border border-surface-3 p-5">
            <h2 className="font-semibold">Careers</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Application Fee</Label>
                <Input value={settings?.careers?.applicationFee ?? ''} onChange={(e) => update('careers.applicationFee', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Note</Label>
                <Input value={settings?.careers?.paymentNote ?? ''} onChange={(e) => update('careers.paymentNote', e.target.value)} />
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
