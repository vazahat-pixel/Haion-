import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { employeesService } from '@/services/employees.service';
import { queryKeys } from '@/services/api/queryKeys';

function PersonPill({ name, role }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">{name || '—'}</div>
        {role ? (
          <div className="mt-0.5">
            <Badge variant="outline">{String(role).replace(/_/g, ' ')}</Badge>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EmployeeReportingLinePanel({ employeeId }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employeeReportingLine.detail(employeeId),
    queryFn: () => employeesService.getReportingLine(employeeId),
    enabled: !!employeeId,
    staleTime: 60_000,
  });

  const employee = data?.employee;
  const chain = data?.managerChain || [];
  const directReports = data?.directReports || [];

  if (isLoading) {
    return (
      <motion.div className="rounded-lg border border-surface-3 bg-surface-1 p-4 animate-fade-in">
        <div className="text-[12px] font-semibold text-[var(--color-text-secondary)]">Reporting line</div>
        <div className="mt-2 h-5 w-2/3 rounded bg-surface-2 animate-skeleton" />
      </motion.div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
        <div className="text-sm font-semibold text-[var(--color-text-primary)]">Unable to load reporting line</div>
        <button type="button" onClick={refetch} className="mt-2 text-sm text-brand-600 underline">
          Retry
        </button>
      </div>
    );
  }

  const chainForDisplay = [...chain].reverse(); // top -> immediate manager

  return (
    <motion.div
      className="rounded-lg border border-surface-3 bg-surface-1 p-4 glass-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Reporting line</div>
          <div className="mt-1 text-[13px] font-semibold text-[var(--color-text-primary)]">{employee?.name || 'Employee'}</div>
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)]">Direct reports: <span className="font-semibold">{directReports.length}</span></div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {chainForDisplay.length ? (
            chainForDisplay.map((p) => <PersonPill key={p.id} name={p.name} role={p.role} />)
          ) : (
            <div className="text-sm text-[var(--color-text-secondary)]">No reporting manager assigned.</div>
          )}
          <PersonPill name={employee?.name || '—'} role={employee?.role} />
        </div>
      </div>

      {directReports.length ? (
        <div className="mt-4">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">Direct reports</div>
          <div className="mt-2 flex flex-col gap-2">
            {directReports.slice(0, 6).map((d) => (
              <div key={d.id} className="rounded-md border border-surface-3 bg-surface-1 px-3 py-2">
                <div className="text-[13px] font-medium text-[var(--color-text-primary)]">{d.name || '—'}</div>
                <div className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">{d.department || ''}</div>
              </div>
            ))}
            {directReports.length > 6 ? (
              <div className="text-[12px] text-[var(--color-text-secondary)]">+ {directReports.length - 6} more</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

