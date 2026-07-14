import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { DealerReportTable } from '@/modules/dealer-reports';
import { ReportHub } from '@/modules/reports/ReportHub';
import { dealerReportsService } from '@/services/dealer-reports.service';
import { cn } from '@/utils/cn';

export default function DealerReportsPage() {
  const [tab, setTab] = useState('hub');

  return (
    <PageShell title="Reports" subtitle="Sales & GST reports from your live billing data">
      <div className="mb-4 flex gap-1 border-b border-surface-3">
        {[
          { id: 'hub', label: 'Report Library' },
          { id: 'history', label: 'Generated Reports' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-b-2 border-brand-500 text-brand-700'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hub' && (
        <ReportHub
          showCaLink={false}
          runService={dealerReportsService}
          catalogService={dealerReportsService}
          detailBasePath="/dealer/reports"
        />
      )}

      {tab === 'history' && <DealerReportTable />}
    </PageShell>
  );
}
