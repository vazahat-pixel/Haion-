import { useQuery } from '@tanstack/react-query';
import { grnService } from '@/services/grn.service';
import client from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { inventoryService } from '@/services/inventory.service';
import { approvalsService } from '@/services/approvals.service';

export function useSidebarBadges(panel) {
  const enabled = panel === 'admin' || panel === 'dealer';

  const { data: grnPending = 0 } = useQuery({
    queryKey: ['badges', 'grn', 'pending'],
    queryFn: async () => {
      const res = await grnService.getList({ status: 'PENDING_VERIFICATION', perPage: 1 });
      return res?.meta?.total ?? 0;
    },
    enabled,
    staleTime: 60_000,
  });

  const { data: dispatchPending = 0 } = useQuery({
    queryKey: ['badges', 'dispatch', 'pending'],
    queryFn: async () => {
      const res = await client.get(endpoints.dispatch.pending);
      return res.normalized?.data?.count ?? res.normalized?.data ?? 0;
    },
    enabled: panel === 'admin' || panel === 'dealer',
    staleTime: 60_000,
  });

  const { data: lowStock = 0 } = useQuery({
    queryKey: ['badges', 'inventory', 'low-stock'],
    queryFn: async () => {
      const items = await inventoryService.getLowStock();
      return Array.isArray(items) ? items.length : 0;
    },
    enabled: panel === 'admin',
    staleTime: 60_000,
  });

  const { data: approvalsPending = 0 } = useQuery({
    queryKey: ['badges', 'approvals', 'pending'],
    queryFn: async () => {
      const res = await approvalsService.getPendingCount();
      return res?.count ?? 0;
    },
    enabled: panel === 'admin' || panel === 'employee',
    staleTime: 60_000,
  });

  return {
    'grn.pending': grnPending,
    'dispatch.pending': dispatchPending,
    'inventory.lowStock': lowStock,
    'approvals.pending': approvalsPending,
  };
}
