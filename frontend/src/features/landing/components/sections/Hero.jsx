import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiArrowRight } from 'react-icons/fi';
import { useCMSCollection, useCMSPage } from '../../cms/CMSContext';

export default function Hero() {
  const { items: slidesData } = useCMSCollection('hero-slides');
  const { getSection } = useCMSPage();
  const section = getSection('hero');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const extendedSlides = slidesData.length ? [...slidesData, slidesData[0]] : [];
  const activeSlide = slidesData.length ? currentIndex % slidesData.length : 0;
  const slide = slidesData[activeSlide] ?? {};

  // Auto transition slides
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentIndex === slidesData.length) {
      // Wait for the slide transition to complete (1000ms) and then jump to index 0 instantly
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, slidesData.length]);

  if (!slidesData.length) return null;

  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-0 pb-0 overflow-hidden bg-white text-white select-none">
      
      {/* Full Screen Cinematic Carousel Cover Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Preloaded sliding track container */}
        <div 
          className="absolute inset-0 flex"
          style={{ 
            width: `${extendedSlides.length * 100}%`,
            transform: `translateX(-${(currentIndex * 100) / extendedSlides.length}%)`,
            transition: isTransitioning ? 'transform 1000ms ease-in-out' : 'none'
          }}
        >
          {extendedSlides.map((item, idx) => (
            <div 
              key={idx}
              className="h-full relative overflow-hidden"
              style={{ width: `${100 / extendedSlides.length}%` }}
            >
              <img 
                src={item.bgImage} 
                alt={`Cinematic slide backdrop ${idx}`} 
                className="w-full h-full object-cover object-center brightness-100 contrast-100 transition-all" 
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        {/* Extremely subtle overlays to maximize backdrop brightness while retaining readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 z-0" />
      </div>

      {/* Main Content Layout - Centered Text Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 max-w-5xl mx-auto px-6 pt-28">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Title / Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 font-display leading-[1.1] text-white max-w-4xl text-glow">
              {slide?.title?.split(" ").map((word, idx) => (
                <span key={idx} className={word.toLowerCase() === "easy" ? "border-2 border-yellow-400 rounded-full px-6 py-0.5 inline-block text-yellow-400 mx-2" : ""}>
                  {word}{" "}
                </span>
              )) || "It's easy."}
            </h1>

            {/* Subtitle description */}
            <p 
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              className="text-white text-sm sm:text-base md:text-lg font-semibold mb-8 max-w-xl opacity-95 leading-relaxed"
            >
              {slide?.subtitle || ""}
            </p>

            {/* CTA action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
              <a
                href={section.primaryCtaUrl || '#download'}
                className="inline-flex items-center justify-center bg-purple-500 hover:bg-purple-600 text-zinc-950 font-bold px-8 py-3 rounded-full text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/25"
              >
                {section.primaryCtaLabel || 'Request a call back'}
              </a>
              <a
                href={section.secondaryCtaUrl || '#download'}
                className="inline-flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-900 text-white font-semibold px-8 py-3 rounded-full text-xs sm:text-sm border border-zinc-800 transition-all duration-300 hover:scale-[1.02]"
              >
                {section.secondaryCtaLabel || 'Book a testride'}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide navigation lines */}
        <div className="flex gap-2.5 mt-12">
          {slidesData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(idx);
              }}
              className="h-1 rounded-full transition-all duration-500 bg-white/20 hover:bg-white/60"
              style={{ width: activeSlide === idx ? '36px' : '16px', backgroundColor: activeSlide === idx ? (section.activeDotColor || '#facc15') : '' }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

      {/* Bouncing Scroll indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center opacity-40 pointer-events-none">
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <FiChevronDown size={20} className="text-white" />
        </motion.div>
      </div>

      {/* Infinite scrolling bottom ticker list */}
      <div className="hidden md:block w-full bg-transparent py-4 z-10 relative overflow-hidden select-none">
        <div className="relative w-full flex overflow-x-hidden">
          <div className="flex gap-12 items-center whitespace-nowrap animate-infinite-scroll py-1 text-[9px] sm:text-[10px] tracking-wider font-semibold uppercase font-display">
            {slide?.details?.map((det, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-white/60">★</span>
                <span className="text-white font-medium">{det.label}</span>
              </div>
            )) || null}
            {/* Duplicate for seamless infinite loop */}
            {slide?.details?.map((det, idx) => (
              <div key={`dup-${idx}`} className="flex items-center gap-3">
                <span className="text-white/60">★</span>
                <span className="text-white font-medium">{det.label}</span>
              </div>
            )) || null}
          </div>
        </div>
      </div>

    </section>
  );
}
