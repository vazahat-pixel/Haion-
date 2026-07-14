import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../ui';
import { FiBatteryCharging, FiZap, FiSettings, FiActivity, FiGlobe, FiLayers } from 'react-icons/fi';

const iconMap = {
  f1: FiBatteryCharging,
  f2: FiZap,
  f3: FiSettings,
  f4: FiActivity,
  f5: FiGlobe,
  f6: FiLayers
};

export default function BrandShowcase({ content }) {
  const {
    heading = 'Powering the Future of Electric Mobility',
    description = 'Explore our range of advanced electric scooters designed for reliability and performance.',
    features = [],
  } = content ?? {};

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const IconComponent = iconMap[feature.id] || FiZap;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <GlassCard className="h-full flex gap-4 p-6 bg-white border border-zinc-200/50 shadow-sm rounded-2xl group transition-all duration-300">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-2 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
