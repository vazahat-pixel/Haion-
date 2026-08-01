import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { AdminReportTable, ReportDeliveriesTable, ReportHub } from '@/modules/reports';
import { MasterAnalyticsReports } from './MasterAnalyticsReports';
import { cn } from '@/utils/cn';

export default function AdminReportsPage() {
  const [tab, setTab] = useState('analytics');

  return (
    <PageShell
      title="Reports & Analytics Hub"
      subtitle="Dealer Shop-wise sales, stock reports, customer analytics, and GST financial reports"
    >
      <div className="mb-4 flex gap-1 border-b border-surface-3">
        {[
          { id: 'analytics', label: 'Master Reports & Analytics' },
          { id: 'hub', label: 'Report Library' },
          { id: 'history', label: 'Generated Reports' },
          { id: 'deliveries', label: 'Email Deliveries' },
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

      {tab === 'analytics' && <MasterAnalyticsReports />}
      {tab === 'hub' && <ReportHub />}

      {tab === 'history' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Reports generated from live database queries. Click any row to view full analysis.
          </p>
          <AdminReportTable />
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Daily (8 AM), weekly (Monday), and monthly automated email deliveries.
          </p>
          <ReportDeliveriesTable />
        </div>
      )}
    </PageShell>
  );
}
