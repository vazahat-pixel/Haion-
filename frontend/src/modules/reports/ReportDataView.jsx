function formatCell(value, format) {
  if (value == null || value === '') return '—';
  if (format === 'currency') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value));
  }
  if (format === 'date') {
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'datetime') {
    return new Date(value).toLocaleString('en-IN');
  }
  return String(value);
}

function KeyValueSection({ section }) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
      <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</h4>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {section.rows?.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 border-b border-surface-2 py-1.5 text-sm last:border-0">
            <dt className="text-[var(--color-text-secondary)]">{row.label}</dt>
            <dd className="font-medium text-[var(--color-text-primary)]">{formatCell(row.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TableSection({ section }) {
  const columns = section.columns || [];
  const rows = section.rows || [];

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1 overflow-hidden">
      <div className="border-b border-surface-3 px-4 py-2.5">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{section.title}</h4>
        <p className="text-xs text-[var(--color-text-secondary)]">{rows.length} records from database</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-surface-2 text-[var(--color-text-secondary)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2 font-medium">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-[var(--color-text-secondary)]">
                  No records for selected period
                </td>
              </tr>
            ) : rows.map((row, idx) => (
              <tr key={idx} className="border-t border-surface-2 hover:bg-surface-2/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-[var(--color-text-primary)]">
                    {formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoteSection({ section }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
      {section.text}
    </div>
  );
}

export function ReportDataView({ data }) {
  if (!data) return null;

  const sections = data.sections || [];
  const meta = data.meta;

  return (
    <div className="space-y-4">
      {meta && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-xs text-brand-900">
          <span>Source: <strong>{meta.source || 'database'}</strong></span>
          {meta.periodFrom && (
            <span>Period: {formatCell(meta.periodFrom, 'date')} – {formatCell(meta.periodTo, 'date')}</span>
          )}
          {meta.generatedAt && (
            <span>Generated: {formatCell(meta.generatedAt, 'datetime')}</span>
          )}
        </div>
      )}

      {sections.map((section, i) => {
        if (section.type === 'keyValue') return <KeyValueSection key={i} section={section} />;
        if (section.type === 'table') return <TableSection key={i} section={section} />;
        if (section.type === 'note') return <NoteSection key={i} section={section} />;
        return null;
      })}
    </div>
  );
}
