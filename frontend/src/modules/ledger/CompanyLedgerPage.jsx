/**
 * CompanyLedgerPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin-only: Company / Warehouse ledger showing every rupee in/out.
 * Similar to Party Ledger but for the entire company.
 *
 * Every row that has a counterparty is hard-linked to a Party, and manual
 * entries are posted to that party's own ledger at the same time, so the
 * company ledger and the party ledgers can never drift apart.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Wallet, Download, RefreshCw, Plus,
  Filter, ChevronLeft, ChevronRight, Link2, Unlink, Ban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { companyLedgerService } from '@/services/companyLedger.service';
import { partiesService } from '@/services/parties.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { CompanyLedgerReconciliation } from './CompanyLedgerReconciliation';

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

/** Mirrors PARTY_REQUIRED_TXN_TYPES on the server. */
const PARTY_REQUIRED = ['SALE_TO_DEALER', 'PAYMENT_FROM_DEALER', 'PURCHASE'];

const EMPTY_MANUAL_FORM = {
  txnType: 'ADJUSTMENT',
  partyId: '',
  credit: '',
  debit: '',
  description: '',
  partyName: '',
  referenceNo: '',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Ledger tab ──────────────────────────────────────────────────────────────

function LedgerTab() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [txnType, setTxnType] = useState('');
  const [partyId, setPartyId] = useState('');
  const [linked, setLinked] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);
  const [saving, setSaving] = useState(false);
  const [voidingId, setVoidingId] = useState(null);

  const filterKey = { page, perPage, from, to, txnType, partyId, linked };

  const { data: ledgerRes, isLoading, refetch } = useQuery({
    queryKey: ['company-ledger', filterKey],
    queryFn: () => companyLedgerService.getList(filterKey),
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['company-ledger-summary', { from, to }],
    queryFn: () => companyLedgerService.getSummary({ from, to }),
  });

  const { data: partiesRes } = useQuery({
    queryKey: queryKeys.parties.list({ status: 'ACTIVE', perPage: 200 }),
    queryFn: () => partiesService.getList({ status: 'ACTIVE', perPage: 200 }),
  });
  const parties = partiesRes?.data ?? [];

  const entries = ledgerRes?.data || [];
  const total = ledgerRes?.pagination?.total ?? ledgerRes?.total ?? ledgerRes?.meta?.total ?? entries.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const partyIsRequired = PARTY_REQUIRED.includes(manualForm.txnType);

  const reload = () => {
    refetch();
    refetchSummary();
  };

  const handleExport = () => {
    const headers = 'Date,Type,Description,Party,Party Linked,Reference,Debit,Credit,Balance\n';
    const rows = entries.map((e) =>
      [
        fmtDate(e.date),
        TXN_LABELS[e.txnType] || e.txnType,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${(e.party?.name || e.partyName || '').replace(/"/g, '""')}"`,
        e.isPartyLinked ? 'YES' : 'NO',
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
    if (manualForm.credit && manualForm.debit) {
      return toast.error('An entry can be either credit or debit, not both');
    }
    if (partyIsRequired && !manualForm.partyId) {
      return toast.error(`Select a party — ${TXN_LABELS[manualForm.txnType]} entries must post to a party ledger`);
    }
    setSaving(true);
    try {
      await companyLedgerService.create({
        ...manualForm,
        credit: Number(manualForm.credit) || 0,
        debit: Number(manualForm.debit) || 0,
      });
      toast.success(
        manualForm.partyId
          ? 'Entry added and posted to the party ledger'
          : 'Entry added'
      );
      setShowManual(false);
      setManualForm(EMPTY_MANUAL_FORM);
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const handleVoid = async (entry) => {
    const warning = entry.isPartyLinked
      ? `Void this entry? It will also be reversed on ${entry.party?.name || entry.partyName}'s ledger.`
      : 'Void this entry?';
    if (!window.confirm(warning)) return;
    setVoidingId(entry.id);
    try {
      await companyLedgerService.void(entry.id);
      toast.success('Entry voided on both ledgers');
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to void entry');
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div className="space-y-5">
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

      {/* Party linkage health */}
      {(summary?.unlinkedCount ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center gap-2 py-3 text-sm text-amber-900">
            <Unlink className="h-4 w-4 shrink-0" />
            <span>
              <strong>{summary.unlinkedCount}</strong> of {summary.linkedCount + summary.unlinkedCount} entries in
              this period are not linked to a party, so they do not reach any party ledger.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => { setLinked('false'); setPage(1); }}
            >
              Show unlinked
            </Button>
          </CardContent>
        </Card>
      )}

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
          <div>
            <Label className="text-xs">Party</Label>
            <Select value={partyId} onChange={(e) => { setPartyId(e.target.value); setPage(1); }} className="h-8 min-w-[10rem] text-sm">
              <option value="">All Parties</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="text-xs">Linkage</Label>
            <Select value={linked} onChange={(e) => { setLinked(e.target.value); setPage(1); }} className="h-8 text-sm">
              <option value="">All</option>
              <option value="true">Linked to party</option>
              <option value="false">Unlinked</option>
            </Select>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setFrom(firstOfMonth); setTo(today); setPage(1); }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setFrom(''); setTo(''); setPage(1); }}
            >
              All Time
            </Button>
            <Button variant="outline" size="sm" className="h-8" title="Refresh" onClick={reload}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
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
              <Label className="text-xs">
                Party {partyIsRequired ? '*' : '(optional)'}
              </Label>
              <Select
                value={manualForm.partyId}
                onChange={(e) => setManualForm({ ...manualForm, partyId: e.target.value })}
                className="h-8 text-sm"
                error={partyIsRequired && !manualForm.partyId}
              >
                <option value="">
                  {partyIsRequired ? 'Select a party…' : 'No party (internal entry)'}
                </option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.type}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Reference No.</Label>
              <Input className="h-8 text-sm" value={manualForm.referenceNo} onChange={(e) => setManualForm({ ...manualForm, referenceNo: e.target.value })} placeholder="e.g. INV-001" />
            </div>
            <div>
              <Label className="text-xs">Credit (In) ₹</Label>
              <Input type="number" min="0" className="h-8 text-sm" value={manualForm.credit} onChange={(e) => setManualForm({ ...manualForm, credit: e.target.value, debit: '' })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Debit (Out) ₹</Label>
              <Input type="number" min="0" className="h-8 text-sm" value={manualForm.debit} onChange={(e) => setManualForm({ ...manualForm, debit: e.target.value, credit: '' })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input className="h-8 text-sm" value={manualForm.description} onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })} placeholder="e.g. Salary for July" />
            </div>

            <p className="sm:col-span-2 lg:col-span-3 flex items-start gap-1.5 text-xs text-amber-800">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {manualForm.partyId
                ? 'This entry will also be posted to the selected party\'s ledger, so their outstanding balance stays correct.'
                : 'Without a party this stays an internal company entry and will not appear in any party ledger or in reconciliation.'}
            </p>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button size="sm" disabled={saving} onClick={handleManualSubmit}>{saving ? 'Saving…' : 'Add Entry'}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowManual(false); setManualForm(EMPTY_MANUAL_FORM); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
        <Button size="sm" onClick={() => setShowManual(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Manual Entry
        </Button>
      </div>

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
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[var(--color-text-secondary)]">
                      Loading entries…
                    </td>
                  </tr>
                )}
                {!isLoading && entries.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[var(--color-text-secondary)]">
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
                    <td className="px-4 py-2.5 text-xs">
                      {entry.isPartyLinked ? (
                        <Link
                          to={`/admin/parties/${entry.party.id}`}
                          className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                          title="Open party ledger"
                        >
                          <Link2 className="h-3 w-3 shrink-0" />
                          {entry.party.name || entry.partyName}
                        </Link>
                      ) : entry.partyName ? (
                        <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)]" title="Not linked to a party master">
                          <Unlink className="h-3 w-3 shrink-0 text-amber-500" />
                          {entry.partyName}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]">—</span>
                      )}
                    </td>
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
                    <td className="px-2 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[var(--color-text-tertiary)] hover:text-red-600"
                        title="Void this entry"
                        disabled={voidingId === entry.id}
                        onClick={() => handleVoid(entry)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
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

// ── Page Component ──────────────────────────────────────────────────────────

export function CompanyLedgerPage() {
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Ledger</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Complete financial movement of the warehouse — every rupee in and out.
        </p>
      </div>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger">
          <LedgerTab />
        </TabsContent>
        <TabsContent value="reconciliation">
          <CompanyLedgerReconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CompanyLedgerPage;
