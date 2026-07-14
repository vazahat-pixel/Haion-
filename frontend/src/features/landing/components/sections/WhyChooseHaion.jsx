import React from 'react';
import { GlassCard, SectionHeading } from '../ui';
import { FiCpu, FiDollarSign, FiZap, FiLifeBuoy } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

const iconMap = {
  zap: FiZap,
  cpu: FiCpu,
  dollar: FiDollarSign,
  'life-buoy': FiLifeBuoy,
};

export default function WhyChooseHaion() {
  const { items: whyChooseData } = useCMSCollection('why-choose-items');
  const { getSection } = useCMSPage();
  const section = getSection('why-choose-haion');
  if (!whyChooseData.length) return null;

  return (
    <section id="why-choose-haion" className="relative py-12 md:py-24 bg-[#f8f9fa] text-zinc-800 overflow-hidden border-t border-black/5">
      <div className="absolute top-[10%] left-[-15%] w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[450px] h-[450px] bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionHeading
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyChooseData.map((item) => {
            const Icon = iconMap[item.icon] || FiZap;
            return (
              <GlassCard key={item.title} className="h-full flex flex-col items-center text-center p-8 bg-white/70 border-zinc-200/50 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_15px_35px_rgba(232,141,1,0.12)] transition-all duration-500 rounded-2xl group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-zinc-950 to-amber-500 flex items-center justify-center text-white mb-6 shadow-md shadow-purple-500/15 group-hover:scale-110 group-hover:rotate-[12deg] transition-all duration-500">
                  <Icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-4 font-display">
                  {item.title}
                </h3>
                <p className="text-zinc-500 text-sm font-normal leading-relaxed">
                  {item.desc}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
