import { useQuery } from '@tanstack/react-query';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { CustomerProductList } from '@/modules/customer-portal/CustomerProductList';
import { customerPanelService } from '@/services/customer-panel.service';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function CustomerProductsPage() {
  const { data: hub, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-panel', 'hub'],
    queryFn: () => customerPanelService.getMyHub(),
  });

  return (
    <CustomerPageShell title="My Products" subtitle="Purchased items, warranty & bill details">
      {isLoading && <LoadingState message="Loading products…" />}
      {isError && <ErrorState message="Could not load products" onRetry={refetch} />}
      {hub && (
        <CustomerProductList
          products={hub.products || hub.warranties}
          authenticated
        />
      )}
    </CustomerPageShell>
  );
}
