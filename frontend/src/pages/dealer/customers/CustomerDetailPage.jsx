import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { CustomerDetail } from '@/modules/customers';

export default function CustomerDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Customer Profile">
      <CustomerDetail id={id} />
    </PageShell>
  );
}
