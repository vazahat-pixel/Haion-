import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ManufactureDetail } from '@/modules/manufacture';
import { manufactureService } from '@/services/manufacture.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

export default function ManufactureDetailPage() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: queryKeys.manufacture.detail(id),
    queryFn: () => manufactureService.getDetail(id),
  });

  const components = data?.components || [];

  return (
    <DetailPageShell
      back={{ label: 'Manufacture', href: '/admin/manufacture' }}
      title={data?.manufactureNo || 'Manufacture Details'}
      subtitle={data ? `${data.finishedName} · ${data.qtyProduced} produced` : 'Manufacture information'}
      actions={(
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/finished-goods"><Package className="h-4 w-4" /> Finished Goods</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/dispatch"><Truck className="h-4 w-4" /> Dispatch</Link>
          </Button>
        </div>
      )}
    >
      <ManufactureDetail id={id} />

      {components.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Materials consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Material</th>
                    <th className="pb-2 text-right">Per unit</th>
                    <th className="pb-2 text-right">Total used</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => (
                    <tr key={c.sku} className="border-t border-[var(--color-border)]">
                      <td className="py-2 font-mono text-xs">{c.sku}</td>
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-right tabular-nums">{c.qtyPerUnit}</td>
                      <td className="py-2 text-right tabular-nums">{c.totalConsumed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.totalCost != null && (
              <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                Material cost (auto): {formatCurrency(data.totalCost)}
                {data.unitCost != null ? ` · ${formatCurrency(data.unitCost)}/unit` : ''}
                {data.sellingPrice != null ? ` · Selling price (admin): ${formatCurrency(data.sellingPrice)}/unit` : ''}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </DetailPageShell>
  );
}
