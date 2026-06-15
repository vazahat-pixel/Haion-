import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { useParams } from 'react-router-dom';
import { WarrantyDetailPanel } from '@/modules/warranty/WarrantyDetailPanel';

export default function CustomerWarrantyDetailPage() {
  const { id } = useParams();
  return (
    <CustomerPageShell title="Warranty Details" subtitle="Certificate and coverage">
      <WarrantyDetailPanel id={id} />
    </CustomerPageShell>
  );
}
