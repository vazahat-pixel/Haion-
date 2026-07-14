import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { CustomerWarrantyTable } from '@/modules/warranty';
import { Button } from '@/components/ui/button';
import { useEntityList } from '@/hooks/useEntityList';
import { warrantyService } from '@/services/warranty.service';
import { queryKeys } from '@/services/api/queryKeys';
import { CustomerCardList, CustomerCardRow } from '@/components/data-display/CustomerCardList';
import { formatDate } from '@/utils/format';

export default function CustomerWarrantyListPage() {
  const { data, isLoading, isError, refetch } = useEntityList(queryKeys.warranty.list, warrantyService.getList);
  const rows = data?.data ?? data ?? [];

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
      <CustomerCardList
        items={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        basePath="/customer/warranty"
        emptyTitle="No warranties"
        renderItem={(w) => (
          <CustomerCardRow
            title={w.product}
            subtitle={`S/N ${w.serialNo} · Bill ${w.billNo}`}
            meta={`Valid until ${formatDate(w.endDate)}`}
            status={w.status}
          />
        )}
      />
      <div className="hidden lg:block">
        <CustomerWarrantyTable />
      </div>
    </CustomerPageShell>
  );
}
