import { DealerPageShell } from '@/components/layout/DealerPageShell';
import { DealerMobileQuickSale } from '@/modules/dealer-sales/DealerMobileQuickSale';

export default function DealerQuickSalePage() {
  return (
    <DealerPageShell title="Quick Sale" subtitle="Phone counter — bill & warranty in one tap">
      <DealerMobileQuickSale />
    </DealerPageShell>
  );
}
