import React, { useEffect } from 'react';
import { GlassCard } from '../ui';
import { FiArrowRight, FiCpu, FiClock, FiShield } from 'react-icons/fi';
import { useCMSPageBundle } from '../../cms/hooks/useCMSPageBundle';
import { useCMSProducts } from '../../cms/hooks/useCMSProducts';

export default function InverterPage({ onViewDetails, onClose }) {
  const { getSection } = useCMSPageBundle('inverter');
  const hero = getSection('inverter-hero');
  const { getCatalog } = useCMSProducts();
  const invertersData = getCatalog('inverters');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 pb-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-xs font-bold tracking-widest text-purple-700 uppercase bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/25 mb-4">
            {hero.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gradient mb-6 font-display bg-gradient-to-r from-zinc-950 to-amber-500 bg-clip-text text-transparent">
            {hero.title}
          </h1>
          <p className="text-zinc-550 text-lg font-light leading-relaxed">{hero.subtitle}</p>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-10 bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
            {hero.gridTitle || 'Premium Inverter Series'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {invertersData.map((product) => (
              <GlassCard key={product.id} className="p-8 border-zinc-200/60 bg-white hover:shadow-lg transition-all duration-500 rounded-2xl group">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-500/10 px-3 py-1 rounded-md">{product.tag}</span>
                <div className="h-48 flex items-center justify-center my-6">
                  <img src={product.image} alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">{product.name}</h3>
                <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{product.subtitle}</p>
                <ul className="space-y-2 mb-6">
                  {(product.features || []).map((f) => (
                    <li key={f} className="text-xs text-zinc-600 flex items-center gap-2">
                      <FiShield className="text-purple-500 shrink-0" size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                  <span className="text-lg font-black text-zinc-900">{product.price}</span>
                  <button
                    onClick={() => onViewDetails?.(product.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-4 py-2 rounded-full"
                  >
                    View Details <FiArrowRight size={14} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
