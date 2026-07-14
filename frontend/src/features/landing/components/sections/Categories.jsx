import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from '../ui';
import { FiArrowRight, FiArrowLeft, FiX, FiStar } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

import acImg from '../../assets/ac-removebg-preview.webp';
import tvImg from '../../assets/tv2.webp';
import washingImg from '../../assets/washing_machine_3-removebg-preview (1).webp';
import refrigeratorImg from '../../assets/refri2-removebg-preview.webp';
import mixerImg from '../../assets/mixer2-removebg-preview.webp';

const categoryImages = {
  ac: acImg,
  tv: tvImg,
  washing: washingImg,
  refrigerator: refrigeratorImg,
  mixer: mixerImg
};

// Custom brand-aligned colors for the background card blocks
const categoryThemeColors = {
  ac: { bg: 'bg-gradient-to-b from-[#ab7e2c]/80 to-[#e88d01]/90', glow: 'shadow-[#e88d01]/30', text: 'text-amber-100' },
  tv: { bg: 'bg-gradient-to-b from-[#2b1d07]/90 to-[#7e5b1d]/90', glow: 'shadow-[#ab7e2c]/30', text: 'text-amber-200' },
  washing: { bg: 'bg-gradient-to-b from-[#ffd233]/80 to-[#ab7e2c]/90', glow: 'shadow-[#ffd233]/20', text: 'text-amber-950' },
  refrigerator: { bg: 'bg-gradient-to-b from-[#e88d01]/85 to-[#543b12]/95', glow: 'shadow-[#e88d01]/20', text: 'text-amber-100' },
  mixer: { bg: 'bg-gradient-to-b from-[#543b12]/95 to-[#2b1d07]/95', glow: 'shadow-[#543b12]/30', text: 'text-amber-100' }
};

export default function Categories() {
  const { items: categoriesData } = useCMSCollection('categories');
  const { getSection } = useCMSPage();
  const section = getSection('categories');
  if (!categoriesData.length) return null;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const sliderRef = useRef(null);

  // Auto-play interval for left-to-right slider animation
  useEffect(() => {
    if (selectedCategory) return; // Pause auto-play when modal is open
    const interval = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [currentIndex, selectedCategory]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? categoriesData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === categoriesData.length - 1 ? 0 : prev + 1));
  };

  // Get current active subset of categories to display in loop
  const getVisibleCategories = () => {
    const items = [];
    for (let i = 0; i < 3; i++) {
      items.push(categoriesData[(currentIndex + i) % categoriesData.length]);
    }
    return items;
  };

  return (
    <section id="categories" className="relative py-12 md:py-24 bg-[#f8f9fa] overflow-hidden select-none border-y border-zinc-200/60">
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionHeading
          badge={section.badge}
          title={section.title}
          subtitle={section.subtitle}
        />

        {/* Carousel Container */}
        <div className="relative mt-20" ref={sliderRef}>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center min-h-[420px]">
            <AnimatePresence mode="popLayout">
              {getVisibleCategories().map((cat, index) => {
                const theme = categoryThemeColors[cat.id] || categoryThemeColors.ac;
                return (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelectedCategory(cat)}
                    className="relative w-full md:w-[320px] h-[340px] flex flex-col justify-end cursor-pointer group pt-16"
                  >
                    {/* Popping Out Graphic */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-44 z-20 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-4">
                      <img 
                        src={categoryImages[cat.id]} 
                        alt={cat.title} 
                        loading="lazy"
                        className="w-full h-full object-contain filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]"
                      />
                    </div>

                    {/* Card Base */}
                    <div className={`w-full h-[240px] rounded-[32px] ${theme.bg} p-6 flex flex-col justify-end relative overflow-hidden shadow-xl transition-shadow duration-500 group-hover:shadow-[0_20px_40px_rgba(232,141,1,0.15)] border border-white/10`}>
                      {/* Subtle inner card light strip */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      {/* Text details */}
                      <div className="z-10 mt-auto text-left">
                        <span className={`text-[10px] tracking-widest uppercase font-bold opacity-80 ${theme.text}`}>
                          {cat.count}
                        </span>
                        <h3 className="text-2xl font-black text-white mt-1 mb-2 font-display tracking-tight leading-none">
                          {cat.title}
                        </h3>
                        <p className={`text-xs font-medium line-clamp-2 leading-relaxed opacity-75 ${theme.text}`}>
                          {cat.description}
                        </p>
                      </div>

                      {/* Hover Arrow Effect */}
                      <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all duration-300">
                        <FiArrowRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Carousel Footer & Navigation (Matches standard UI styling in second image) */}
          <div className="flex justify-between items-center mt-12 px-2">
            <div className="flex gap-4 text-xs font-semibold tracking-wider text-zinc-400">
              <span className="hover:text-zinc-900 cursor-pointer transition-colors">Facebook</span>
              <span className="hover:text-zinc-900 cursor-pointer transition-colors">Twitter</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrev}
                className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer"
              >
                <FiArrowLeft size={16} />
              </button>
              <button 
                onClick={handleNext}
                className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer"
              >
                <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Popout Detail Modal Overlay (First Image Design) */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl bg-white border border-zinc-200/80 rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCategory(null)}
                className="absolute top-6 right-6 z-40 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 bg-white border border-zinc-200 px-4 py-2 rounded-full transition-all hover:scale-105 shadow-sm cursor-pointer"
              >
                <FiX size={14} />
                Close
              </button>

              {/* Left Side: Curved colored background with big pop-out image */}
              <div className="relative w-full md:w-5/12 h-[300px] md:h-auto flex items-center justify-center p-8 bg-gradient-to-br from-[#ab7e2c]/15 to-transparent">
                {/* Curved visual separator overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ab7e2c]/05 to-transparent pointer-events-none" />
                
                <motion.div 
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="relative w-64 h-64 md:w-80 md:h-80 z-20"
                >
                  <img 
                    src={categoryImages[selectedCategory.id]} 
                    alt={selectedCategory.title} 
                    loading="lazy"
                    className="w-full h-full object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.35)]"
                  />
                </motion.div>
              </div>

              {/* Right Side: Details panel */}
              <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center text-left">
                <span className="text-xs font-black tracking-widest text-amber-500 uppercase bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 inline-self-start mb-4">
                  {selectedCategory.subtitle}
                </span>

                <h2 className="text-4xl md:text-5xl font-black text-zinc-950 font-display mb-1 tracking-tight">
                  {selectedCategory.title}
                </h2>
                <span className="text-xs font-bold text-zinc-500 block mb-6">
                  {selectedCategory.count} available on App
                </span>

                <p className="text-sm text-zinc-650 leading-relaxed font-light mb-8">
                  {selectedCategory.longDescription}
                </p>

                {/* Key Features/Highlights list */}
                <div className="mb-8">
                  <h4 className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-3">Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCategory.features?.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-700 font-semibold bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub Products / Clips section (Matches the Clips view of the first image) */}
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-3">Top Products</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedCategory.subProducts?.map((prod, idx) => (
                      <div 
                        key={idx} 
                        className="bg-zinc-50/50 border border-zinc-200/80 hover:border-amber-500/50 p-3 rounded-2xl flex flex-col justify-between h-[100px] transition-all hover:scale-[1.02] cursor-pointer group hover:bg-white shadow-xs"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider">{prod.tag}</span>
                            <span className="text-[9px] font-semibold text-zinc-500 flex items-center gap-0.5"><FiStar size={8} className="fill-amber-500 text-amber-500" />{prod.rating}</span>
                          </div>
                          <h5 className="text-[10px] font-extrabold text-zinc-900 line-clamp-2 leading-tight group-hover:text-amber-500 transition-colors">
                            {prod.name}
                          </h5>
                        </div>
                        <span className="text-[11px] font-black text-zinc-950">{prod.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
