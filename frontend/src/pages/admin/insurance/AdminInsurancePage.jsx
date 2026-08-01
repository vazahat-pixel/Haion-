import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet as WalletIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { insuranceService } from '@/services/insurance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TopUpDialog({ dealer, onClose }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const topUp = useMutation({
    mutationFn: () => insuranceService.topUpWallet(dealer.id, { amount: Number(amount), referenceNo, notes }),
    onSuccess: () => {
      toast.success(`Insurance wallet topped up for ${dealer.name}`);
      qc.invalidateQueries({ queryKey: queryKeys.insuranceWallets.all });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Top-up failed'),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top-up Insurance Wallet</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <div className="text-sm text-[var(--color-text-secondary)]">
            {dealer.name} · Current balance: <span className="font-semibold text-[var(--color-text-primary)]">{formatCurrency(dealer.insuranceWalletBalance || 0)}</span>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Amount</label>
            <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Reference No (optional)</label>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Bank ref / UTR" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for top-up" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              disabled={!amount || Number(amount) <= 0 || topUp.isPending}
              onClick={() => topUp.mutate()}
            >
              Send Virtual Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WalletsTab() {
  const [search, setSearch] = useState('');
  const [topUpDealer, setTopUpDealer] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insuranceWallets.list({ search }),
    queryFn: () => insuranceService.getWallets({ search, perPage: 100 }),
  });

  const rows = data?.data ?? [];

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search dealer name, code…"
          className="h-8 w-64 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Wallet Balance</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No dealers found</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-3">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{row.city}, {row.state}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(row.insuranceWalletBalance || 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setTopUpDealer(row)}>
                      <WalletIcon className="h-3.5 w-3.5" /> Top-up
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {topUpDealer && <TopUpDialog dealer={topUpDealer} onClose={() => setTopUpDealer(null)} />}
    </div>
  );
}

function ClaimsTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filters = { perPage: 50 };
  if (search) filters.search = search;
  if (status) filters.status = status;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insuranceClaims.list(filters),
    queryFn: () => insuranceService.getClaims(filters),
  });

  const rows = data?.data ?? [];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search claim no, customer, product…"
          className="h-8 w-64 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="h-8 text-sm w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Claim No</th>
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No insurance claims yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/admin/insurance/claims/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.claimNo}</td>
                  <td className="px-4 py-3">{row.dealerName}</td>
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
    </div>
  );
}

export default function AdminInsurancePage() {
  return (
    <PageShell title="Insurance" subtitle="Fund dealer insurance wallets and review customer insurance claims">
      <Tabs defaultValue="wallets">
        <TabsList>
          <TabsTrigger value="wallets">Dealer Wallets</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        <TabsContent value="wallets"><WalletsTab /></TabsContent>
        <TabsContent value="claims"><ClaimsTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
