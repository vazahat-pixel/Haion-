import { PageShell } from '@/components/layout/PageShell';
import { StoreOrdersTable } from '@/modules/store-orders';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function StoreOrdersPage() {
  return (
    <PageShell
      title="Website Orders"
      subtitle="Customer orders from the online store — CMS products, COD & Razorpay payments"
      actions={
        <Button variant="outline" size="sm" onClick={() => window.open('/landing', '_blank')}>
          <ExternalLink className="h-4 w-4 mr-1.5" /> View Store
        </Button>
      }
    >
      <StoreOrdersTable />
    </PageShell>
  );
}
