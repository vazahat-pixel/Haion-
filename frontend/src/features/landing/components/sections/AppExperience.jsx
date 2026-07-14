import React from 'react';
import { ScrollReveal, SectionHeading } from '../ui';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';
import {
  FiSearch, FiHeart, FiShoppingCart, FiCreditCard
} from 'react-icons/fi';

const iconMap = {
  search: FiSearch,
  wishlist: FiHeart,
  cart: FiShoppingCart,
  checkout: FiCreditCard
};

// Use exactly 4 steps to match the 4-step infographic mockup exactly
export default function AppExperience() {
  const { items: infographicSteps } = useCMSCollection('app-experience-steps');
  const { getSection } = useCMSPage();
  const section = getSection('app-experience');
  if (!infographicSteps.length) return null;

  return (
    <section id="experience" className="relative py-12 md:py-24 bg-white overflow-hidden">
      {/* Background Visual Accents */}
      <div className="absolute top-1/2 left-[-15%] w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        {/* Infographic Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center max-w-6xl mx-auto">
          
          {/* Left: Large Infographic Circle (INFOGRAPHIC) */}
          <div className="flex justify-center items-center lg:col-span-5">
            <ScrollReveal delay={0.1}>
              {/* Outer gradient circle */}
              <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-zinc-950 to-amber-500 shadow-lg">
                {/* Inner white circle offset to top-left */}
                <div className="absolute -top-3 -left-3 w-80 h-80 md:w-96 md:h-96 rounded-full bg-white shadow-2xl flex flex-col justify-center items-center p-10 text-center border border-zinc-150">
                  <h3 className="text-3xl font-black text-zinc-950 font-display mb-4 tracking-wider uppercase">
                    {section.centerTitle || 'HAION APP'}
                  </h3>
                  <p className="text-zinc-500 text-sm md:text-base font-normal leading-relaxed max-w-[280px]">
                    {section.centerBody || 'Every aspect of the Haion Mobile App is crafted to provide a premium, transparent, and completely effortless shopping experience.'}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: 4 Infographic Steps in Arc Layout */}
          <div className="lg:col-span-7 space-y-12 relative">
            
            {infographicSteps.map((screen, idx) => {
              const Icon = iconMap[screen.id] || FiSearch;
              
              // Apply horizontal offsets to create a subtle arc nesting around the left circle
              const arcOffsetClass = (idx === 1 || idx === 2) 
                ? 'lg:translate-x-6' 
                : 'lg:translate-x-0';

              return (
                <ScrollReveal key={screen.id} delay={idx * 0.08}>
                  <div className={`flex gap-6 md:gap-8 items-end group ${arcOffsetClass} transition-transform duration-300`}>
                    
                    {/* Left: Gradient/White Offset Circle Badge */}
                    <div className="relative shrink-0">
                      {/* Outer gradient circle */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-zinc-950 to-amber-500">
                        {/* Inner white circle offset to top-left */}
                        <div className="absolute -top-1.5 -left-1.5 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-zinc-200/80 shadow-md flex items-center justify-center text-zinc-900 group-hover:bg-gradient-to-r group-hover:from-zinc-950 group-hover:to-amber-500 group-hover:text-white transition-all duration-300">
                          <Icon className="w-6 h-6 md:w-8 md:h-8 transition-transform duration-300 group-hover:rotate-12" />
                        </div>
                      </div>
                    </div>

                    {/* Right: Text Block with curved bottom underline */}
                    <div className="flex-1 text-left relative pb-3 min-h-[72px] flex flex-col justify-end">
                      
                      {/* Title & Badge */}
                      <div className="flex justify-between items-baseline mb-2">
                        <h4 className="font-display font-black text-lg md:text-xl text-zinc-950 uppercase tracking-wide">
                          {screen.title.replace('AI-Powered ', '').replace('Biometric ', '')}
                        </h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          {screen.badge}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-zinc-500 text-sm font-normal leading-relaxed pr-6 mb-1">
                        {screen.description}
                      </p>

                      {/* Gold underline connecting line curving up at the right end */}
                      <div className="absolute bottom-0 left-0 right-0 h-4 border-b-2 border-r-2 border-purple-500 rounded-br-2xl pointer-events-none" />

                    </div>

                  </div>
                </ScrollReveal>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
