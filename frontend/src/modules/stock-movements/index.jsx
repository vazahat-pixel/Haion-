import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { stockMovementsService } from '@/services/stock-movements.service';
import { createListTable } from '../shared/createListTable';
import { stockMovementColumns } from './columns.config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EnterpriseTable } from '@/components/data-display/EnterpriseTable';
import { Search } from 'lucide-react';

export const StockMovementTable = createListTable({
  service: stockMovementsService,
  queryKey: queryKeys.stockMovements.list,
  columns: stockMovementColumns,
  searchKeys: ['sku', 'name', 'reference', 'performedBy', 'movementType'],
  filterKey: 'action',
  filterOptions: [
    { value: 'GRN', label: 'GRN' },
    { value: 'DISPATCH', label: 'Dispatch' },
    { value: 'BILLING_DEDUCTION', label: 'Billing' },
    { value: 'DEALER_CONFIRM', label: 'Dealer GRN' },
    { value: 'WAREHOUSE_TRANSFER', label: 'Warehouse Transfer' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
  ],
  searchPlaceholder: 'Search movements…',
});

const skuHistoryColumns = stockMovementColumns.filter((c) => c.key !== 'sku');

export function SkuHistoryPanel() {
  const [sku, setSku] = useState('');
  const [querySku, setQuerySku] = useState('');

  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.stockMovements.skuHistory(querySku),
    queryFn: () => stockMovementsService.getSkuHistory(querySku),
    enabled: !!querySku,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SKU Movement History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="sku-search">SKU</Label>
            <Input
              id="sku-search"
              placeholder="e.g. MOT-5HP-001"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && setQuerySku(sku.trim())}
            />
          </div>
          <Button type="button" onClick={() => setQuerySku(sku.trim())} disabled={!sku.trim()}>
            <Search className="h-4 w-4" /> Lookup
          </Button>
        </div>
        {querySku && (
          <EnterpriseTable
            columns={skuHistoryColumns}
            data={data}
            isLoading={isLoading}
            error={isError ? 'Failed to load SKU history' : null}
            onRetry={refetch}
          />
        )}
      </CardContent>
    </Card>
  );
}
