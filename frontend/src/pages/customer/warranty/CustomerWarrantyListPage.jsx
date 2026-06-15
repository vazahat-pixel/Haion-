import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { CustomerWarrantyTable } from '@/modules/warranty';
import { Button } from '@/components/ui/button';

export default function CustomerWarrantyListPage() {
  return (
    <CustomerPageShell
      title="My Warranties"
      subtitle="Registered product warranties"
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/customer/warranty/lookup"><Search className="h-3.5 w-3.5" /> Lookup</Link>
        </Button>
      }
    >
      <CustomerWarrantyTable />
    </CustomerPageShell>
  );
}
