import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { CustomerDashboard } from '@/modules/dashboards';

export default function CustomerDashboardPage() {
  return (
    <CustomerPageShell title="Dashboard" subtitle="Your account overview">
      <CustomerDashboard />
    </CustomerPageShell>
  );
}
