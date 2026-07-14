import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useCMSScrollSequence } from '../../cms/hooks/useCMSContent';

const DEFAULT_TOTAL_FRAMES = 150;

export default function ScrollSequence() {
  const cms = useCMSScrollSequence();
  const TOTAL_FRAMES = cms.totalFrames || DEFAULT_TOTAL_FRAMES;
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTextIndex, setActiveTextIndex] = useState(-1);

  const overlays = cms.overlays || [];

  // Draw the current frame onto the canvas
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[currentFrameRef.current];
    if (!img || !img.complete) return;

    // Set canvas dimensions to the natural dimensions of the frames
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const updateTextOverlay = (frameIndex) => {
    const progress = frameIndex / (TOTAL_FRAMES - 1);
    let currentActiveIndex = -1;
    for (let i = 0; i < overlays.length; i++) {
      if (progress >= overlays[i].start && progress <= overlays[i].end) {
        currentActiveIndex = i;
        break;
      }
    }
    setActiveTextIndex(currentActiveIndex);
  };

  // Preload all 150 frames
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = (cms.framePathTemplate || '/sequence/ezgif-frame-{n}.webp').replace('{n}', frameNum);
      
      img.onload = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        
        // Draw the very first frame once it loads
        if (i === 1) {
          currentFrameRef.current = 0;
          requestAnimationFrame(drawFrame);
        }
        
        if (loadedCount === TOTAL_FRAMES) {
          setLoading(false);
        }
      };

      img.onerror = () => {
        loadedCount++;
        setImagesLoaded(loadedCount);
        if (loadedCount === TOTAL_FRAMES) {
          setLoading(false);
        }
      };

      loadedImages.push(img);
    }
    
    imagesRef.current = loadedImages;
  }, []);

  // Sync animation frame directly with native page scroll progress
  useEffect(() => {
    if (loading) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      if (scrollHeight <= 0) return;

      // Calculate progress (0 to 1) based on container's scrolled offset
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollHeight));

      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(progress * TOTAL_FRAMES)
      );

      if (currentFrameRef.current !== frameIndex) {
        currentFrameRef.current = frameIndex;
        requestAnimationFrame(drawFrame);
        updateTextOverlay(frameIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Call once initially to align with current scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  const loadPercentage = Math.round((imagesLoaded / TOTAL_FRAMES) * 100);

  return (
    <div ref={containerRef} className="relative h-[450vh] bg-[#030303] z-10">
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-[#030303] z-50 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-500">{loadPercentage}%</span>
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-wider text-white uppercase mb-2">
              Preparing Cinematic Experience
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Loading high-fidelity interactive frames for Haion EV.
            </p>
            {/* Elegant glassmorphic progress bar */}
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full mt-6 overflow-hidden border border-zinc-700/50">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${loadPercentage}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Content Container */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
        {/* Canvas for smooth frame sequence */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-cover opacity-90"
        />

        {/* Brand vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/70 via-transparent to-[#030303]/70 pointer-events-none" />

        {/* Text Overlay Section */}
        <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none px-6">
          <div className="max-w-2xl text-center">
            <AnimatePresence mode="wait">
              {activeTextIndex !== -1 && (
                <motion.div
                  key={activeTextIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-black/60 backdrop-blur-md px-8 py-6 rounded-2xl border border-white/5 shadow-2xl"
                >
                  <span className="text-xs uppercase tracking-widest text-amber-500 font-bold block mb-1">
                    {overlays[activeTextIndex].title}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                    {overlays[activeTextIndex].highlight}
                  </h2>
                  <p className="text-sm md:text-base text-gray-300 font-light">
                    {overlays[activeTextIndex].desc}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 flex items-center gap-3 bg-black/40 backdrop-blur-md py-2 px-4 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
          <span className="text-[10px] tracking-widest text-gray-400 font-medium uppercase">
            Scroll to animate
          </span>
        </div>
      </div>
    </div>
  );
}
