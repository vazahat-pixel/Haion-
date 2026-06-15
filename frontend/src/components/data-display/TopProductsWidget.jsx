import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

const TOP_PRODUCTS = [
  { name: 'Industrial Motor 5HP', units: 48, revenue: 1368000 },
  { name: 'Control Panel XL', units: 22, revenue: 994400 },
  { name: 'Conveyor Belt 10m', units: 35, revenue: 434000 },
  { name: 'Hydraulic Pump', units: 18, revenue: 340200 },
];

export function TopProductsWidget() {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Top Products</CardTitle>
        <Link to="/dealer/reports" className="text-xs text-brand-600 hover:underline">View report</Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {TOP_PRODUCTS.map((p, i) => (
            <li key={p.name} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{p.units} units sold</p>
              </div>
              <span className="text-sm font-medium tabular-nums">{formatCurrency(p.revenue)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
