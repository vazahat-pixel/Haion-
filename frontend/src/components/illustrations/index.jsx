export { DashboardMeshBg, KPI_SVG_ICONS, KpiRevenueIcon, KpiDealersIcon, KpiGrnIcon, KpiTicketsIcon } from './dashboard';
export { AdminPageMesh, MODULE_ICONS } from './admin';

export function EmptyBoxIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="24" y="48" width="112" height="88" rx="12" fill="var(--color-surface-2)" stroke="var(--color-surface-3)" strokeWidth="2" />
      <path d="M24 68 L80 96 L136 68" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <circle cx="80" cy="36" r="20" fill="var(--color-brand-50)" stroke="var(--color-brand-500)" strokeWidth="2" />
      <path d="M72 36 L78 42 L90 30" stroke="var(--color-brand-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ErrorIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="80" cy="80" r="56" fill="var(--color-danger-bg)" stroke="var(--color-danger)" strokeWidth="2" opacity="0.9" />
      <path d="M58 58 L102 102 M102 58 L58 102" stroke="var(--color-danger)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function InventoryIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="32" y="40" width="96" height="80" rx="8" fill="var(--color-surface-2)" stroke="var(--color-surface-3)" strokeWidth="2" />
      <rect x="48" y="56" width="28" height="20" rx="4" fill="var(--color-brand-100)" stroke="var(--color-brand-500)" strokeWidth="1.5" />
      <rect x="84" y="56" width="28" height="20" rx="4" fill="var(--color-brand-100)" stroke="var(--color-brand-500)" strokeWidth="1.5" />
      <rect x="48" y="84" width="64" height="20" rx="4" fill="var(--color-accent-bg)" stroke="var(--color-accent)" strokeWidth="1.5" />
      <path d="M80 24 L88 36 H72 Z" fill="var(--color-brand-500)" />
    </svg>
  );
}

export function SearchIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="72" cy="72" r="36" fill="var(--color-surface-2)" stroke="var(--color-brand-500)" strokeWidth="2.5" />
      <path d="M98 98 L124 124" stroke="var(--color-brand-600)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="72" cy="72" r="16" fill="none" stroke="var(--color-brand-200)" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
}

export function ProductsEmptyIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={`${className} animate-float-soft`} viewBox="0 0 160 160" fill="none" aria-hidden>
      <rect x="36" y="44" width="88" height="72" rx="10" fill="var(--color-surface-2)" stroke="var(--color-brand-500)" strokeWidth="2" strokeOpacity="0.4" />
      <rect x="52" y="60" width="32" height="24" rx="4" fill="var(--color-brand-100)" stroke="var(--color-brand-500)" strokeWidth="1.5" />
      <rect x="92" y="60" width="20" height="24" rx="4" fill="var(--color-brand-50)" stroke="var(--color-brand-200)" strokeWidth="1.5" />
      <path d="M52 96h56" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function DealersEmptyIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={`${className} animate-float-soft`} viewBox="0 0 160 160" fill="none" aria-hidden>
      <circle cx="64" cy="68" r="22" fill="var(--color-brand-100)" stroke="var(--color-brand-500)" strokeWidth="2" />
      <circle cx="104" cy="72" r="16" fill="var(--color-surface-2)" stroke="var(--color-brand-300, var(--color-brand-200))" strokeWidth="2" />
      <path d="M36 120c0-16 12.5-28 28-28s28 12 28 28" stroke="var(--color-brand-600)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M88 118c0-10 7-18 16-18" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

export function ApprovalsEmptyIllustration({ className = 'h-32 w-32' }) {
  return (
    <svg className={`${className} animate-float-soft`} viewBox="0 0 160 160" fill="none" aria-hidden>
      <rect x="40" y="32" width="80" height="96" rx="12" fill="var(--color-surface-2)" stroke="var(--color-brand-500)" strokeWidth="2" strokeOpacity="0.35" />
      <circle cx="80" cy="72" r="24" fill="var(--color-brand-50)" stroke="var(--color-brand-500)" strokeWidth="2" />
      <path d="M68 72l8 8 16-16" stroke="var(--color-brand-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
