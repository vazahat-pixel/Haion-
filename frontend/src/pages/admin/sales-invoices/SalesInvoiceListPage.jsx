import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Search } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { salesInvoicesService } from '@/services/sales-invoices.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function Badge({ status }) {
  const map = {
    DRAFT: 'bg-amber-100 text-amber-700',
    SENT: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] || 'bg-surface-2'}`}>{status}</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SalesInvoiceListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filters = { search: search || undefined, status: status || undefined, perPage: 50 };
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.salesInvoices.list(filters),
    queryFn: () => salesInvoicesService.getList(filters),
  });

  const invoices = data?.data || [];

  const cancelMutation = useMutation({
    mutationFn: (id) => salesInvoicesService.cancel(id),
    onSuccess: () => { toast.success('Invoice cancelled'); qc.invalidateQueries({ queryKey: queryKeys.salesInvoices.all }); },
    onError: () => toast.error('Failed to cancel invoice'),
  });

  return (
    <PageShell
      title="Sales Invoices"
      subtitle="B2B invoices raised by admin to registered dealers"
      actions={
        <Button onClick={() => navigate('/admin/sales-invoices/new')}>
          <Plus className="h-4 w-4" /> New Sales Invoice
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input className="w-64 pl-9" placeholder="Search by invoice no, dealer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {isLoading ? <LoadingState message="Loading invoices…" /> : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No sales invoices yet"
          description="Create a sales invoice to bill a dealer"
          action={<Button onClick={() => navigate('/admin/sales-invoices/new')}><Plus className="h-4 w-4" /> New Sales Invoice</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-4 py-3">Invoice No</th>
                    <th className="px-4 py-3">Dealer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-surface-3 hover:bg-surface-2 cursor-pointer" onClick={() => navigate(`/admin/sales-invoices/${inv.id}`)}>
                      <td className="px-4 py-3 font-mono font-semibold text-brand-600">{inv.invoiceNo}</td>
                      <td className="px-4 py-3">{inv.dealerName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtDate(inv.dueDate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(inv.total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">{inv.balanceAmount > 0 ? formatCurrency(inv.balanceAmount) : '—'}</td>
                      <td className="px-4 py-3"><Badge status={inv.status} /></td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => cancelMutation.mutate(inv.id)}>Cancel</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
