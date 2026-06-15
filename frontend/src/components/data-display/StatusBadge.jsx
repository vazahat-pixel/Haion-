import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '@/constants/status';

export function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="neutral">{status}</Badge>;

  return (
    <Badge variant={config.color} className={size === 'sm' ? 'text-[10px] px-1.5' : ''}>
      {config.label}
    </Badge>
  );
}
