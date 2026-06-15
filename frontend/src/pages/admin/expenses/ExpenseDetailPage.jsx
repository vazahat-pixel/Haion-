import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ExpenseDetail } from '@/modules/expenses';
import { expensesService } from '@/services/expenses.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function ExpenseDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expensesService.getDetail(id),
  });

  const approve = useMutation({
    mutationFn: () => expensesService.updateStatus(id, 'APPROVED'),
    onSuccess: () => {
      toast.success('Expense approved');
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
    onError: () => toast.error('Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: () => expensesService.updateStatus(id, 'REJECTED'),
    onSuccess: () => {
      toast.success('Expense rejected');
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
    onError: () => toast.error('Failed to reject'),
  });

  const pending = data?.status === 'PENDING';

  return (
    <DetailPageShell
      back={{ label: 'Expenses', href: '/admin/expenses' }}
      title={data?.expenseNo || 'Expense Details'}
      subtitle={data ? `${data.category} · ₹${Number(data.amount || 0).toLocaleString('en-IN')}` : 'Expense claim'}
      actions={pending ? (
        <>
          <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
            <CheckCircle className="h-4 w-4" /> Approve
          </Button>
        </>
      ) : null}
    >
      <ExpenseDetail id={id} />
    </DetailPageShell>
  );
}
