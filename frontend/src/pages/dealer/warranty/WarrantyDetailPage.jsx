import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { WarrantyDetail } from '@/modules/warranty';

export default function WarrantyDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Warranty Details" subtitle="Warranty information">
      <WarrantyDetail id={id} />
    </PageShell>
  );
}
