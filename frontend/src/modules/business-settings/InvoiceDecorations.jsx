/** SVG corner flourish — ornate gold frame like premium GST invoices */
export function CornerFlourish({ color = '#c9a227', className = '', size = 36 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 34V12c0-5 2.5-8 7.5-8H28"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M6 30c0-8 4-12 12-12"
        stroke={color}
        strokeWidth="0.75"
        strokeOpacity="0.55"
      />
      <circle cx="5" cy="31" r="1.75" fill={color} />
      <circle cx="10" cy="26" r="1" fill={color} fillOpacity="0.5" />
    </svg>
  );
}

/** Subtle festival watermark — professional SVG, no emoji */
export function FestivalWatermark({ motif, color, opacity = 0.06 }) {
  if (!motif) return null;
  const motifs = {
    diya: (
      <g fill={color} fillOpacity={opacity}>
        <ellipse cx="50" cy="72" rx="18" ry="6" />
        <path d="M50 30c-8 12-12 28-12 38h24c0-10-4-26-12-38z" />
        <ellipse cx="50" cy="28" rx="6" ry="10" fillOpacity={opacity * 1.5} />
      </g>
    ),
    lotus: (
      <g fill={color} fillOpacity={opacity}>
        <ellipse cx="50" cy="55" rx="8" ry="22" transform="rotate(-20 50 55)" />
        <ellipse cx="50" cy="55" rx="8" ry="22" transform="rotate(20 50 55)" />
        <ellipse cx="50" cy="55" rx="8" ry="22" />
        <circle cx="50" cy="48" r="5" fillOpacity={opacity * 1.8} />
      </g>
    ),
    rangoli: (
      <g stroke={color} strokeOpacity={opacity * 2} fill="none" strokeWidth="1">
        <circle cx="50" cy="50" r="28" />
        <circle cx="50" cy="50" r="18" />
        <circle cx="50" cy="50" r="8" />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1="50" y1="50" x2={50 + 30 * Math.cos((a * Math.PI) / 180)} y2={50 + 30 * Math.sin((a * Math.PI) / 180)} />
        ))}
      </g>
    ),
    om: (
      <g fill={color} fillOpacity={opacity}>
        <path d="M35 65c0-18 8-30 15-30s15 12 15 30-8 25-15 25-15-7-15-25zm15-22c-5 0-9 8-9 22s4 18 9 18 9-6 9-18-4-22-9-22z" />
        <circle cx="62" cy="38" r="6" />
        <path d="M28 55h8v18h-8z" />
      </g>
    ),
    kite: (
      <g fill={color} fillOpacity={opacity}>
        <path d="M50 20 L68 50 L50 65 L32 50 Z" />
        <line x1="50" y1="65" x2="50" y2="85" stroke={color} strokeOpacity={opacity * 2} />
      </g>
    ),
    floral: (
      <g fill={color} fillOpacity={opacity}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="50" cy="38" rx="6" ry="14" transform={`rotate(${a} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="6" fillOpacity={opacity * 2} />
      </g>
    ),
    trident: (
      <g stroke={color} strokeOpacity={opacity * 2.5} fill="none" strokeWidth="2" strokeLinecap="round">
        <line x1="50" y1="78" x2="50" y2="28" />
        <line x1="50" y1="35" x2="35" y2="22" />
        <line x1="50" y1="35" x2="65" y2="22" />
        <line x1="50" y1="42" x2="38" y2="30" />
        <line x1="50" y1="42" x2="62" y2="30" />
      </g>
    ),
    sparkle: (
      <g fill={color} fillOpacity={opacity * 2}>
        <path d="M50 25l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" />
        <path d="M72 55l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" opacity="0.6" />
      </g>
    ),
    garland: (
      <g stroke={color} strokeOpacity={opacity * 2} fill="none" strokeWidth="1.5">
        <path d="M15 45 Q50 70 85 45" />
        <circle cx="25" cy="52" r="3" fill={color} fillOpacity={opacity} />
        <circle cx="40" cy="60" r="3" fill={color} fillOpacity={opacity} />
        <circle cx="60" cy="60" r="3" fill={color} fillOpacity={opacity} />
        <circle cx="75" cy="52" r="3" fill={color} fillOpacity={opacity} />
      </g>
    ),
    bow: (
      <g fill={color} fillOpacity={opacity}>
        <ellipse cx="38" cy="50" rx="14" ry="10" />
        <ellipse cx="62" cy="50" rx="14" ry="10" />
        <circle cx="50" cy="50" r="5" fillOpacity={opacity * 2} />
      </g>
    ),
  };

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {motifs[motif]}
    </svg>
  );
}

export function GoldDivider({ color, className = '' }) {
  return (
    <div className={`relative h-px w-full ${className}`}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)` }} />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ background: color }} />
    </div>
  );
}

import { HAION_BRAND_LOGO } from '@/constants/business';

export function HaionBrandStrip({ accent, accentLight, businessName }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-2"
      style={{ background: accentLight, borderTop: `1px solid ${accent}33` }}
    >
      <div className="flex items-center gap-2">
        <img
          src={HAION_BRAND_LOGO}
          alt="Haion"
          className="h-6 w-6 rounded-full object-contain"
        />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          Haion ERP
        </span>
      </div>
      <span className="text-[8px] font-medium tracking-wide text-slate-500">
        {businessName}
      </span>
    </div>
  );
}
