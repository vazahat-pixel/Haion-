import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ModuleTable } from '@/components/data-display/ModuleTable';
import { Button } from '@/components/ui/button';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/services/api/queryKeys';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { toast } from '@/utils/toast';

export function NotificationListPanel() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.notifications.list({}),
    queryFn: () => notificationsService.getList({ perPage: 50 }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked read');
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: () => toast.error('Failed to mark all read'),
  });

  const handleOpen = async (row) => {
    if (!row.read) {
      try {
        await notificationsService.markRead(row.id);
        qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      } catch {
        /* ignore */
      }
    }
    if (row.link) navigate(row.link);
  };

  const columns = [
    {
      key: 'title',
      label: 'Alert',
      width: 200,
      render: (val, row) => (
        <button
          type="button"
          className="text-left font-medium text-[var(--color-brand-primary)] hover:underline"
          onClick={() => handleOpen(row)}
        >
          {val}
        </button>
      ),
    },
    { key: 'message', label: 'Message', width: 280 },
    { key: 'type', label: 'Type', width: 100, render: (val) => <StatusBadge status={val} /> },
    { key: 'read', label: 'Read', width: 80, render: (val) => (val ? 'Yes' : 'No'), sortable: false },
    { key: 'createdAt', label: 'When', width: 120, render: 'relativeDate' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          Mark all read
        </Button>
      </div>
      <ModuleTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        searchKeys={['title', 'message', 'type']}
        filterKey="type"
        filterOptions={[
          { value: 'INVENTORY', label: 'Inventory' },
          { value: 'GRN', label: 'GRN' },
          { value: 'EXPENSE', label: 'Expense' },
          { value: 'SERVICE', label: 'Service' },
          { value: 'DEALER', label: 'Dealer' },
          { value: 'BILLING', label: 'Billing' },
        ]}
        emptyTitle="No notifications"
        emptyDescription="System alerts will appear here."
      />
    </div>
  );
}
