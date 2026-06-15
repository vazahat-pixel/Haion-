import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { formatRelative } from '@/utils/format';
import { notificationsService } from '@/services/notifications.service';
import { queryKeys } from '@/services/api/queryKeys';
import { cn } from '@/utils/cn';

export function NotificationPanel({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list({}),
    queryFn: () => notificationsService.getList(),
    enabled: open,
  });
  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });

  const items = data?.data ?? data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Notifications" description="System alerts and updates">
      <div className="mb-4 flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </Button>
      </div>
      {isLoading ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Bell className="h-8 w-8 text-[var(--color-text-tertiary)]" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No notifications</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'rounded-lg border border-surface-3 p-3 transition-colors',
                !n.read && 'bg-brand-50/50 border-brand-100'
              )}
            >
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.title}</p>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{n.message}</p>
              <p className="mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">{formatRelative(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
