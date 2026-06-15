import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { EmployeeTable, EmployeeDrawer } from '@/modules/employees';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmployeeListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Employees"
      subtitle="Manage staff and roles"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Employee</Button>}
    >
      <EmployeeTable />
      <EmployeeDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
