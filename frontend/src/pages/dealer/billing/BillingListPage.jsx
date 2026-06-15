import { PageShell } from '@/components/layout/PageShell';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BillingTable } from '@/modules/billing';

export default function BillingListPage() {
  return (
    <PageShell title="Billing" subtitle="Manage bills and invoices"
      actions={<Button size="sm" asChild><Link to="/dealer/billing/new"><Plus className="h-4 w-4" /> New Bill</Link></Button>}>
      <BillingTable />
    </PageShell>
  );
}
