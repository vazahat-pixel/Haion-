import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../ui';
import { FiArrowRight } from 'react-icons/fi';
import { useCMSProducts } from '../../../cms/hooks/useCMSProducts';

export default function ProductRangeShowcase({ content, onViewDetails }) {
  const { getCatalog } = useCMSProducts();
  const { heading = 'Our Electric Scooter Range', description = 'Discover multiple scooter models designed to meet different riding needs.' } = content ?? {};
  const evProducts = getCatalog('evs') || [];

  return (
    <section className="mb-20">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-950 font-display mb-6 tracking-tight">
          {heading}
        </h2>
        <p className="text-zinc-500 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {evProducts.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="h-full"
          >
            <GlassCard className="h-full flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_40px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-3xl group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 bg-purple-500 px-3 py-1 rounded-md shadow-sm">
                  {product.tag}
                </span>
              </div>

              <div className="relative h-64 rounded-2xl overflow-hidden mb-6 flex items-center justify-center bg-zinc-50 border border-zinc-100 group-hover:bg-zinc-100/50 transition-colors duration-500">
                <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-purple-500/5 to-purple-500/5 blur-2xl opacity-80 group-hover:scale-125 transition-transform duration-700" />
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-56 object-contain z-10 transition-transform duration-500 scale-[1.35] group-hover:scale-[1.42]"
                  loading="lazy"
                />
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 font-display">
                  {product.name}
                </h3>
                <p className="text-zinc-500 text-sm font-normal px-2 line-clamp-2">
                  {product.subtitle}
                </p>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Special Price</span>
                  <span className="text-xl font-black text-zinc-900">{product.price}</span>
                </div>
                <button
                  onClick={() => onViewDetails?.(product.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-zinc-950 to-amber-500 px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03] cursor-pointer focus:outline-none"
                >
                  View Details
                  <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
