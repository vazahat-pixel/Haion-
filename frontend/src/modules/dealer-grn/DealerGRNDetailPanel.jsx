import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Printer } from 'lucide-react';

import { useEntityDetail } from '@/hooks/useEntityDetail';

import { dealerGrnService } from '@/services/dealer-grn.service';

import { queryKeys } from '@/services/api/queryKeys';

import { DetailView } from '@/components/data-display/DetailView';

import { StatusBadge } from '@/components/data-display/StatusBadge';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { toast } from '@/utils/toast';



export function DealerGRNDetailPanel({ id }) {

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.dealerGrn.detail, dealerGrnService.getDetail, id);

  const [received, setReceived] = useState({});



  const confirm = useMutation({

    mutationFn: () => {

      const receivedItems = (data?.lineItems || []).map((line) => ({

        sku: line.sku,

        receivedQty: Number(received[line.sku] ?? line.quantity),

      }));

      return dealerGrnService.confirm(id, receivedItems);

    },

    onSuccess: () => {
      toast.success('GRN confirmed — stock updated');

      qc.invalidateQueries({ queryKey: queryKeys.dealerGrn.all });

      refetch();

    },

    onError: (err) => {

      toast.error(err?.response?.data?.message || 'Failed to confirm GRN');

    },

  });



  if (isLoading || isError || !data) {

    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;

  }



  const pending = data.status === 'PENDING_VERIFICATION';
  const hasDiscrepancy = (data.lineItems || []).some(
    (line) => line.receivedQty != null && line.receivedQty !== line.quantity
  );

  const printGrn = () => window.print();



  return (

    <div className="space-y-4">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <h2 className="text-lg font-semibold">{data.grnNo}</h2>

          <StatusBadge status={data.status} />

        </div>

        {pending && (
          <Button size="sm" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
            Confirm Receipt
          </Button>
        )}
        {!pending && (
          <Button size="sm" variant="outline" onClick={printGrn}>
            <Printer className="h-3.5 w-3.5" /> Print GRN
          </Button>
        )}
      </div>

      <DetailView

        fields={[

          { key: 'dispatchNo', label: 'Dispatch Reference' },

          { key: 'warehouse', label: 'Warehouse' },

          { key: 'receivedAt', label: 'Received At', format: 'datetime' },

        ]}

        data={data}

      />



      <div className="overflow-x-auto rounded-lg border border-surface-3">

        <table className="w-full text-sm">

          <thead>

            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">

              <th className="px-4 py-2">SKU</th>

              <th className="px-4 py-2">Product</th>

              <th className="px-4 py-2 text-right">Dispatched</th>

              <th className="px-4 py-2 text-right">Received</th>

            </tr>

          </thead>

          <tbody>

            {(data.lineItems || []).map((line) => {

              const dispatched = line.quantity;

              const recv = received[line.sku] ?? line.receivedQty ?? dispatched;

              const mismatch = Number(recv) !== dispatched;

              return (

                <tr key={line.sku} className="border-b border-surface-3">

                  <td className="px-4 py-2 font-mono text-xs">{line.sku}</td>

                  <td className="px-4 py-2">{line.name}</td>

                  <td className="px-4 py-2 text-right tabular-nums">{dispatched}</td>

                  <td className="px-4 py-2 text-right">

                    {pending ? (

                      <Input

                        type="number"

                        min={0}

                        max={dispatched}

                        className="ml-auto h-8 w-20 text-right"

                        value={recv}

                        onChange={(e) => setReceived({ ...received, [line.sku]: e.target.value })}

                      />

                    ) : (

                      <span className={`tabular-nums ${mismatch ? 'font-medium text-amber-600' : ''}`}>{line.receivedQty ?? dispatched}</span>

                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

      {hasDiscrepancy && !pending && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This GRN was confirmed with quantity discrepancies. Received quantities differ from dispatched amounts.
        </div>
      )}

      {pending && (
        <p className="text-xs text-[var(--color-text-secondary)]">

          Adjust received quantities if shipment was partial or short. Discrepancies are recorded in the audit trail.

        </p>

      )}

    </div>

  );

}

