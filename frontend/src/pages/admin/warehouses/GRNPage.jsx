import { useParams, useNavigate } from 'react-router-dom';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { GRNStepperForm } from '@/modules/grn';

export default function GRNPage() {
  const { id: warehouseId } = useParams();
  const navigate = useNavigate();

  return (
    <DetailPageShell
      back={{ label: 'Warehouses', href: '/admin/warehouses' }}
      title="Create GRN"
      subtitle="Multi-step goods receipt with line item verification"
    >
      <GRNStepperForm
        warehouseId={warehouseId}
        onComplete={() => navigate('/admin/grn')}
      />
    </DetailPageShell>
  );
}
