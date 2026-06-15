import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PricingTable, PricingDrawer } from '@/modules/pricing';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PricingListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Pricing"
      subtitle="Regional and tier-based price lists"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Rule</Button>}
    >
      <PricingTable />
      <PricingDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
