import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Gift, Users, Wallet, TrendingUp, CheckCircle2,
  Clock, Star, Search, IndianRupee, Info, Plus, Sparkles, HelpCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonTable, SkeletonMetrics } from '@/components/ui/skeleton';
import { FluidHeightContainer } from '@/components/ui/FluidHeightContainer';
import { referralService } from '@/services/referral.service';
import { toast } from '@/utils/toast';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_VARIANT = {
  PENDING: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'secondary',
  APPROVED: 'default',
  PAID: 'success',
  REJECTED: 'danger',
};

// ── Stats Banner ──────────────────────────────────────────────────────────────
function StatsBanner({ stats, isLoading }) {
  if (isLoading) return <SkeletonMetrics count={5} />;

  const cards = [
    { label: 'Pending Bonuses', value: stats?.bonuses?.PENDING ?? 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Active Bonuses', value: stats?.bonuses?.ACTIVE ?? 0, icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Completed Bonuses', value: stats?.bonuses?.COMPLETED ?? 0, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pending Payouts', value: formatINR(stats?.withdrawals?.pending?.amount), icon: IndianRupee, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Paid Out', value: formatINR(stats?.withdrawals?.paid?.amount), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <motion.div
          key={label}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-surface-1 border border-surface-3/80 rounded-2xl p-4 shadow-sm transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`p-2 rounded-xl ${bg} ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">{value}</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1 font-medium">{label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Referral Bonuses Tab ──────────────────────────────────────────────────────
function BonusesTab({ searchValue }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'referrals', 'list', statusFilter],
    queryFn: () => referralService.getAdminList({ status: statusFilter || undefined, perPage: 50 }),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'PENDING', 'ACTIVE', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              statusFilter === s
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-surface-2 text-[var(--color-text-secondary)] hover:bg-surface-3'
            }`}
          >
            {s ? s : 'All Bonuses'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-3 bg-surface-1 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <Gift className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">No Referral Bonuses Found</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              When a customer refers a friend, and the dealer enters the referrer&apos;s code during <strong>Billing / Invoice Creation</strong>, referral bonus entries will automatically appear here!
            </p>
          </div>

          <div className="pt-2 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 rounded-xl border border-surface-3 bg-surface-2/40 text-xs">
              <span className="font-bold text-brand-500 block mb-1">1. Customer Code</span>
              Customer gets unique referral code in their Customer Portal (`/customer/referral`).
            </div>
            <div className="p-3 rounded-xl border border-surface-3 bg-surface-2/40 text-xs">
              <span className="font-bold text-brand-500 block mb-1">2. Dealer Invoice</span>
              Dealer enters `Applied Referral Code` while creating sale bill.
            </div>
            <div className="p-3 rounded-xl border border-surface-3 bg-surface-2/40 text-xs">
              <span className="font-bold text-brand-500 block mb-1">3. ₹40k Reward</span>
              Backend activates ₹40,000 monthly payout installments for the referrer!
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-surface-3 rounded-2xl overflow-hidden bg-surface-1 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[var(--color-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Referral Code</th>
                <th className="p-3.5">Dealer</th>
                <th className="p-3.5">Referred</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Bonus</th>
                <th className="p-3.5">Withdrawn</th>
                <th className="p-3.5">Month</th>
                <th className="p-3.5">Next Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {rows
                .filter((r) =>
                  !searchValue ||
                  r.customerName?.toLowerCase().includes(searchValue.toLowerCase()) ||
                  r.referralCode?.toLowerCase().includes(searchValue.toLowerCase()) ||
                  r.customerPhone?.includes(searchValue)
                )
                .map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/60 transition">
                    <td className="p-3.5">
                      <p className="font-bold text-[var(--color-text-primary)]">{r.customerName}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{r.customerPhone} · {r.customerCode}</p>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-brand-500 text-xs">{r.referralCode}</td>
                    <td className="p-3.5 text-[var(--color-text-secondary)] text-xs">{r.dealerName}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
                        <span className="font-semibold">{r.referredCount}/2</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={STATUS_VARIANT[r.status] || 'secondary'}>{r.status}</Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-[var(--color-text-primary)]">{formatINR(r.bonusAmount)}</td>
                    <td className="p-3.5 text-emerald-600 font-semibold">{formatINR(r.totalWithdrawn)}</td>
                    <td className="p-3.5 text-xs text-[var(--color-text-secondary)]">{r.currentMonth}/{r.totalMonths}</td>
                    <td className="p-3.5 text-xs text-[var(--color-text-tertiary)]">{formatDate(r.nextWithdrawalDue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Withdrawals Tab ───────────────────────────────────────────────────────────
function WithdrawalsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processingId, setProcessingId] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // { id, action }
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', 'list', statusFilter],
    queryFn: () => referralService.getAdminWithdrawals({ status: statusFilter || undefined, perPage: 100 }),
  });

  const processMutation = useMutation({
    mutationFn: ({ id, action, note }) =>
      referralService.processWithdrawal(id, { action, adminNote: note }),
    onSuccess: (_, { action }) => {
      toast.success(`Withdrawal ${action.toLowerCase()}d successfully`);
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'referrals'] });
      setNoteModal(null);
      setAdminNote('');
      setProcessingId(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Action failed');
      setProcessingId(null);
    },
  });

  const handleAction = (id, action) => {
    setNoteModal({ id, action });
  };

  const confirmAction = () => {
    if (!noteModal) return;
    setProcessingId(noteModal.id);
    processMutation.mutate({ id: noteModal.id, action: noteModal.action, note: adminNote });
  };

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['PENDING', 'APPROVED', 'PAID', 'REJECTED', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              statusFilter === s
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-surface-2 text-[var(--color-text-secondary)] hover:bg-surface-3'
            }`}
          >
            {s ? s : 'All Withdrawals'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-3 bg-surface-1 p-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">No Withdrawal Requests</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            When customers request monthly payout withdrawals from their referral card, their requests will be listed here for approval.
          </p>
        </div>
      ) : (
        <div className="border border-surface-3 rounded-2xl overflow-hidden bg-surface-1 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-[var(--color-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Month</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Bank Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {rows.map((w) => (
                <tr key={w.id} className="hover:bg-surface-2/60 transition">
                  <td className="p-3.5 font-mono text-xs font-bold text-brand-500">{w.withdrawalRef || w.id.slice(-8)}</td>
                  <td className="p-3.5">
                    <p className="font-bold text-[var(--color-text-primary)]">{w.customerName}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{w.customerPhone}</p>
                  </td>
                  <td className="p-3.5 font-semibold">Month {w.month}</td>
                  <td className="p-3.5 font-bold text-emerald-600">{formatINR(w.amount)}</td>
                  <td className="p-3.5">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{w.bankName || '—'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{w.bankAccountHolder}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-mono">{w.bankIFSC}</p>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={STATUS_VARIANT[w.status] || 'secondary'}>{w.status}</Badge>
                  </td>
                  <td className="p-3.5 text-xs text-[var(--color-text-tertiary)]">{formatDate(w.createdAt)}</td>
                  <td className="p-3.5">
                    {w.status === 'PENDING' && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                          disabled={processingId === w.id}
                          onClick={() => handleAction(w.id, 'APPROVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20"
                          disabled={processingId === w.id}
                          onClick={() => handleAction(w.id, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {w.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-xs font-semibold text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                        disabled={processingId === w.id}
                        onClick={() => handleAction(w.id, 'PAID')}
                      >
                        Mark Paid
                      </Button>
                    )}
                    {(w.status === 'PAID' || w.status === 'REJECTED') && (
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {formatDate(w.processedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-1 border border-surface-3 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              {noteModal.action === 'APPROVE' ? '✅ Approve Withdrawal' :
               noteModal.action === 'REJECT' ? '❌ Reject Withdrawal' :
               '💳 Mark as Paid'}
            </h3>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
                Admin Note / UTR Reference ID (Optional)
              </label>
              <textarea
                className="w-full border border-surface-3 rounded-xl p-2.5 text-xs bg-surface-2/50 resize-none outline-none focus:border-brand-500"
                rows={3}
                placeholder="Enter bank transaction reference or note..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setNoteModal(null); setAdminNote(''); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmAction}
                disabled={processMutation.isPending}
                variant={noteModal.action === 'REJECT' ? 'destructive' : 'default'}
              >
                {processMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminReferralsPage() {
  const [activeTab, setActiveTab] = useState('bonuses');
  const [search, setSearch] = useState('');

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin', 'referrals', 'stats'],
    queryFn: () => referralService.getAdminStats(),
  });

  return (
    <PageShell
      title="Referral Rewards Management"
      subtitle="Track all customer referral bonuses and manage monthly withdrawal requests"
    >
      {/* Stats */}
      <StatsBanner stats={stats} isLoading={isStatsLoading} />

      {/* Search + Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            placeholder="Search by name, code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'bonuses', label: 'Referral Bonuses', icon: Gift },
            { key: 'withdrawals', label: 'Withdrawals', icon: Wallet },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === key
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-surface-2 text-[var(--color-text-secondary)] hover:bg-surface-3'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <FluidHeightContainer>
        {activeTab === 'bonuses' && <BonusesTab searchValue={search} />}
        {activeTab === 'withdrawals' && <WithdrawalsTab />}
      </FluidHeightContainer>
    </PageShell>
  );
}
