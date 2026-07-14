import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Settings, Receipt, Bell, Shield, Smartphone, FileText } from 'lucide-react';
import { LoadingState } from '@/components/feedback/LoadingState';
import { queryKeys } from '@/services/api/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/utils/toast';

const generalSchema = z.object({
  companyName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
});

const gstSchema = z.object({
  gstin: z.string().min(15).max(15),
  stateCode: z.string().min(2).max(2),
  defaultRate: z.coerce.number().min(0).max(28),
});

const notifSchema = z.object({
  emailAlerts: z.boolean().optional(),
  smsAlerts: z.boolean().optional(),
  lowStockAlert: z.boolean().optional(),
  complaintEscalation: z.boolean().optional(),
});

export function SettingsHub() {
  const links = [
    { to: '/admin/settings/general', icon: Settings, title: 'General', desc: 'Company profile and contact' },
    { to: '/admin/settings/gst', icon: Receipt, title: 'GST', desc: 'Tax configuration and rates' },
    { to: '/admin/settings/notifications', icon: Bell, title: 'Notifications', desc: 'Alert preferences' },
    { to: '/admin/settings/customer-portal', icon: Smartphone, title: 'Customer Portal', desc: 'Mobile app branding & features' },
    { to: '/admin/settings/ca-reports', icon: FileText, title: 'CA Reports Sharing', desc: 'Auto-share GSTR reports to your CA monthly' },
    { to: '/admin/settings/roles', icon: Shield, title: 'Roles & Permissions', desc: 'Access control matrix' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {links.map((l) => (
        <Link key={l.to} to={l.to}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <l.icon className="mb-2 h-8 w-8 text-[var(--color-brand-primary)]" />
              <CardTitle className="text-base">{l.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-[var(--color-text-secondary)]">{l.desc}</p></CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function GeneralSettingsForm() {
  const { data, isLoading } = useQuery({ queryKey: ['settings', 'general'], queryFn: settingsService.getGeneral });
  if (isLoading) return <LoadingState />;
  return (
    <FormCard
      title="General Settings"
      schema={generalSchema}
      defaultValues={data}
      fields={[
        { name: 'companyName', label: 'Company Name', fullWidth: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
      ]}
      onSubmit={(d) => settingsService.updateGeneral(d)}
    />
  );
}

export function GstSettingsForm() {
  const { data, isLoading } = useQuery({ queryKey: ['settings', 'gst'], queryFn: settingsService.getGst });
  if (isLoading) return <LoadingState />;
  return (
    <FormCard
      title="GST Configuration"
      schema={gstSchema}
      defaultValues={data}
      fields={[
        { name: 'gstin', label: 'Company GSTIN' },
        { name: 'stateCode', label: 'State Code' },
        { name: 'defaultRate', label: 'Default GST Rate (%)', type: 'number' },
      ]}
      onSubmit={(d) => settingsService.updateGst(d)}
    />
  );
}

export function NotificationSettingsForm() {
  const { data, isLoading } = useQuery({ queryKey: ['settings', 'notifications'], queryFn: settingsService.getNotifications });
  if (isLoading) return <LoadingState />;
  return (
    <FormCard
      title="Notification Preferences"
      schema={notifSchema}
      defaultValues={{
        emailAlerts: Boolean(data?.emailAlerts),
        smsAlerts: Boolean(data?.smsAlerts),
        lowStockAlert: Boolean(data?.lowStockAlert),
        complaintEscalation: Boolean(data?.complaintEscalation),
      }}
      fields={[
        { name: 'emailAlerts', label: 'Email Alerts', type: 'checkbox', hint: 'Send alerts via email' },
        { name: 'smsAlerts', label: 'SMS Alerts', type: 'checkbox', hint: 'Send alerts via SMS' },
        { name: 'lowStockAlert', label: 'Low Stock Alert', type: 'checkbox', hint: 'Notify when stock is low' },
        { name: 'complaintEscalation', label: 'Complaint Escalation', type: 'checkbox', hint: 'Escalate overdue complaints' },
      ]}
      onSubmit={(d) => settingsService.updateNotifications({
        emailAlerts: Boolean(d.emailAlerts),
        smsAlerts: Boolean(d.smsAlerts),
        lowStockAlert: Boolean(d.lowStockAlert),
        complaintEscalation: Boolean(d.complaintEscalation),
      })}
    />
  );
}

const portalSchema = z.object({
  appName: z.string().min(2),
  tagline: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use hex color e.g. #c4714f'),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportWhatsapp: z.string().optional(),
  heroSubtitle: z.string().optional(),
  liveRefreshMs: z.coerce.number().min(5000).max(300000),
  features_orders: z.boolean().optional(),
  features_warranty: z.boolean().optional(),
  features_serviceRequests: z.boolean().optional(),
  features_complaints: z.boolean().optional(),
  features_products: z.boolean().optional(),
  features_liveTracking: z.boolean().optional(),
  features_notifications: z.boolean().optional(),
});

export function CustomerPortalSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'customer-portal'],
    queryFn: settingsService.getCustomerPortal,
  });

  if (isLoading) return <LoadingState />;

  const defaultValues = {
    appName: data?.appName || 'Haion Customer',
    tagline: data?.tagline || '',
    primaryColor: data?.primaryColor || '#c4714f',
    supportPhone: data?.supportPhone || '',
    supportEmail: data?.supportEmail || '',
    supportWhatsapp: data?.supportWhatsapp || '',
    heroSubtitle: data?.heroSubtitle || '',
    liveRefreshMs: data?.liveRefreshMs || 30000,
    features_orders: data?.features?.orders !== false,
    features_warranty: data?.features?.warranty !== false,
    features_serviceRequests: data?.features?.serviceRequests !== false,
    features_complaints: data?.features?.complaints !== false,
    features_products: data?.features?.products !== false,
    features_liveTracking: data?.features?.liveTracking !== false,
    features_notifications: data?.features?.notifications !== false,
  };

  return (
    <FormCard
      title="Customer Portal"
      description="Changes apply live to the customer mobile app."
      schema={portalSchema}
      defaultValues={defaultValues}
      fields={[
        { name: 'appName', label: 'App Name', fullWidth: true },
        { name: 'tagline', label: 'Tagline', fullWidth: true },
        { name: 'primaryColor', label: 'Primary Color', type: 'color' },
        { name: 'heroSubtitle', label: 'Hero Subtitle', fullWidth: true },
        { name: 'supportPhone', label: 'Support Phone', type: 'tel' },
        { name: 'supportEmail', label: 'Support Email', type: 'email' },
        { name: 'supportWhatsapp', label: 'WhatsApp', type: 'tel' },
        { name: 'liveRefreshMs', label: 'Live Refresh (ms)', type: 'number', hint: 'Polling interval for live tracking' },
        { name: 'features_orders', label: 'Orders', type: 'checkbox' },
        { name: 'features_warranty', label: 'Warranty', type: 'checkbox' },
        { name: 'features_serviceRequests', label: 'Service Requests', type: 'checkbox' },
        { name: 'features_complaints', label: 'Complaints', type: 'checkbox' },
        { name: 'features_products', label: 'Products', type: 'checkbox' },
        { name: 'features_liveTracking', label: 'Live Tracking', type: 'checkbox' },
        { name: 'features_notifications', label: 'Notifications', type: 'checkbox' },
      ]}
      onSubmit={async (d) => {
        await settingsService.updateCustomerPortal({
          appName: d.appName,
          tagline: d.tagline,
          primaryColor: d.primaryColor,
          supportPhone: d.supportPhone,
          supportEmail: d.supportEmail || undefined,
          supportWhatsapp: d.supportWhatsapp,
          heroSubtitle: d.heroSubtitle,
          liveRefreshMs: d.liveRefreshMs,
          features: {
            orders: Boolean(d.features_orders),
            warranty: Boolean(d.features_warranty),
            serviceRequests: Boolean(d.features_serviceRequests),
            complaints: Boolean(d.features_complaints),
            products: Boolean(d.features_products),
            liveTracking: Boolean(d.features_liveTracking),
            notifications: Boolean(d.features_notifications),
          },
        });
        await qc.invalidateQueries({ queryKey: queryKeys.customerPortal.config });
        toast.success('Customer portal settings saved');
      }}
    />
  );
}
