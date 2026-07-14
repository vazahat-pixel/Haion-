import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { customerPanelService } from '@/services/customer-panel.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatRelative } from '@/utils/format';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export default function CustomerNotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.customerPortal.notifications,
    queryFn: () => customerPanelService.getNotifications(),
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id) => {
      // notifications are read on view in hub — refresh for now
      await qc.invalidateQueries({ queryKey: queryKeys.customerPortal.notifications });
      return id;
    },
  });

  const items = data?.items ?? [];

  return (
    <CustomerPageShell title="Notifications" subtitle="Updates on orders, warranty & service">
      {isLoading && <LoadingState message="Loading notifications…" />}
      {isError && <ErrorState message="Could not load notifications" onRetry={refetch} />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState icon={Bell} title="All caught up" description="No notifications right now." />
      )}
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <Link
              to={n.link || '#'}
              className={cn(
                'customer-card block rounded-xl bg-surface-1 p-4 transition-colors',
                !n.read && 'border-brand-200 bg-brand-50/40'
              )}
              onClick={() => markRead.mutate(n.id)}
            >
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{n.message}</p>}
              <p className="mt-2 text-[10px] text-[var(--color-text-tertiary)]">{formatRelative(n.createdAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </CustomerPageShell>
  );
}
