import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { WarrantyDetailPanel } from '@/modules/warranty/WarrantyDetailPanel';
import { Button } from '@/components/ui/button';

export default function CustomerProductDetailPage() {
  const { id } = useParams();

  return (
    <CustomerPageShell
      title="Product Details"
      subtitle="Warranty, serial number & purchase info"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/customer/products"><ArrowLeft className="h-3.5 w-3.5" /> Products</Link>
        </Button>
      }
    >
      <WarrantyDetailPanel id={id} />
    </CustomerPageShell>
  );
}
