import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { IndianRupee } from 'lucide-react';
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

export function PaymentOutForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partyBalance, setPartyBalance] = useState(null);
  const [pendingPurchases, setPendingPurchases] = useState([]);
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

  // Next payment out number
  const { data: nextNoData } = useQuery({
    queryKey: queryKeys.payments.nextNumber('PAYMENT_OUT'),
    queryFn: () => paymentsService.getNextNumber('PAYMENT_OUT'),
  });

  // Parties
  const { data: partiesRes } = useQuery({
    queryKey: queryKeys.parties.list({ status: 'ACTIVE', perPage: 200 }),
    queryFn: () => partiesService.getList({ status: 'ACTIVE', perPage: 200 }),
  });
  const parties = partiesRes?.data ?? [];

  // Load balance + pending purchases on party change
  useEffect(() => {
    if (!selectedPartyId) {
      setPartyBalance(null);
      setPendingPurchases([]);
      setSettlements([]);
      return;
    }
    Promise.all([
      paymentsService.getLedger(selectedPartyId),
      paymentsService.getPendingPurchases(selectedPartyId),
    ]).then(([ledger, purchases]) => {
      setPartyBalance(ledger?.balance ?? 0);
      const pur = purchases ?? [];
      setPendingPurchases(pur);
      setSettlements(pur.map((p) => ({
        purchase: p.id,
        purchaseNo: p.purchaseNo,
        purchaseAmount: p.total,
        balanceAmount: p.balanceAmount,
        discount: 0,
        amountPaid: 0,
      })));
    }).catch(() => {});
  }, [selectedPartyId]);

  const watchAmount = Number(form.watch('amount')) || 0;
  const watchDiscount = Number(form.watch('discount')) || 0;
  const netAmount = Math.max(0, watchAmount - watchDiscount);
  const totalSettled = settlements.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0);

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
        if (remaining <= 0) return { ...row, amountPaid: 0 };
        const allocate = Math.min(remaining, row.balanceAmount);
        remaining -= allocate;
        return { ...row, amountPaid: allocate };
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
        settledPurchases: settlements
          .filter((s) => Number(s.amountPaid) > 0)
          .map((s) => ({
            purchase: s.purchase,
            purchaseNo: s.purchaseNo,
            purchaseAmount: s.purchaseAmount,
            discount: Number(s.discount) || 0,
            amountPaid: Number(s.amountPaid) || 0,
          })),
      };
      const result = await paymentsService.createPaymentOut(payload);
      toast.success(`Payment Out recorded — ${result.paymentNo}`);
      navigate(`/admin/purchases/payment-out/${result.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {nextNoData?.paymentNo && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Payment No: <span className="font-mono font-semibold text-[var(--color-text-primary)]">{nextNoData.paymentNo}</span>
        </p>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Payment Out Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
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
                  partyBalance < 0
                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400'
                    : 'bg-surface-2 text-[var(--color-text-secondary)] border border-surface-3'
                )}>
                  <IndianRupee className="h-4 w-4 shrink-0" />
                  <span>Current Balance: {formatCurrency(Math.abs(partyBalance))}</span>
                  {partyBalance < 0 && <span className="text-xs font-normal">(You owe this party)</span>}
                  {partyBalance > 0 && <span className="text-xs font-normal">(Party owes you)</span>}
                </div>
              </div>
            )}

            <div>
              <Label>Amount Paid *</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" {...form.register('amount')} />
            </div>
            <div>
              <Label>Payment Out Discount</Label>
              <Input type="number" min="0" step="0.01" placeholder="0" {...form.register('discount')} />
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
              <Input placeholder="Enter note" {...form.register('notes')} />
            </div>
          </div>

          {netAmount > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-2 text-sm">
              <span className="text-[var(--color-text-secondary)]">Net Amount Paid: </span>
              <span className="font-bold text-blue-700 dark:text-blue-400">{formatCurrency(netAmount)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Settlement */}
      {pendingPurchases.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Settle Purchases with this Payment</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={autoAllocate}>Auto Allocate</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-surface-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-3 py-2">Purchase #</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((row, idx) => (
                    <tr key={row.purchase} className="border-b border-surface-3">
                      <td className="px-3 py-2 font-mono text-xs">{row.purchaseNo}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.purchaseAmount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-600">{formatCurrency(row.balanceAmount)}</td>
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
                          value={row.amountPaid}
                          onChange={(e) => updateSettlement(idx, 'amountPaid', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-2 text-sm font-semibold">
                    <td colSpan={4} className="px-3 py-2 text-right">Total Settled:</td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', totalSettled > netAmount && 'text-red-600')}>
                      {formatCurrency(totalSettled)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="button" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Payment Out'}
        </Button>
      </div>
    </div>
  );
}
