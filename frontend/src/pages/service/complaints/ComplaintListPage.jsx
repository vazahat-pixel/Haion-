import { PageShell } from '@/components/layout/PageShell';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ComplaintTable } from '@/modules/complaints';

export default function ComplaintListPage() {
  return (
    <PageShell title="Complaints" subtitle="Customer complaints"
      actions={<Button size="sm" asChild><Link to="/service/complaints/new"><Plus className="h-4 w-4" /> New Complaint</Link></Button>}>
      <ComplaintTable />
    </PageShell>
  );
}
