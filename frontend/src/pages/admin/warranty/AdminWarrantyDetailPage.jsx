import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminWarrantyDetail } from '@/modules/warranty';

export default function AdminWarrantyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <PageShell
      title="Warranty Details"
      subtitle={`Warranty Record #${id}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/warranty')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to List
        </Button>
      }
    >
      <AdminWarrantyDetail id={id} />
    </PageShell>
  );
}
