import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { AdminReportTable, ReportGenerateDrawer } from '@/modules/reports';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AdminReportsPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Reports"
      subtitle="Operational and financial reports"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Generate Report</Button>}
    >
      <AdminReportTable />
      <ReportGenerateDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
