import React from 'react';
import { ScrollReveal, SectionHeading } from '../ui';
import { FiDownload, FiSearch, FiCreditCard, FiTruck } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

const iconMap = {
  "01": FiDownload,
  "02": FiSearch,
  "03": FiCreditCard,
  "04": FiTruck
};

export default function HowItWorks() {
  const { items: stepsData } = useCMSCollection('how-it-steps');
  const { getSection } = useCMSPage();
  const section = getSection('how-it-works');
  if (!stepsData.length) return null;

  return (
    <section className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        {/* Step Grid Container */}
        <div className="relative">
          {/* Connecting Line - Desktop Only */}
          <div className="absolute top-1/2 left-4 right-4 h-[1.5px] bg-black/5 -translate-y-1/2 z-0 hidden lg:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {stepsData.map((step, idx) => {
              const Icon = iconMap[step.step] || FiSearch;
              
              return (
                <ScrollReveal key={step.step} delay={idx * 0.1}>
                  <div className="flex flex-col items-center text-center group">
                    
                    {/* Circle icon frame */}
                    <div className="w-16 h-16 rounded-full bg-white border border-black/5 group-hover:border-purple-500/35 flex items-center justify-center text-purple-600 mb-6 relative transition-all duration-500 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] shadow-xs">
                      <Icon size={24} className="group-hover:scale-110 transition-transform duration-500" />
                      
                      {/* Step Number Badge */}
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {step.step}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">
                      {step.title}
                    </h3>
                    
                    <p className="text-zinc-500 text-xs font-light max-w-[220px] leading-relaxed">
                      {step.description}
                    </p>

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
