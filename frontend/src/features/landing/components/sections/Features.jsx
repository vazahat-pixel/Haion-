import React from 'react';
import { ScrollReveal, GlassCard, SectionHeading } from '../ui';
import { FiShield, FiTag, FiTruck, FiLock, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

const iconMap = {
  shield: FiShield,
  tag: FiTag,
  truck: FiTruck,
  lock: FiLock,
  rotate: FiRefreshCw,
  chat: FiMessageSquare
};

export default function Features() {
  const { items: featuresData } = useCMSCollection('features');
  const { getSection } = useCMSPage();
  const section = getSection('features');
  if (!featuresData.length) return null;

  return (
    <section id="features" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Background glow orb */}
      <div className="absolute top-1/2 left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuresData.map((feature, idx) => {
            const Icon = iconMap[feature.iconName] || FiShield;
            
            return (
              <ScrollReveal key={feature.title} delay={idx * 0.1}>
                <GlassCard className="h-full flex flex-col items-start text-left p-8 border-black/5 hover:border-purple-500/25 relative overflow-hidden">
                  {/* Hover background glow orb */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0" />
                  
                  {/* Glowing Icon Frame */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-950 via-purple-600 to-purple-500 border border-purple-500/30 flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(232,141,1,0.25)] group-hover:scale-110 group-hover:rotate-[15deg] group-hover:shadow-[0_0_30px_rgba(232,141,1,0.45)] transition-all duration-500 relative z-10">
                    <Icon size={22} className="group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 font-display relative z-10">
                    {feature.title}
                  </h3>
                  
                  <p className="text-zinc-550 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
