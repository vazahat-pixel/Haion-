import React from 'react';
import { SectionHeading } from '../ui';
import { useCMSOffers } from '../../cms/hooks/useCMSContent';

export default function Offers() {
  const { offers, section } = useCMSOffers();

  return (
    <section className="relative py-12 md:py-20 bg-[#030303] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionHeading badge={section.badge} title={section.title} subtitle={section.subtitle} dark />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {offers.map((offer, idx) => (
            <div
              key={offer.title + idx}
              className={`relative rounded-3xl p-8 border border-white/10 bg-gradient-to-br ${offer.gradient} overflow-hidden group`}
            >
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">{offer.tag}</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-2 font-display">{offer.title}</h3>
                <p className="text-zinc-300 text-sm mb-6">{offer.subtitle}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{offer.timeRemaining}</span>
                  <span className="text-xs font-bold text-amber-400 uppercase">{offer.actionText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
