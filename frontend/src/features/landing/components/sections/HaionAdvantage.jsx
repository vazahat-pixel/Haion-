import React from 'react';
import { ScrollReveal } from '../ui';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

export default function HaionAdvantage() {
  const { items: advantageCards } = useCMSCollection('advantage-cards');
  const { getSection } = useCMSPage();
  const section = getSection('haion-advantage');
  if (!advantageCards.length) return null;

  return (
    <section id="haion-advantage" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden select-none">
      <div className="absolute inset-x-0 bottom-0 h-40 bg-white" style={{ clipPath: 'ellipse(60% 80% at 50% 100%)' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center pb-12">
        <ScrollReveal>
          <div className="flex flex-col items-center mb-16">
            <span className="inline-block text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-4 py-1.5 rounded-full mb-4">
              {section.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 font-display leading-tight">
              {section.titleLine1}<br />{section.titleLine2}
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {advantageCards.map((card, idx) => (
            <ScrollReveal key={card.title || idx} delay={idx * 0.1}>
              <div className="bg-white border border-zinc-200/60 rounded-[36px] p-8 flex flex-col justify-between items-start text-left shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 h-[340px] group cursor-pointer">
                <div className="w-full h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 p-2">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-6 flex-1 flex flex-col justify-start">
                  <h3 className="text-zinc-900 font-extrabold text-xl leading-tight font-display mb-2">
                    {card.title}
                  </h3>
                  <p className="text-zinc-600 text-xs font-light leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
