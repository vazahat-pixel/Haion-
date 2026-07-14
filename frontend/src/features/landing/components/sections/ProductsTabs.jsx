import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui';
import { FiArrowRight } from 'react-icons/fi';
import { useCMSPage } from '../../cms/CMSContext';
import { useCMSProducts } from '../../cms/hooks/useCMSProducts';
import { productsCatalogFallback } from '../../data/productsCatalogFallback';

export { productsCatalogFallback as productsData };

export default function ProductsTabs({ onViewDetails }) {
  const { getCatalog } = useCMSProducts();
  const { getSection } = useCMSPage();
  const section = getSection('products-tabs');
  const [activeTab, setActiveTab] = useState('evs');

  const evTabLabel = section.tabEv || section.evTabLabel || 'Electric Vehicles (EVs)';
  const appliancesTabLabel = section.tabAppliances || section.appliancesTabLabel || 'Home Appliances';
  const specialPriceLabel = section.specialPriceLabel || 'Special Price';
  const viewDetailsLabel = section.viewDetailsLabel || 'View Details';

  const tabProducts = getCatalog(activeTab);

  return (
    <section id="showcase-tabs" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden border-t border-black/5">
      <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex justify-center items-center gap-8 md:gap-12 mb-16 border-b border-zinc-200/60 pb-4 max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('evs')}
            className="relative pb-4 text-xl md:text-2xl font-bold font-display transition-colors duration-300 focus:outline-none cursor-pointer"
            style={{ color: activeTab === 'evs' ? '#18181b' : '#a1a1aa' }}
          >
            {evTabLabel}
            {activeTab === 'evs' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('appliances')}
            className="relative pb-4 text-xl md:text-2xl font-bold font-display transition-colors duration-300 focus:outline-none cursor-pointer"
            style={{ color: activeTab === 'appliances' ? '#18181b' : '#a1a1aa' }}
          >
            {appliancesTabLabel}
            {activeTab === 'appliances' && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
            )}
          </button>
        </div>

        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10"
            >
              {tabProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <GlassCard className="h-full flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                        {product.tag}
                      </span>
                    </div>
                    <div className="relative h-64 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                      <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-500/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`max-h-56 object-contain z-10 transition-transform duration-500 ${
                          product.id.startsWith('x') ? 'scale-[1.35] group-hover:scale-[1.42]' : 'group-hover:scale-105'
                        }`}
                      />
                    </div>
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">{product.name}</h3>
                      <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2">{product.subtitle}</p>
                    </div>
                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">{specialPriceLabel}</span>
                        <span className="text-xl font-black text-zinc-900">{product.price}</span>
                      </div>
                      <button
                        onClick={() => onViewDetails(product.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                      >
                        {viewDetailsLabel}
                        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
