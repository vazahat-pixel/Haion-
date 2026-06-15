import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { StatusBadge } from './StatusBadge';
import { inventoryService } from '@/services/inventory.service';
import { grnService } from '@/services/grn.service';
import { formatRelative } from '@/utils/format';

function WidgetLink({ to, children }) {
  return (
    <Link to={to} className="text-[10px] font-medium text-brand-600 hover:text-brand-700 transition-colors">
      {children}
    </Link>
  );
}

export function LowStockWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryService.getLowStock(),
    staleTime: 60_000,
  });
  const items = (data || []).slice(0, 5);

  return (
    <GlassCard hover={false} delay={0.35}>
      <GlassCardHeader>
        <GlassCardTitle>Low Stock Alerts</GlassCardTitle>
        <WidgetLink to="/admin/inventory">View all</WidgetLink>
      </GlassCardHeader>
      <GlassCardContent className="pt-0">
        {isLoading ? (
          <p className="py-3 text-center text-[11px] text-[var(--color-text-tertiary)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-[var(--color-text-tertiary)]">All stock levels healthy</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-md border border-white/40 bg-white/30 px-2.5 py-1.5 text-[11px] backdrop-blur-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {item.warehouse || item.warehouseCode} · {item.quantity} units
                  </p>
                </div>
                <StatusBadge status={item.status} size="sm" />
              </motion.li>
            ))}
          </ul>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

export function PendingGRNWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['grn', 'pending'],
    queryFn: () => grnService.getList({ status: 'PENDING_VERIFICATION', perPage: 5 }),
    staleTime: 60_000,
  });
  const pending = data?.data || [];

  return (
    <GlassCard hover={false} delay={0.4}>
      <GlassCardHeader>
        <GlassCardTitle>Pending GRNs</GlassCardTitle>
        <WidgetLink to="/admin/grn">View all</WidgetLink>
      </GlassCardHeader>
      <GlassCardContent className="pt-0">
        {isLoading ? (
          <p className="py-3 text-center text-[11px] text-[var(--color-text-tertiary)]">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-[var(--color-text-tertiary)]">No pending verifications</p>
        ) : (
          <ul className="space-y-1.5">
            {pending.map((grn, i) => (
              <motion.li
                key={grn.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/admin/grn/${grn.id}`}
                  className="interactive-smooth flex items-center justify-between rounded-md border border-white/40 bg-white/30 px-2.5 py-1.5 text-[11px] backdrop-blur-sm hover:border-brand-500/25 hover:bg-white/50"
                >
                  <div>
                    <p className="font-medium">{grn.grnNo}</p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {grn.supplier} · {grn.items} items
                    </p>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-tertiary)]">{formatRelative(grn.receivedAt)}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
