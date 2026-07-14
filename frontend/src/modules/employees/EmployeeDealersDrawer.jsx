import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { dealersService } from '@/services/dealers.service';
import { employeesService } from '@/services/employees.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';

function toggleSet(set, value) {
  const next = new Set(set);
  const key = String(value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function EmployeeDealersDrawer({ open, onOpenChange, employeeId }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedDealerIds, setSelectedDealerIds] = useState(new Set());

  const { data: dealersRes } = useQuery({
    queryKey: queryKeys.dealers.list({ perPage: 100, status: 'ACTIVE' }),
    queryFn: () => dealersService.getList({ perPage: 100, status: 'ACTIVE' }),
    enabled: open,
  });

  const { data: assignedDealers } = useQuery({
    queryKey: queryKeys.employeeDealers.detail(employeeId || ''),
    queryFn: () => employeesService.getAssignedDealers(employeeId),
    enabled: open && !!employeeId,
  });

  useEffect(() => {
    if (!assignedDealers) return;
    setSelectedDealerIds(new Set(assignedDealers.map((a) => String(a.dealerId))));
  }, [assignedDealers]);

  const dealers = dealersRes?.data ?? dealersRes ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dealers;
    return dealers.filter((d) => String(d.name ?? '').toLowerCase().includes(q) || String(d.city ?? '').toLowerCase().includes(q));
  }, [dealers, search]);

  const save = async () => {
    try {
      const dealerIds = Array.from(selectedDealerIds);
      await employeesService.setAssignedDealers(employeeId, dealerIds);
      toast.success('Dealers updated');
      await qc.invalidateQueries({ queryKey: queryKeys.employeeDealers.detail(employeeId) });
      onOpenChange?.(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save dealers';
      toast.error(msg);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Assign Dealers" description="Map this employee to dealers (PRD 6.10)">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers by name or city…"
            className="flex-1"
          />
        </div>

        <div className="rounded-lg border border-surface-3 bg-surface-1 p-2 max-h-[56vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--color-text-secondary)]">No dealers found.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((d) => {
                const id = String(d.id);
                const checked = selectedDealerIds.has(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-surface-2/80"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                        {d.name}
                      </div>
                      <div className="truncate text-[11px] text-[var(--color-text-secondary)]">
                        {d.city}{d.gstin ? ` · ${d.gstin}` : ''}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelectedDealerIds((s) => toggleSet(s, id))}
                      className="h-4 w-4 rounded border-surface-3 text-brand-500 focus:ring-brand-500/30"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" onClick={save} className="flex-1">
            Save
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

