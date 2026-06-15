import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { ExpenseTable, ExpenseDrawer } from '@/modules/expenses';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ExpenseListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell title="Expenses" subtitle="Track and approve operational expenses" actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Submit Expense</Button>}>
      <ExpenseTable />
      <ExpenseDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
