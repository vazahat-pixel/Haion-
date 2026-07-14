import { Link } from 'react-router-dom';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ServiceRequestTable } from '@/modules/service-requests';
import { useEntityList } from '@/hooks/useEntityList';
import { serviceRequestsService } from '@/services/serviceRequests.service';
import { queryKeys } from '@/services/api/queryKeys';
import { CustomerCardList, CustomerCardRow } from '@/components/data-display/CustomerCardList';
import { formatRelative } from '@/utils/format';

export default function ServiceRequestListPage() {
  const { data, isLoading, isError, refetch } = useEntityList(
    queryKeys.serviceRequests.list,
    serviceRequestsService.getList
  );
  const rows = data?.data ?? data ?? [];

  return (
    <CustomerPageShell
      title="Service Requests"
      subtitle="Track your service requests live"
      actions={
        <Button size="sm" asChild>
          <Link to="/customer/service-requests/new"><Plus className="h-4 w-4" /> New Request</Link>
        </Button>
      }
    >
      <CustomerCardList
        items={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        basePath="/customer/service-requests"
        emptyTitle="No service requests"
        renderItem={(s) => (
          <CustomerCardRow
            title={s.requestNo}
            subtitle={s.product}
            meta={`${s.issue?.slice(0, 60) || ''} · ${formatRelative(s.createdAt)}`}
            status={s.status}
          />
        )}
      />
      <div className="hidden lg:block">
        <ServiceRequestTable />
      </div>
    </CustomerPageShell>
  );
}
