import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { insuranceService } from '@/services/insurance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerInsuranceListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dealerId = user?.dealerId;

  const { data: wallet } = useQuery({
    queryKey: queryKeys.insuranceWallets.detail(dealerId),
    queryFn: () => insuranceService.getWallet(dealerId),
    enabled: !!dealerId,
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insuranceClaims.list({ perPage: 50 }),
    queryFn: () => insuranceService.getClaims({ perPage: 50 }),
  });

  const rows = data?.data ?? [];

  return (
    <PageShell
      title="Insurance"
      subtitle="Submit customer insurance claims and track your virtual payments"
      actions={
        <Button asChild size="sm">
          <Link to="/dealer/insurance/claims/new">
            <Plus className="h-4 w-4" /> New Claim
          </Link>
        </Button>
      }
    >
      <Card className="mb-6 max-w-sm">
        <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><WalletIcon className="h-4 w-4" /> Insurance Wallet</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(wallet?.insuranceWalletBalance || 0)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Virtual payments sent by admin against approved claims are credited here.
          </p>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Claim No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No insurance claims submitted yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/dealer/insurance/claims/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.claimNo}</td>
                  <td className="px-4 py-3 font-medium">{row.customerName}</td>
                  <td className="px-4 py-3">{row.product}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(row.claimAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{fmtDate(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
