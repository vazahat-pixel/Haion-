import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { warehousesService } from '@/services/warehouses.service';
import { LoadingState } from '@/components/feedback/LoadingState';

export function NewGRNButton() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', 'grn-picker'],
    queryFn: () => warehousesService.getList({ perPage: 50 }),
    enabled: open,
  });

  const warehouses = data?.data || [];

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New GRN
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="Select Warehouse" description="Choose where goods are being received">
        {isLoading && <LoadingState message="Loading warehouses…" />}
        {!isLoading && warehouses.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--color-text-secondary)]">No warehouses available.</p>
        )}
        <ul className="space-y-2">
          {warehouses.map((wh) => (
            <li key={wh.id}>
              <Link
                to={`/admin/warehouses/${wh.id}/grn`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg border border-surface-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2"
              >
                <Warehouse className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="font-medium">{wh.name}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{wh.code} · {wh.city}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
