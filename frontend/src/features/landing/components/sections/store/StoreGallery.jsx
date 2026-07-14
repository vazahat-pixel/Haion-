import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZoomIn, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCMSGallery } from '../../../cms/hooks/useCMSContent';

export default function StoreGallery() {
  const { items, section } = useCMSGallery();
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredData = activeFilter === 'All' ? items : items.filter((item) => item.category === activeFilter);

  const handlePrev = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? filteredData.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === filteredData.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-20 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-zinc-200 pb-6">
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest block mb-2">
            {section.badge}
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 font-display">{section.title}</h2>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {(section.filters || ['All']).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeFilter === filter
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((item, index) => (
          <motion.div
            key={item.id || index}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-2xl overflow-hidden cursor-pointer border border-zinc-200/60 bg-white shadow-sm"
            onClick={() => setLightboxIndex(index)}
          >
            <div className="aspect-[4/3] overflow-hidden bg-zinc-100 relative">
              <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <FiZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28} />
              </div>
            </div>
            <div className="p-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">{item.category}</span>
              <h3 className="text-lg font-bold text-zinc-900 mt-1">{item.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && filteredData[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-6 right-6 text-white" onClick={() => setLightboxIndex(null)}>
              <FiX size={28} />
            </button>
            <button className="absolute left-4 text-white p-2" onClick={handlePrev}>
              <FiChevronLeft size={32} />
            </button>
            <img
              src={filteredData[lightboxIndex].src}
              alt={filteredData[lightboxIndex].title}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="absolute right-4 text-white p-2" onClick={handleNext}>
              <FiChevronRight size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
