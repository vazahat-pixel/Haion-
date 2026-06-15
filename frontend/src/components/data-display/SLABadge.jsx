import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const CONFIG = {
  ON_TRACK: { label: 'SLA On Track', icon: CheckCircle2, className: 'bg-[var(--color-success-bg)] text-[var(--color-success)]' },
  AT_RISK: { label: 'SLA At Risk', icon: Clock, className: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]' },
  BREACHED: { label: 'SLA Breached', icon: AlertTriangle, className: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' },
};

export function SLABadge({ status, remaining, className }) {
  const cfg = CONFIG[status] || CONFIG.ON_TRACK;
  const Icon = cfg.icon;
  const remainingLabel = remaining != null
    ? (remaining < 0 ? `${Math.abs(remaining)}h overdue` : `${remaining}h remaining`)
    : null;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', cfg.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
      {remainingLabel && <span className="opacity-80">· {remainingLabel}</span>}
    </span>
  );
}
