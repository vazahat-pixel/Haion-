import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { searchService } from '@/services/search.service';
import { cn } from '@/utils/cn';

export function GlobalSearchDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['search', 'global', query],
    queryFn: () => searchService.global(query),
    enabled: open && query.trim().length >= 2,
    staleTime: 10_000,
  });

  const results = data?.results ?? [];

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = (path) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Search" description="Search across products, dealers, customers, orders…">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search…"
          className="pl-9"
        />
      </div>
      {query.trim().length < 2 && (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">Enter at least 2 characters</p>
      )}
      {isFetching && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching…
        </div>
      )}
      {!isFetching && query.trim().length >= 2 && results.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">No results for &ldquo;{query}&rdquo;</p>
      )}
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`}>
            <button
              type="button"
              onClick={() => go(r.path)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2'
              )}
            >
              <span>
                <span className="font-medium">{r.label}</span>
                {r.sublabel && <span className="ml-2 text-[var(--color-text-tertiary)]">{r.sublabel}</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{r.type}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
