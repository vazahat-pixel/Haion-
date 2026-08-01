import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { CheckCircle2, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { partiesService } from '@/services/parties.service';
import { paymentsService } from '@/services/payments.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

const PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'UPI', 'NETBANKING', 'CHEQUE', 'OTHER'];

export function PaymentInForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partyBalance, setPartyBalance] = useState(null);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const form = useForm({
    defaultValues: {
      partyId: '',
      amount: '',
      discount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: 'CASH',
      referenceNo: '',
      notes: '',
    },
  });

  // Fetch next payment number
  const { data: nextNoData } = useQuery({
    queryKey: queryKeys.payments.nextNumber('PAYMENT_IN'),
    queryFn: () => paymentsService.getNextNumber('PAYMENT_IN'),
  });

  // Fetch parties list
  const { data: partiesRes } = useQuery({
    queryKey: queryKeys.parties.list({ status: 'ACTIVE', perPage: 200 }),
    queryFn: () => partiesService.getList({ status: 'ACTIVE', perPage: 200 }),
  });
  const parties = partiesRes?.data ?? [];

  // When party changes, fetch ledger balance and pending invoices
  useEffect(() => {
    if (!selectedPartyId) {
      setPartyBalance(null);
      setPendingInvoices([]);
      setSettlements([]);
      return;
    }
    Promise.all([
      paymentsService.getLedger(selectedPartyId),
      paymentsService.getPendingInvoices(selectedPartyId),
    ]).then(([ledger, invoices]) => {
      setPartyBalance(ledger?.balance ?? 0);
      const inv = invoices ?? [];
      setPendingInvoices(inv);
      setSettlements(inv.map((i) => ({
        invoice: i.id,
        invoiceNo: i.invoiceNo,
        invoiceAmount: i.total,
        balanceAmount: i.balanceAmount,
        tds: 0,
        discount: 0,
        amountReceived: 0,
      })));
    }).catch(() => {});
  }, [selectedPartyId]);

  const watchAmount = Number(form.watch('amount')) || 0;
  const watchDiscount = Number(form.watch('discount')) || 0;
  const netAmount = Math.max(0, watchAmount - watchDiscount);
  const totalSettled = settlements.reduce((s, r) => s + (Number(r.amountReceived) || 0), 0);

  const onPartyChange = (e) => {
    setSelectedPartyId(e.target.value);
    form.setValue('partyId', e.target.value);
  };

  const updateSettlement = (idx, field, value) => {
    setSettlements((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const autoAllocate = () => {
    let remaining = netAmount;
    setSettlements((prev) =>
      prev.map((row) => {
        if (remaining <= 0) return { ...row, amountReceived: 0 };
        const allocate = Math.min(remaining, row.balanceAmount);
        remaining -= allocate;
        return { ...row, amountReceived: allocate };
      })
    );
  };

  const handleSave = async () => {
    const data = form.getValues();
    if (!data.partyId) { toast.error('Select a party'); return; }
    if (!data.amount || Number(data.amount) <= 0) { toast.error('Enter a valid amount'); return; }

    setSaving(true);
    try {
      const payload = {
        partyId: data.partyId,
        amount: Number(data.amount),
        discount: Number(data.discount) || 0,
        paymentDate: data.paymentDate,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo,
        notes: data.notes,
        settledInvoices: settlements
          .filter((s) => Number(s.amountReceived) > 0)
          .map((s) => ({
            invoice: s.invoice,
            invoiceNo: s.invoiceNo,
            invoiceAmount: s.invoiceAmount,
            tds: Number(s.tds) || 0,
            discount: Number(s.discount) || 0,
            amountReceived: Number(s.amountReceived) || 0,
          })),
      };
      const result = await paymentsService.createPaymentIn(payload);
      toast.success(`Payment In recorded — ${result.paymentNo}`);
      navigate(`/admin/sales/payment-in/${result.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header info */}
      {nextNoData?.paymentNo && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Payment No: <span className="font-mono font-semibold text-[var(--color-text-primary)]">{nextNoData.paymentNo}</span>
        </p>
      )}

      {/* Card: Party & Amount */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Payment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Party */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Party Name *</Label>
              <Select value={selectedPartyId} onChange={onPartyChange}>
                <option value="">Select party…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </Select>
            </div>

            {partyBalance !== null && (
              <div className="sm:col-span-2">
                <div className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  partyBalance > 0
                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400'
                    : partyBalance < 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-surface-2 text-[var(--color-text-secondary)] border border-surface-3'
                )}>
                  <IndianRupee className="h-4 w-4 shrink-0" />
                  <span>Current Balance: {formatCurrency(Math.abs(partyBalance))}</span>
                  {partyBalance > 0 && <span className="text-xs font-normal">(Party owes you)</span>}
                  {partyBalance < 0 && <span className="text-xs font-normal">(You owe party)</span>}
                </div>
              </div>
            )}

            <div>
              <Label>Amount Received *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...form.register('amount')}
              />
            </div>
            <div>
              <Label>Payment In Discount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                {...form.register('discount')}
              />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" {...form.register('paymentDate')} />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select {...form.register('paymentMode')}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reference No / Cheque No</Label>
              <Input placeholder="Bank ref, cheque no, UPI ref…" {...form.register('referenceNo')} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input placeholder="Enter notes" {...form.register('notes')} />
            </div>
          </div>

          {netAmount > 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 px-4 py-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Net Amount: </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(netAmount)}</span>
              {watchDiscount > 0 && (
                <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                  ({formatCurrency(watchAmount)} − {formatCurrency(watchDiscount)} discount)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Settlement */}
      {pendingInvoices.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Settle Invoices with this Payment</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={autoAllocate}>
              Auto Allocate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2 text-right">Invoice Amt</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-right">TDS</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">
                        No pending invoices for this party
                      </td>
                    </tr>
                  ) : (
                    settlements.map((row, idx) => (
                      <tr key={row.invoice} className="border-b border-surface-3">
                        <td className="px-3 py-2 font-mono text-xs">{row.invoiceNo}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.invoiceAmount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-amber-600">{formatCurrency(row.balanceAmount)}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-20 text-right text-xs h-7"
                            value={row.tds}
                            onChange={(e) => updateSettlement(idx, 'tds', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-24 text-right text-xs h-7"
                            value={row.discount}
                            onChange={(e) => updateSettlement(idx, 'discount', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-28 text-right text-xs h-7"
                            value={row.amountReceived}
                            onChange={(e) => updateSettlement(idx, 'amountReceived', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {settlements.length > 0 && (
                  <tfoot>
                    <tr className="bg-surface-2 text-sm font-semibold">
                      <td colSpan={5} className="px-3 py-2 text-right">Total Settled:</td>
                      <td className={cn('px-3 py-2 text-right tabular-nums', totalSettled > netAmount && 'text-red-600')}>
                        {formatCurrency(totalSettled)}
                        {totalSettled > netAmount && <span className="ml-1 text-xs font-normal">(exceeds payment!)</span>}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingInvoices.length === 0 && selectedPartyId && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
            No pending invoices — payment will be recorded as advance/unallocated.
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Payment In'}
        </Button>
      </div>
    </div>
  );
}
