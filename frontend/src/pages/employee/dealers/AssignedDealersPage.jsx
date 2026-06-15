import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DealerCardGrid } from '@/components/data-display/DealerCardGrid';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function AssignedDealersPage() {
  return (
    <PageShell
      title="Assigned Dealers"
      subtitle="Track dealer performance across green, yellow, and red zones"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/employee/dealer-analytics"><BarChart3 className="h-4 w-4" /> Analytics</Link>
        </Button>
      }
    >
      <DealerCardGrid />
    </PageShell>
  );
}
