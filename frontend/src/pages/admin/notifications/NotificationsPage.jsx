import { PageShell } from '@/components/layout/PageShell';
import { NotificationListPanel } from '@/modules/notifications/NotificationListPanel';

export default function NotificationsPage() {
  return (
    <PageShell title="Notifications" subtitle="System alerts and operational updates">
      <NotificationListPanel />
    </PageShell>
  );
}
