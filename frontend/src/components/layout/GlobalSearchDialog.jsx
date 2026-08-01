import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Compass, Layers, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchService } from '@/services/search.service';
import { PANELS } from '@/config/panels.config';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export function GlobalSearchDialog({ open, onOpenChange, panel = 'admin' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Extract all page navigation modules for quick search
  const allPageModules = useMemo(() => {
    const pages = [];
    Object.values(PANELS).forEach((p) => {
      p.nav?.forEach((item) => {
        pages.push({
          id: `page-${p.id}-${item.id}`,
          type: 'PAGE',
          label: item.label,
          sublabel: `${p.label} Page`,
          path: item.path,
          icon: item.icon || Compass,
          panel: p.id,
        });
      });
    });
    return pages;
  }, []);

  // Filter page modules based on user query
  const filteredPageModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Prioritize current panel nav when query is empty
      const currentPanelNav = PANELS[panel]?.nav || [];
      return currentPanelNav.slice(0, 8).map((item) => ({
        id: `page-${panel}-${item.id}`,
        type: 'QUICK PAGE',
        label: item.label,
        sublabel: `${PANELS[panel]?.label || 'Dashboard'} Module`,
        path: item.path,
        icon: item.icon || Compass,
        panel,
      }));
    }

    return allPageModules.filter((p) =>
      p.label.toLowerCase().includes(q) ||
      p.sublabel.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, panel, allPageModules]);

  // Live database entity search query
  const { data: dbData, isFetching: isDbFetching } = useQuery({
    queryKey: ['search', 'global', query],
    queryFn: () => searchService.global(query),
    enabled: open && query.trim().length >= 2,
    staleTime: 10_000,
  });

  const dbResults = useMemo(() => {
    const raw = dbData?.results ?? [];
    return raw.map((r) => ({
      id: `db-${r.type}-${r.id}`,
      type: r.type || 'RECORD',
      label: r.label,
      sublabel: r.sublabel || 'Database Record',
      path: r.path,
      icon: Layers,
    }));
  }, [dbData]);

  // Combined Results list
  const combinedResults = useMemo(() => {
    return [...filteredPageModules, ...dbResults];
  }, [filteredPageModules, dbResults]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    if (!item?.path) return;
    onOpenChange(false);
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, combinedResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedResults.length) % Math.max(1, combinedResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedResults[selectedIndex]) {
        handleSelect(combinedResults[selectedIndex]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-surface-3 bg-surface-1 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Dashboard Search</DialogTitle>
        <DialogDescription className="sr-only">Search all module pages and records in the system</DialogDescription>
        
        {/* Search Header Input */}
        <div className="relative border-b border-surface-3 px-4 py-3 bg-surface-2/40 flex items-center gap-3">
          <Search className="h-5 w-5 shrink-0 text-brand-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type page name (e.g. Referrals, Dealers, Inventory) or customer, order..."
            className="flex-1 bg-transparent text-sm font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
          />
          {isDbFetching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-500" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-surface-3 bg-surface-1 px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {query.trim().length === 0 && (
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[var(--color-text-tertiary)] uppercase flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-brand-500" /> Quick Access Dashboard Pages
            </div>
          )}

          {query.trim().length > 0 && filteredPageModules.length > 0 && (
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[var(--color-text-tertiary)] uppercase flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-brand-500" /> Module Pages ({filteredPageModules.length})
            </div>
          )}

          {combinedResults.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 group',
                  isSelected
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold ring-1 ring-brand-500/30'
                    : 'text-[var(--color-text-primary)] hover:bg-surface-2'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isSelected ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-3/60 text-[var(--color-text-secondary)]'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight">{item.label}</p>
                    {item.sublabel && (
                      <p className="truncate text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{item.sublabel}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wide uppercase',
                      item.type.includes('PAGE')
                        ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                        : 'bg-surface-3 text-[var(--color-text-secondary)]'
                    )}
                  >
                    {item.type}
                  </span>
                  {isSelected ? (
                    <CornerDownLeft className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                  )}
                </div>
              </button>
            );
          })}

          {query.trim().length >= 2 && combinedResults.length === 0 && !isDbFetching && (
            <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
              No matching pages or records found for &ldquo;<span className="font-semibold text-[var(--color-text-primary)]">{query}</span>&rdquo;
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="border-t border-surface-3 px-4 py-2 bg-surface-2/30 flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-surface-3 bg-surface-1 px-1 text-[9px] font-mono">↑</kbd>
              <kbd className="rounded border border-surface-3 bg-surface-1 px-1 text-[9px] font-mono">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-surface-3 bg-surface-1 px-1 text-[9px] font-mono">↵</kbd> select
            </span>
          </div>
          <span>Haion Spotlight Search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
