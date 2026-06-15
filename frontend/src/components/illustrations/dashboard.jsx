export function DashboardMeshBg({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dashGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dashGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-brand-600)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <circle cx="680" cy="40" r="120" fill="url(#dashGrad1)" />
      <circle cx="120" cy="160" r="90" fill="url(#dashGrad2)" />
      <path d="M0 120 Q200 80 400 100 T800 90" stroke="var(--color-brand-500)" strokeOpacity="0.08" strokeWidth="1.5" fill="none" />
      <path d="M0 150 Q250 110 500 130 T800 115" stroke="var(--color-brand-500)" strokeOpacity="0.05" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function KpiRevenueIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4" y="8" width="24" height="16" rx="4" fill="currentColor" fillOpacity="0.15" />
      <path d="M10 18h12M10 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="22" cy="12" r="3" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

export function KpiDealersIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="12" cy="13" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="21" cy="14" r="3" fill="currentColor" fillOpacity="0.2" />
      <path d="M6 24c0-3.3 2.7-6 6-6s6 2.7 6 6M17 24c0-2.5 1.8-4.5 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function KpiGrnIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M8 12l8-5 8 5v10l-8 5-8-5V12z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 17v6M13 15.5l3 1.5 3-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiTicketsIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M8 14c0-4 3.5-7 8-7s8 3 8 7v2.5c0 1.2.5 2.3 1.3 3.1L24 22H8l-1.3-2.4A4.2 4.2 0 018 16.5V14z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 25a3 3 0 006 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const KPI_SVG_ICONS = {
  revenue: KpiRevenueIcon,
  dealers: KpiDealersIcon,
  grn: KpiGrnIcon,
  tickets: KpiTicketsIcon,
};
