import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { WarrantyLookup } from '@/modules/warranty/WarrantyLookup';

export default function CustomerWarrantyLookupPage() {
  return (
    <CustomerPageShell title="Warranty Lookup" subtitle="Search by serial number or bill">
      <WarrantyLookup />
    </CustomerPageShell>
  );
}
