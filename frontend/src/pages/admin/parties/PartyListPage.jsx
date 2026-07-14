import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { PartyTable } from '@/modules/parties';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PartyListPage() {
  return (
    <PageShell
      title="Parties"
      subtitle="Manage suppliers, dealers, customers and all business parties in one place"
      actions={(
        <Button size="sm" asChild>
          <Link to="/admin/parties/new"><Plus className="h-4 w-4" /> Add Party</Link>
        </Button>
      )}
    >
      <PartyTable />
    </PageShell>
  );
}
