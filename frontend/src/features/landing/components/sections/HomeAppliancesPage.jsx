import React, { useEffect } from 'react';
import { GlassCard, SectionHeading } from '../ui';
import { FiArrowRight, FiCpu, FiClock, FiShield } from 'react-icons/fi';
import { useCMSPageBundle } from '../../cms/hooks/useCMSPageBundle';
import { useCMSProducts } from '../../cms/hooks/useCMSProducts';
import { useCMSAppliancesSections } from '../../cms/hooks/useCMSContent';
import { AppliancePricingTable } from './AppliancePricingTable';

import applianceVacuum from '../../assets/appliance-vacuum.webp';
import appliancePurifier from '../../assets/appliance-purifier.webp';
import applianceTv from '../../assets/appliance-tv.webp';
import refri1 from '../../assets/refri-removebg-preview.webp';
import refri2 from '../../assets/refri2-removebg-preview.webp';
import mixer2 from '../../assets/mixer2-removebg-preview.webp';
import mixer1 from '../../assets/mixer1-removebg-preview.webp';
import tv2 from '../../assets/tv2.webp';
import tv3 from '../../assets/tv3.webp';
import tv4 from '../../assets/tv4.webp';
import tv5 from '../../assets/tv5.webp';
import ac from '../../assets/ac-removebg-preview.webp';
import washing1 from '../../assets/wahsing2-removebg-preview.webp';
import washing2 from '../../assets/washing_machine_3-removebg-preview (1).webp';

export default function HomeAppliancesPage({ onViewDetails, onClose }) {
  const { getSection } = useCMSPageBundle('appliances');
  const hero = getSection('appliances-hero');
  const { getCatalog } = useCMSProducts();
  const appliancesData = getCatalog('appliances');
  const sections = useCMSAppliancesSections();
  const priceLabel = sections.specialPriceLabel || 'Special Price';
  const detailsLabel = sections.viewDetailsLabel || 'View Details';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 pb-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        


        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest text-purple-600 uppercase bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/25 mb-4 animate-pulse-slow">
            {hero.badge || 'IoT Household'}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gradient mb-6 font-display">
            {hero.title || 'Haion Home Appliances'}
          </h1>
          <p className="text-zinc-500 text-lg font-light leading-relaxed">
            {hero.subtitle || 'Smarter living made effortless. Explore our connected IoT household devices.'}
          </p>
        </div>

        {/* LED TVs Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-8">
            {sections.tv?.title || 'Smart LED TVs Series'}
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {appliancesData.filter(p => p.id.startsWith('tv')).map((product) => (
              <GlassCard key={product.id} className="w-full md:w-[380px] flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                
                {/* Sale Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                    {product.tag}
                  </span>
                </div>

                {/* Product Image Container */}
                <div className="relative h-64 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                  <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-650/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-56 object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">
                    {product.name}
                  </h3>
                  <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2 mb-4">
                    {product.subtitle}
                  </p>
                  {/* Feature Bullets */}
                  <ul className="inline-block text-left space-y-2 mt-2">
                    {product.features?.map((feat) => (
                      <li key={feat} className="text-xs text-zinc-650 flex items-center gap-2 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Footer */}
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">{priceLabel}</span>
                    <span className="text-xl font-black text-zinc-900">{product.price}</span>
                  </div>
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                  >
                    {detailsLabel}
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </GlassCard>
            ))}
          </div>
        </div>

        <AppliancePricingTable table={sections.pricingTables?.tv} viewDetailsLabel={detailsLabel} onViewDetails={onViewDetails} />

        {/* Smart Refrigerators Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-8">
            {sections.refrigerator?.title || 'Smart Refrigerators'}
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {appliancesData.filter(p => p.id.startsWith('refri')).map((product) => (
              <GlassCard key={product.id} className="w-full md:w-[380px] flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                
                {/* Sale Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                    {product.tag}
                  </span>
                </div>

                {/* Product Image Container */}
                <div className="relative h-64 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                  <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-650/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-56 object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">
                    {product.name}
                  </h3>
                  <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2 mb-4">
                    {product.subtitle}
                  </p>
                  {/* Feature Bullets */}
                  <ul className="inline-block text-left space-y-2 mt-2">
                    {product.features?.map((feat) => (
                      <li key={feat} className="text-xs text-zinc-650 flex items-center gap-2 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Footer */}
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">{priceLabel}</span>
                    <span className="text-xl font-black text-zinc-900">{product.price}</span>
                  </div>
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                  >
                    {detailsLabel}
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </GlassCard>
            ))}
          </div>
        </div>

        {/* Mixer Grinders & Kitchen Appliances Section */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-8">
            {sections.mixer?.title || 'Smart Mixer Grinders'}
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {appliancesData.filter(p => p.id.startsWith('mixer')).map((product) => (
              <GlassCard key={product.id} className="w-full md:w-[380px] flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                
                {/* Sale Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                    {product.tag}
                  </span>
                </div>

                {/* Product Image Container */}
                <div className="relative h-64 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                  <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-650/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-56 object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">
                    {product.name}
                  </h3>
                  <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2 mb-4">
                    {product.subtitle}
                  </p>
                  {/* Feature Bullets */}
                  <ul className="inline-block text-left space-y-2 mt-2">
                    {product.features?.map((feat) => (
                      <li key={feat} className="text-xs text-zinc-650 flex items-center gap-2 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Footer */}
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">{priceLabel}</span>
                    <span className="text-xl font-black text-zinc-900">{product.price}</span>
                  </div>
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                  >
                    {detailsLabel}
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </GlassCard>
            ))}
          </div>
        </div>

        <AppliancePricingTable table={sections.pricingTables?.mixer} viewDetailsLabel={detailsLabel} onViewDetails={onViewDetails} />

        {/* Smart Air Conditioners Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gradient text-center font-display mb-8">
            {sections.ac?.title || 'Smart Air Conditioners'}
          </h2>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {appliancesData.filter(p => p.id === 'ac').map((product) => (
              <GlassCard key={product.id} className="w-full md:w-[380px] flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                
                {/* Sale Tag */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                    {product.tag}
                  </span>
                </div>

                {/* Product Image Container */}
                <div className="relative h-64 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                  <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-650/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-56 object-contain z-10 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Details */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">
                    {product.name}
                  </h3>
                  <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2 mb-4">
                    {product.subtitle}
                  </p>
                  {/* Feature Bullets */}
                  <ul className="inline-block text-left space-y-2 mt-2">
                    {product.features?.map((feat) => (
                      <li key={feat} className="text-xs text-zinc-650 flex items-center gap-2 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Footer */}
                <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">{priceLabel}</span>
                    <span className="text-xl font-black text-zinc-900">{product.price}</span>
                  </div>
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                  >
                    {detailsLabel}
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </GlassCard>
            ))}
          </div>
        </div>

        <AppliancePricingTable table={sections.pricingTables?.ac} viewDetailsLabel={detailsLabel} onViewDetails={onViewDetails} />

        {/* Brand Connectivity Showcase */}
        <div className="bg-white border border-zinc-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(sections.iot?.features ?? []).map((feat, i) => {
            const icons = [FiCpu, FiClock, FiShield];
            const Icon = icons[i] || FiCpu;
            return (
              <div key={feat.title} className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">{feat.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>

      </div>
    </div>
  );
}
