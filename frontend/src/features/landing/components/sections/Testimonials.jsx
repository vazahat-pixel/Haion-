import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, SectionHeading, GlassCard } from '../ui';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

export default function Testimonials() {
  const { items: testimonialsData } = useCMSCollection('testimonials');
  const { getSection } = useCMSPage();
  const section = getSection('testimonials');
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (!testimonialsData.length) return;
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonialsData.length);
  };

  const handlePrev = () => {
    if (!testimonialsData.length) return;
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonialsData.length) % testimonialsData.length);
  };

  useEffect(() => {
    if (!testimonialsData.length) return undefined;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [testimonialsData.length]);

  if (!testimonialsData.length) return null;

  const activeTestimonial = testimonialsData[activeIndex];

  return (
    <section className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        {/* Carousel Frame */}
        <ScrollReveal>
          <div className="relative">
            
            {/* Nav Left Button */}
            <button
              onClick={handlePrev}
              className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-900/5 border border-black/5 hover:border-purple-500/35 flex items-center justify-center text-zinc-550 hover:text-purple-600 transition-all z-20 shadow-xs"
              aria-label="Previous testimonial"
            >
              <FiChevronLeft size={20} />
            </button>

            {/* Testimonial Active Display */}
            <div className="min-h-[250px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <GlassCard className="p-8 md:p-12 text-center border-black/5" hoverEffect={false}>
                    
                    {/* Stars */}
                    <div className="flex justify-center gap-1.5 mb-6 text-amber-500">
                      {[...Array(activeTestimonial.rating)].map((_, i) => (
                        <FiStar key={i} className="fill-amber-500" size={18} />
                      ))}
                    </div>

                    {/* Review text */}
                    <blockquote className="text-black text-lg md:text-xl font-light italic leading-relaxed mb-8">
                      "{activeTestimonial.quote}"
                    </blockquote>
 
                    {/* Review Author Profile */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                        {activeTestimonial.avatar}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-zinc-900 font-display text-base">
                          {activeTestimonial.name}
                        </div>
                        <div className="text-xs text-zinc-700 font-medium">
                          {activeTestimonial.role}
                        </div>
                      </div>
                    </div>

                  </GlassCard>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Nav Right Button */}
            <button
              onClick={handleNext}
              className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-900/5 border border-black/5 hover:border-purple-500/35 flex items-center justify-center text-zinc-550 hover:text-purple-600 transition-all z-20 shadow-xs"
              aria-label="Next testimonial"
            >
              <FiChevronRight size={20} />
            </button>

          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonialsData.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'bg-purple-600 w-6' : 'bg-black/10'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>

        </ScrollReveal>

      </div>
    </section>
  );
}
