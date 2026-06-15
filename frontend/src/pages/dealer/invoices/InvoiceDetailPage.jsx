import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { InvoicePreview } from '@/modules/billing';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Invoice" subtitle="Tax invoice preview">
      <InvoicePreview id={id} />
    </PageShell>
  );
}
