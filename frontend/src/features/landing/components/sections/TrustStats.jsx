import React from 'react';
import { ScrollReveal, AnimatedCounter } from '../ui';
import { useCMSCollection } from '../../cms/CMSContext';

export default function TrustStats() {
  const { items: statsData } = useCMSCollection('statistics');
  if (!statsData.length) return null;
  return (
    <section className="relative py-8 md:py-16 bg-[#f8f9fa] overflow-hidden border-y border-black/5">
      {/* Mesh Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[150px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="glassmorphism rounded-3xl p-8 md:p-12 shadow-sm border-black/5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {statsData.map((stat, idx) => (
                <div 
                  key={stat.label} 
                  className={`flex flex-col items-center text-center ${
                    idx !== statsData.length - 1 ? 'lg:border-r lg:border-black/5' : ''
                  }`}
                >
                  <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-3 font-display">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-zinc-950 font-bold text-sm md:text-base mb-1">
                    {stat.label}
                  </div>
                  <div className="text-zinc-500 text-xs md:text-sm max-w-[180px]">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
