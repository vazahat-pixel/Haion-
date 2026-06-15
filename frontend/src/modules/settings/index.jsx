import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Settings, Receipt, Bell, Shield } from 'lucide-react';
import { LoadingState } from '@/components/feedback/LoadingState';

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
