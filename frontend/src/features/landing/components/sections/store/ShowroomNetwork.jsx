import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../../ui';
import { FiCheckCircle, FiImage, FiMapPin, FiX } from 'react-icons/fi';

export default function ShowroomNetwork({ content }) {
  const {
    heading = 'Our Showroom & Service Presence',
    description = 'Quality sales and service through authorized showrooms and trained support teams.',
    features = [],
    images = [],
    featuresHeading,
  } = content ?? {};
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section className="mb-20">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gradient text-center font-display mb-6 tracking-tight">
          {heading}
        </h2>
        <p className="text-zinc-500 text-base md:text-lg font-light leading-relaxed max-w-3xl mx-auto">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
        {/* Features list */}
        <div className="lg:col-span-5 text-left space-y-4">
          <h3 className="text-xl font-bold text-zinc-900 font-display mb-6">
            {featuresHeading || 'Why Visit Our Authorized Center?'}
          </h3>
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white border border-zinc-200/50 p-4 rounded-xl shadow-xs">
                <FiCheckCircle className="text-purple-600 shrink-0" size={20} />
                <span className="font-semibold text-zinc-800 text-sm md:text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <GlassCard 
                key={img.id || idx} 
                className="overflow-hidden p-0 border-zinc-200/50 bg-white shadow-xs rounded-2xl group cursor-pointer relative"
                onClick={() => setSelectedImage(img)}
              >
                <div className="aspect-square w-full overflow-hidden bg-zinc-100 relative">
                  <img 
                    src={img.src} 
                    alt={img.title || "Showroom Image"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white">
                    <FiImage size={24} className="scale-75 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
                {img.title && (
                  <div className="p-3 text-left">
                    <h4 className="font-bold text-zinc-900 text-xs truncate">{img.title}</h4>
                    {img.location && (
                      <p className="text-[10px] text-zinc-400 flex items-center gap-0.5 mt-0.5">
                        <FiMapPin size={10} />
                        {img.location}
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox for viewing images */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors z-10"
              >
                <FiX size={20} />
              </button>
              <div className="aspect-[16/10] w-full bg-zinc-950 flex items-center justify-center">
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-6 bg-zinc-900 text-white text-left">
                <h3 className="text-xl font-bold font-display">{selectedImage.title}</h3>
                {selectedImage.location && (
                  <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                    <FiMapPin size={14} className="text-purple-500" />
                    {selectedImage.location}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
