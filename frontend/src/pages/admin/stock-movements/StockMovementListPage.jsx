import { PageShell } from '@/components/layout/PageShell';
import { StockMovementTable, SkuHistoryPanel } from '@/modules/stock-movements';
import { StockTransferForm } from '@/modules/stock-movements/StockTransferForm';

export default function StockMovementListPage() {
  return (
    <PageShell
      title="Stock Movements"
      subtitle="Audit trail of inventory changes across warehouses and dealers"
    >
      <div className="space-y-6">
        <StockTransferForm />
        <StockMovementTable />
        <SkuHistoryPanel />
      </div>
    </PageShell>
  );
}
