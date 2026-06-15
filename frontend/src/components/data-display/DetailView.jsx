import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';

function formatValue(field, value) {
  if (value == null || value === '') return '—';
  switch (field.format) {
    case 'currency': return formatCurrency(value);
    case 'number': return formatNumber(value);
    case 'date': return formatDate(value);
    case 'datetime': return formatDateTime(value);
    case 'badge': return <StatusBadge status={value} />;
    case 'image': return value ? (
      <img src={value.startsWith('http') ? value : `${import.meta.env.VITE_API_BASE_URL || ''}${value}`} alt="" className="mt-1 h-24 w-24 rounded-lg border border-surface-3 object-cover" />
    ) : '—';
    default: return String(value);
  }
}

export function DetailView({ title, fields = [], data, isLoading, isError, onRetry, actions, sections }) {
  if (isLoading) return <LoadingState message="Loading details..." />;
  if (isError) return <ErrorState message="Failed to load details" onRetry={onRetry} />;
  if (!data) return <ErrorState message="Record not found" />;

  if (sections) {
    return (
      <div className="space-y-6">
        {actions && <div className="flex justify-end gap-2">{actions}</div>}
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">{field.label}</dt>
                    <dd className="mt-1 text-sm text-[var(--color-text-primary)]">{formatValue(field, data[field.key])}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title || data.name || data.title || 'Details'}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.key}>
              <dt className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">{field.label}</dt>
              <dd className="mt-1 text-sm text-[var(--color-text-primary)]">{formatValue(field, data[field.key])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
