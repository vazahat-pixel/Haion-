import { PageShell } from '@/components/layout/PageShell';
import { BillingInvoiceBuilder } from '@/modules/billing';

export default function BillingNewPage() {
  return (
    <PageShell title="Create Bill" subtitle="Multi-line invoice with GST breakdown">
      <BillingInvoiceBuilder />
    </PageShell>
  );
}
