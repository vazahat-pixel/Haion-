import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, SectionHeading, GlassCard } from '../ui';
import { FiPlus } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

function FAQItem({ faq, isOpen, toggleOpen }) {
  return (
    <div className="mb-4">
      <GlassCard 
        className="p-6 cursor-pointer border-black/5 hover:border-purple-500/25" 
        onClick={toggleOpen}
        hoverEffect={true}
      >
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-base md:text-lg font-bold text-zinc-900 font-display text-left">
            {faq.question}
          </h3>
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
            className={`w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/5 border border-black/5 ${
              isOpen ? 'text-purple-600 border-purple-500/25 bg-purple-500/10' : 'text-zinc-500'
            }`}
          >
            <FiPlus size={18} />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="text-zinc-550 text-sm md:text-base font-light text-left leading-relaxed mt-4 pt-4 border-t border-black/5">
                {faq.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

export default function FAQ() {
  const { items: faqsData } = useCMSCollection('faqs');
  const { getSection } = useCMSPage();
  const section = getSection('faq');
  const [openIndex, setOpenIndex] = useState(null);

  const toggleIndex = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  if (!faqsData.length) return null;

  return (
    <section id="faq" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden">
      {/* Background Accent */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        
        <SectionHeading 
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        <div className="space-y-4">
          {faqsData.map((faq, idx) => (
            <ScrollReveal key={faq.question} delay={idx * 0.05}>
              <FAQItem 
                faq={faq} 
                isOpen={openIndex === idx} 
                toggleOpen={() => toggleIndex(idx)} 
              />
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}
