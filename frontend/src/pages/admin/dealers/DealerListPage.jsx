import { PageShell } from '@/components/layout/PageShell';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DealerTable } from '@/modules/dealers';

export default function DealerListPage() {
  return (
    <PageShell title="Dealers" subtitle="Manage dealer network"
      actions={<Button size="sm" asChild><Link to="/admin/dealers/onboarding"><Plus className="h-4 w-4" /> Onboard Dealer</Link></Button>}>
      <DealerTable />
    </PageShell>
  );
}
