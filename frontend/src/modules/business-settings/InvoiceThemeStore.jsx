import { Check } from 'lucide-react';
import { INVOICE_THEMES, THEME_CATEGORIES, getSuggestedFestivalThemes } from '@/constants/invoiceThemes';
import { CornerFlourish } from './InvoiceDecorations';
import { cn } from '@/utils/cn';

function MiniInvoicePreview({ theme }) {
  return (
    <div className="relative mb-2.5 overflow-hidden rounded-md" style={{ border: `1.5px solid ${theme.border}` }}>
      {theme.ribbonBg && (
        <div
          className="h-2 w-full"
          style={{ background: theme.ribbonBg }}
        />
      )}
      <div className="relative m-1" style={{ border: `1px solid ${theme.borderInner}` }}>
        <CornerFlourish color={theme.border} className="absolute left-0 top-0" size={14} />
        <CornerFlourish color={theme.border} className="absolute right-0 top-0 rotate-90" size={14} />
        <div className="px-2 py-2" style={{ background: theme.headerBg }}>
          <div className="flex items-start justify-between gap-1">
            <div className="h-3 w-3 rounded-full border" style={{ borderColor: theme.border }} />
            <div className="flex-1 space-y-0.5">
              <div className="h-1.5 w-12 rounded-sm" style={{ background: theme.headerText, opacity: 0.7 }} />
              <div className="h-1 w-16 rounded-sm bg-slate-300" />
            </div>
            <div className="h-1.5 w-8 rounded-sm" style={{ background: theme.accent }} />
          </div>
        </div>
        <div className="h-px" style={{ background: theme.border }} />
        <div className="grid grid-cols-2 gap-px bg-slate-200">
          <div className="h-4 bg-white" />
          <div className="h-4 bg-white" />
        </div>
        <div className="h-3" style={{ background: theme.tableHead }} />
        <div className="space-y-px p-1">
          <div className="h-1 w-full rounded-sm bg-slate-100" />
          <div className="h-1 w-3/4 rounded-sm bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={cn(
        'group relative w-full rounded-xl border p-2.5 text-left transition-all duration-200',
        'hover:shadow-lg hover:shadow-black/5',
        selected
          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/25'
          : 'border-surface-3 bg-white hover:border-surface-4'
      )}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
      <MiniInvoicePreview theme={theme} />
      <p
        className="text-[11px] font-semibold text-[var(--color-text-primary)]"
        style={{ fontFamily: theme.fontDisplay }}
      >
        {theme.label}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-[var(--color-text-secondary)]">
        {theme.description}
      </p>
      <div className="mt-2 flex gap-1">
        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: theme.accent }} />
        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: theme.border }} />
        <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: theme.tableHead }} />
      </div>
    </button>
  );
}

export function InvoiceThemeStore({ value, onChange }) {
  const suggested = getSuggestedFestivalThemes();
  const professional = INVOICE_THEMES.filter((t) => t.category === THEME_CATEGORIES.PROFESSIONAL);
  const festival = INVOICE_THEMES.filter((t) => t.category === THEME_CATEGORIES.FESTIVAL);

  return (
    <div className="space-y-5">
      {suggested.length > 0 && (
        <div
          className="rounded-lg border px-3 py-2.5"
          style={{
            borderColor: suggested[0].border + '55',
            background: suggested[0].accentLight,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: suggested[0].accent }}>
            Recommended this month
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
            {suggested.map((t) => t.label).join(' · ')}
          </p>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          {THEME_CATEGORIES.PROFESSIONAL}
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          {professional.map((t) => (
            <ThemeCard key={t.id} theme={t} selected={value === t.id} onSelect={onChange} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          {THEME_CATEGORIES.FESTIVAL}
        </p>
        <p className="mb-2.5 text-[9px] leading-relaxed text-[var(--color-text-tertiary)]">
          Elegant seasonal designs with subtle motifs — Haion branding on every invoice.
        </p>
        <div className="grid max-h-[380px] grid-cols-2 gap-2.5 overflow-y-auto pr-0.5">
          {festival.map((t) => (
            <ThemeCard key={t.id} theme={t} selected={value === t.id} onSelect={onChange} />
          ))}
        </div>
      </div>
    </div>
  );
}
