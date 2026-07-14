import React from 'react';
import { productsData } from '../../data/mockData';
import { ScrollReveal, SectionHeading, GlassCard } from '../ui';
import { FiStar, FiArrowUpRight } from 'react-icons/fi';

export default function Products() {
  return (
    <section id="products" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Visual Accents */}
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge="Featured Products"
          title="Designed for Collectors"
          subtitle="Explore highly exclusive, next-generation gear available with app-only bundles and live shipment tracking."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {productsData.map((product, idx) => (
            <ScrollReveal key={product.name} delay={idx * 0.08}>
              <GlassCard className="h-full flex flex-col justify-between p-6 border-black/5 hover:border-purple-500/25">
                
                {/* Upper Badge Area */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-650 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                    {product.tag}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                    <FiStar className="fill-amber-500" />
                    <span>{product.rating}</span>
                  </div>
                </div>

                {/* Simulated product visual container */}
                <div className="relative h-44 rounded-xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-100 border border-black/5 group-hover:border-purple-500/20 transition-colors">
                  <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-xl opacity-60 group-hover:scale-125 transition-transform duration-700" />
                  
                  {/* Category text icon wrapper */}
                  <span className="text-5xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 select-none">
                    {product.category === "Smartphones" ? "📱" : 
                     product.category === "Laptops & Computing" ? "💻" : 
                     product.category === "Premium Audio" ? "🎧" : "⌚"}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                    {product.category}
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">
                    {product.name}
                  </h3>
                  
                  {/* Bullet spec details */}
                  <ul className="space-y-1 mb-6">
                    {product.specs.map(spec => (
                      <li key={spec} className="text-xs text-zinc-650 flex items-center gap-1.5 font-light">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price and CTA */}
                <div className="flex justify-between items-center border-t border-black/5 pt-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Direct Price</span>
                    <span className="text-lg font-black text-zinc-900">{product.price}</span>
                  </div>
                  <a
                    href="#download"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-purple-600 hover:text-white border border-black/5 hover:border-purple-500 px-3.5 py-2 rounded-xl transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                  >
                    View on App
                    <FiArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>

              </GlassCard>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
