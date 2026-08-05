/**
 * CompanyLedgerPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only: Company / Warehouse ledger showing every rupee in/out.
 * Similar to Party Ledger but for the entire company.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Wallet, Download, RefreshCw, Plus,
  Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import client from '@/services/api/client';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

// ── API helpers ─────────────────────────────────────────────────────────────

async function fetchLedger({ page, perPage, from, to, txnType }) {
  const params = new URLSearchParams({ page, perPage });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (txnType) params.append('txnType', txnType);
  const res = await client.get(`/company-ledger?${params}`);
  return res.normalized || res.data;
}

async function fetchSummary({ from, to }) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const res = await client.get(`/company-ledger/summary?${params}`);
  return res.normalized?.data || res.data?.data;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const TXN_LABELS = {
  SALE_TO_DEALER: 'Sale to Dealer',
  PAYMENT_FROM_DEALER: 'Payment Received',
  PURCHASE: 'Purchase',
  EXPENSE: 'Expense',
  MANUFACTURE: 'Manufacturing',
  ADJUSTMENT: 'Adjustment',
  OPENING_BALANCE: 'Opening Balance',
};

const TXN_COLORS = {
  SALE_TO_DEALER: 'bg-blue-100 text-blue-800',
  PAYMENT_FROM_DEALER: 'bg-green-100 text-green-800',
  PURCHASE: 'bg-orange-100 text-orange-800',
  EXPENSE: 'bg-red-100 text-red-800',
  MANUFACTURE: 'bg-purple-100 text-purple-800',
  ADJUSTMENT: 'bg-gray-100 text-gray-700',
  OPENING_BALANCE: 'bg-cyan-100 text-cyan-700',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Page Component ──────────────────────────────────────────────────────────

export function CompanyLedgerPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [txnType, setTxnType] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ txnType: 'ADJUSTMENT', credit: '', debit: '', description: '', partyName: '', referenceNo: '' });
  const [saving, setSaving] = useState(false);

  const filterKey = { page, perPage, from, to, txnType };

  const { data: ledgerRes, isLoading, refetch } = useQuery({
    queryKey: ['company-ledger', filterKey],
    queryFn: () => fetchLedger(filterKey),
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['company-ledger-summary', { from, to }],
    queryFn: () => fetchSummary({ from, to }),
  });

  const entries = ledgerRes?.data || [];
  const total = ledgerRes?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const handleExport = () => {
    const headers = 'Date,Type,Description,Party,Reference,Debit,Credit,Balance\n';
    const rows = entries.map((e) =>
      [
        fmtDate(e.date),
        TXN_LABELS[e.txnType] || e.txnType,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${(e.partyName || '').replace(/"/g, '""')}"`,
        e.referenceNo || '',
        e.debit || 0,
        e.credit || 0,
        e.balance || 0,
      ].join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company-ledger-${from}-${to}.csv`;
    a.click();
  };

  const handleManualSubmit = async () => {
    if (!manualForm.txnType) return toast.error('Select transaction type');
    if (!manualForm.credit && !manualForm.debit) return toast.error('Enter credit or debit amount');
    setSaving(true);
    try {
      await client.post('/company-ledger', {
        ...manualForm,
        credit: Number(manualForm.credit) || 0,
        debit: Number(manualForm.debit) || 0,
      });
      toast.success('Entry added');
      setShowManual(false);
      setManualForm({ txnType: 'ADJUSTMENT', credit: '', debit: '', description: '', partyName: '', referenceNo: '' });
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Ledger</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Complete financial movement of the warehouse — every rupee in and out.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowManual(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Manual Entry
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-700">Total Incoming</p>
                <p className="text-xl font-bold text-green-800 tabular-nums">
                  {formatCurrency(summary?.totalCredit ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2.5">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-700">Total Outgoing</p>
                <p className="text-xl font-bold text-red-800 tabular-nums">
                  {formatCurrency(summary?.totalDebit ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">Closing Balance</p>
                <p className={`text-xl font-bold tabular-nums ${(summary?.closingBalance ?? 0) >= 0 ? 'text-blue-800' : 'text-red-700'}`}>
                  {formatCurrency(summary?.closingBalance ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-4">
          <Filter className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-8 w-36 text-sm" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-8 w-36 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={txnType} onChange={(e) => { setTxnType(e.target.value); setPage(1); }} className="h-8 text-sm">
              <option value="">All Types</option>
              {Object.entries(TXN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchSummary(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry form */}
      {showManual && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800">Manual Journal Entry</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="text-xs">Type *</Label>
              <Select value={manualForm.txnType} onChange={(e) => setManualForm({ ...manualForm, txnType: e.target.value })} className="h-8 text-sm">
                {Object.entries(TXN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Credit (In) ₹</Label>
              <Input type="number" min="0" className="h-8 text-sm" value={manualForm.credit} onChange={(e) => setManualForm({ ...manualForm, credit: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Debit (Out) ₹</Label>
              <Input type="number" min="0" className="h-8 text-sm" value={manualForm.debit} onChange={(e) => setManualForm({ ...manualForm, debit: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input className="h-8 text-sm" value={manualForm.description} onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })} placeholder="e.g. Salary for July" />
            </div>
            <div>
              <Label className="text-xs">Party Name</Label>
              <Input className="h-8 text-sm" value={manualForm.partyName} onChange={(e) => setManualForm({ ...manualForm, partyName: e.target.value })} placeholder="e.g. XYZ Supplier" />
            </div>
            <div>
              <Label className="text-xs">Reference No.</Label>
              <Input className="h-8 text-sm" value={manualForm.referenceNo} onChange={(e) => setManualForm({ ...manualForm, referenceNo: e.target.value })} placeholder="e.g. INV-001" />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button size="sm" disabled={saving} onClick={handleManualSubmit}>{saving ? 'Saving…' : 'Add Entry'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowManual(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Party</th>
                  <th className="px-4 py-2.5">Ref No.</th>
                  <th className="px-4 py-2.5 text-right text-red-700">Debit (Out)</th>
                  <th className="px-4 py-2.5 text-right text-green-700">Credit (In)</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                      Loading entries…
                    </td>
                  </tr>
                )}
                {!isLoading && entries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[var(--color-text-secondary)]">
                      No entries found for the selected period.
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-surface-3 hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{fmtDate(entry.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${TXN_COLORS[entry.txnType] || 'bg-gray-100 text-gray-600'}`}>
                        {TXN_LABELS[entry.txnType] || entry.txnType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate text-xs" title={entry.description}>{entry.description || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{entry.partyName || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">{entry.referenceNo || '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {entry.debit > 0 ? (
                        <span className="font-medium text-red-600">− {formatCurrency(entry.debit)}</span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {entry.credit > 0 ? (
                        <span className="font-medium text-green-600">+ {formatCurrency(entry.credit)}</span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${(entry.balance ?? 0) >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                      {formatCurrency(entry.balance ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-3 px-4 py-3">
            <span className="text-xs text-[var(--color-text-secondary)]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} entries
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CompanyLedgerPage;
