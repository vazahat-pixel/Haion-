import React from 'react';
import { ScrollReveal, PhoneMockup } from '../ui';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';
import { useCMSDownloadCta } from '../../cms/hooks/useCMSContent';

export default function DownloadCTA() {
  const cms = useCMSDownloadCta();

  return (
    <section id="download" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="glassmorphism rounded-3xl p-8 md:p-16 border-black/5 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 text-left">
              <ScrollReveal>
                <span className="inline-block text-xs font-semibold tracking-widest text-purple-600 uppercase bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 mb-6">
                  {cms.badge}
                </span>

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-6 font-display leading-tight">
                  {cms.title}
                </h2>

                <p className="text-zinc-650 text-lg font-light mb-8 max-w-xl leading-relaxed">{cms.subtitle}</p>

                <ul className="space-y-4 mb-10">
                  {(cms.benefits || []).map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-sm text-zinc-750 font-light">
                      <FiCheckCircle className="text-emerald-550 shrink-0" size={18} />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={cms.iosUrl}
                    className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-purple-650 text-white px-6 py-3.5 rounded-2xl transition-all duration-300 group hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] font-bold text-sm"
                  >
                    <FaApple size={20} className="group-hover:scale-110 transition-transform" />
                    {cms.iosLabel}
                  </a>
                  <a
                    href={cms.androidUrl}
                    className="flex items-center justify-center gap-3 bg-zinc-100 hover:bg-zinc-200 border border-black/5 hover:border-black/10 text-zinc-900 px-6 py-3.5 rounded-2xl transition-all duration-300 group font-bold text-sm"
                  >
                    <FaGooglePlay size={18} className="group-hover:scale-110 transition-transform" />
                    {cms.androidLabel}
                  </a>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal delay={0.2}>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/5 rounded-[48px] blur-[30px] -z-10 animate-pulse-slow" />
                  <PhoneMockup>
                    <div className="flex flex-col h-full justify-between py-2 text-center">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{cms.phoneTitle}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">{cms.phoneSubtitle}</p>
                      </div>
                    </div>
                  </PhoneMockup>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
