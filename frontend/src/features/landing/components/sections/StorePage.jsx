import React, { useEffect } from 'react';
import { GlassCard } from '../ui';
import { FiMapPin, FiPhone, FiClock, FiCheck, FiArrowRight, FiShield, FiCpu, FiAward, FiLock } from 'react-icons/fi';

// Imports for new dynamic sections
import { useCMSStoreConfig } from '../../cms/hooks/useCMSStore';
import { useCMSStoreExtras } from '../../cms/hooks/useCMSContent';
import BrandShowcase from './store/BrandShowcase';
import ProductRangeShowcase from './store/ProductRangeShowcase';
import WarrantySection from './store/WarrantySection';
import ShowroomNetwork from './store/ShowroomNetwork';
import BecomeDealer from './store/BecomeDealer';
import StoreGallery from './store/StoreGallery';

export default function StorePage({ onClose }) {
  const { config } = useCMSStoreConfig();
  const extras = useCMSStoreExtras(config);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewProductDetails = (productId) => {
    // Dynamically trigger the parent navigation or anchor scroll
    const detailElement = document.getElementById(`product-detail-${productId}`);
    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: If not rendered in page flow, find the tabbed showcase
      const showcaseElement = document.getElementById('showcase-tabs');
      if (showcaseElement) {
        showcaseElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pt-28 pb-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        


        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest text-purple-600 uppercase bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/25 mb-4">
            {extras.heroBadge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gradient mb-6 font-display bg-gradient-to-r from-zinc-950 to-amber-500 bg-clip-text text-transparent">
            {config.banners.heroTitle || "Visit Our Stores"}
          </h1>
          <p className="text-zinc-500 text-lg font-light leading-relaxed">
            {config.banners.heroSubtitle || "Step into the world of Haion. Experience first-class tech solutions, witness connected smart homes in action, and take your favorite EV scooter out for a ride."}
          </p>
        </div>

        {/* Original Experience Center Gallery Section (Preserved for compatibility) */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gradient text-center font-display mb-10">
            {extras.layoutsTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {extras.images.map((store, idx) => (
              <GlassCard key={idx} className="overflow-hidden p-0 border-zinc-200/50 bg-white shadow-sm rounded-3xl group flex flex-col justify-between">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-105 border-b border-zinc-100">
                  <img 
                    src={store.src} 
                    alt={store.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                    {store.location}
                  </div>
                </div>
                <div className="p-6 text-left flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2 font-display">
                      {store.title}
                    </h3>
                    <p className="text-zinc-550 text-sm leading-relaxed font-light">
                      {store.desc}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* NEW INTERACTIVE GALLERY SECTION */}
        <StoreGallery />

        {/* SECTION 3 & 4 — Warranty Coverage & Terms Accordion */}
        <BrandShowcase content={config.brandContent} />
        <ProductRangeShowcase content={config.productRange} onViewDetails={handleViewProductDetails} />

        <WarrantySection info={config.warrantyInfo} terms={config.warrantyTerms} />

        <ShowroomNetwork content={{ ...config.showroomInfo, featuresHeading: extras.showroomFeaturesHeading }} />

        {/* SECTION 6 — Become a Dealer */}
        <BecomeDealer content={config.dealerInfo} />

        {/* Original Store Highlights Grid (Preserved for compatibility) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 bg-white border border-zinc-200/60 rounded-3xl p-8 md:p-12 shadow-sm text-left">
          {extras.highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div key={index} className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">{highlight.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {highlight.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
