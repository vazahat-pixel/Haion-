import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, Percent, FileText, Package, Search, MessageCircle } from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { ReportRunDialog } from './ReportRunDialog';

const CATEGORY_ICONS = {
  Favourite: { icon: Star, color: 'text-amber-500' },
  GST: { icon: Percent, color: 'text-emerald-600' },
  Transaction: { icon: FileText, color: 'text-blue-600' },
  Inventory: { icon: Package, color: 'text-violet-600' },
};

export function ReportHub({
  showCaLink = true,
  runService = reportsService,
  catalogService = reportsService,
  detailBasePath = '/admin/reports',
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: catalog, isLoading } = useQuery({
    queryKey: [...queryKeys.reports.all, 'catalog', catalogService === reportsService ? 'admin' : 'dealer'],
    queryFn: catalogService.getCatalog,
  });

  const reports = catalog?.reports || [];
  const categories = catalog?.categories || [];

  const filterChips = useMemo(() => ['All', 'Favourite', ...categories.filter((c) => c !== 'Favourite')], [categories]);

  const filtered = useMemo(() => {
    let items = reports;
    if (filter === 'Favourite') items = items.filter((r) => r.favourite);
    else if (filter !== 'All') items = items.filter((r) => r.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.title.toLowerCase().includes(q) || r.code.includes(q));
    }
    return items;
  }, [reports, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of filtered) {
      const cat = item.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(item);
    }
    return [...map.entries()];
  }, [filtered]);

  const openReport = (report) => {
    setSelected(report);
    setDialogOpen(true);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input
            className="pl-8"
            placeholder="Find report…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {showCaLink && (
          <Link to="/admin/settings/ca-reports">
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              CA Reports Sharing
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="mr-1 self-center text-xs text-[var(--color-text-secondary)]">Filter By</span>
        {filterChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setFilter(chip)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              filter === chip
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-surface-3 bg-surface-1 text-[var(--color-text-secondary)] hover:bg-surface-2'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
          No reports available. Check backend connection.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {grouped.map(([category, items]) => {
            const meta = CATEGORY_ICONS[category] || { icon: FileText, color: 'text-[var(--color-text-secondary)]' };
            const Icon = meta.icon;
            return (
              <div key={category} className="rounded-lg border border-surface-3 bg-surface-1">
                <div className="flex items-center gap-2 border-b border-surface-3 px-4 py-3">
                  <Icon className={cn('h-4 w-4', meta.color)} />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{category}</h3>
                </div>
                <ul className="divide-y divide-surface-2">
                  {items.map((report) => (
                    <li key={report.code}>
                      <button
                        type="button"
                        onClick={() => openReport(report)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2/60"
                      >
                        <span className="text-[var(--color-text-primary)]">{report.title}</span>
                        {report.favourite && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && reports.length > 0 && (
        <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No reports match your search.</p>
      )}

      <ReportRunDialog
        report={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        runService={runService}
        detailBasePath={detailBasePath}
      />
    </div>
  );
}
