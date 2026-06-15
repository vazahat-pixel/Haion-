import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { dealerGrnService } from '@/services/dealer-grn.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export function DealerGRNDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.dealerGrn.detail, dealerGrnService.getDetail, id);

  const confirm = useMutation({
    mutationFn: () => dealerGrnService.confirm(id),
    onSuccess: () => {
      toast.success('GRN confirmed — stock updated');
      qc.invalidateQueries({ queryKey: queryKeys.dealerGrn.all });
      refetch();
    },
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{data.grnNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        {data.status === 'PENDING' && (
          <Button size="sm" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
            Confirm Receipt
          </Button>
        )}
      </div>
      <DetailView
        fields={[
          { key: 'dispatchNo', label: 'Dispatch Reference' },
          { key: 'items', label: 'Expected Items', format: 'number' },
          { key: 'received', label: 'Received Items', format: 'number' },
          { key: 'receivedAt', label: 'Received At', format: 'datetime' },
        ]}
        data={data}
      />
    </div>
  );
}
