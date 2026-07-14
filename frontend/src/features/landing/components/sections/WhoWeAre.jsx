import React from 'react';
import { ScrollReveal, SectionHeading } from '../ui';
import { useCMSPage } from '../../cms/CMSContext';
import { pickCms } from '../../cms/cms-defaults';

export default function WhoWeAre() {
  const { getSection } = useCMSPage();
  const section = getSection('who-we-are');

  const paragraph1 = pickCms(
    'Established in 2009, Haion Group of India has gained an admirable position in OEM Manufacturing and Exporting of electric mobility and smart home appliances.',
    section.paragraph1
  );
  const paragraph2 = pickCms(
    'These products are enormously well-liked due to their effortless operations, low maintenance, nominal prices, longer operational life and top performance.',
    section.paragraph2
  );
  const imageUrl = pickCms('/haio.webp', section.image?.url ?? section.image);
  const imageAlt = pickCms('Haion Corporate Office & Manufacturing Factory', section.image?.alt);

  return (
    <section id="who-we-are" className="relative py-12 md:py-24 bg-white overflow-hidden">
      <div className="absolute top-1/2 left-[-15%] w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionHeading badge={section.badge} title={section.title} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 text-left">
            <ScrollReveal delay={0.1}>
              <div className="space-y-6 text-zinc-800 text-base md:text-lg leading-relaxed font-light">
                <p>{paragraph1}</p>
                <p>{paragraph2}</p>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-5 flex justify-center w-full">
            <ScrollReveal delay={0.2} scale={0.95}>
              <div className="relative group w-full max-w-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/5 to-purple-500/10 rounded-3xl blur-2xl -z-10 group-hover:scale-105 transition-transform duration-700" />
                <div className="rounded-3xl border border-purple-500/20 p-2 bg-gradient-to-r from-white to-purple-50/30 shadow-xl overflow-hidden group-hover:border-purple-500/40 transition-colors duration-500">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    loading="lazy"
                    className="w-full aspect-[4/3] rounded-2xl object-cover shadow-sm group-hover:scale-[1.01] transition-transform duration-700"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
