import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui';
import { FiArrowLeft, FiMaximize2, FiCheck } from 'react-icons/fi';

const evX1 = '/x1bg2.webp';
const evX1Plus = '/sc06-removebg-preview.webp';
const evX2 = '/oxplusf1.webp';
import applianceVacuum from '../../assets/appliance-vacuum.webp';
import appliancePurifier from '../../assets/appliance-purifier.webp';
import applianceTv from '../../assets/appliance-tv.webp';
import refri1 from '../../assets/refri-removebg-preview.webp';
import refri2 from '../../assets/refri2-removebg-preview.webp';
import mixer2 from '../../assets/mixer2-removebg-preview.webp';
import mixer1 from '../../assets/mixer1-removebg-preview.webp';
import tv2 from '../../assets/tv2.webp';
import tv3 from '../../assets/tv3.webp';
import tv4 from '../../assets/tv4.webp';
import tv5 from '../../assets/tv5.webp';
import ac from '../../assets/ac-removebg-preview.webp';
import imgBattery from '../../assets/haion-battery.webp';
import imgCharger from '../../assets/haion-charger.webp';
import imgRickshaw from '../../assets/haion-rickshaw.webp';

import bgRemovebgPreview from '../../assets/bg-removebg-preview.webp';
import Hprobg from '../../assets/Hprobg.webp';
import iprobg from '../../assets/iprobg.webp';
import x3plusbg from '../../assets/x3plusbg.webp';
import x4bg from '../../assets/x4bg.webp';

import { productDetailsFallback as productDetailsData } from '../../data/productDetailsFallback';
import { useCMSProductDetail } from '../../cms/hooks/useCMSProducts';
import { processStoreCheckout } from '../../utils/storeCheckout';

const AnimatedSpeedometer = () => {
  const [speed, setSpeed] = React.useState(0);
  const [accelerating, setAccelerating] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prev) => {
        if (accelerating) {
          if (prev >= 25) {
            setAccelerating(false);
            return prev - 1;
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            setAccelerating(true);
            return prev + 1;
          }
          return prev - 1;
        }
      });
    }, 30);
    return () => clearInterval(interval);
  }, [accelerating]);

  const angle = (speed / 25) * 240 - 120;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center select-none bg-zinc-900/50 rounded-2xl border-2 border-zinc-700/80 p-2 shadow-inner">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d="M 20 80 A 40 40 0 1 1 80 80"
          fill="none"
          stroke="#374151"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 20 80 A 40 40 0 1 1 80 80"
          fill="none"
          stroke="url(#speedGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="188"
          strokeDashoffset={188 - (speed / 25) * 188}
          filter="url(#glow)"
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: '50px 50px',
            transition: 'transform 0.05s linear',
          }}
        />
        <circle cx="50" cy="50" r="5" fill="#ef4444" />
        <text
          x="50"
          y="72"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="14"
          fontWeight="900"
          fontFamily="monospace"
        >
          {speed}
        </text>
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="6"
          fontWeight="bold"
        >
          KM/H
        </text>
      </svg>
    </div>
  );
};

export default function ProductDetails({ productId, onClose, onViewProduct, onAddToCart, onTrackOrder }) {
  const { details: cmsDetails, allProducts, getProductDetail } = useCMSProductDetail(productId);
  let details = getProductDetail(productId);
  if (!details && typeof productId === 'string') {
    const allTableRows = [
      { id: 'LED-AH24', name: 'LED-AH24', price: '₹ 5,400', mrp: '₹ 9,999', desc: 'Speaker 20 W Connectivity (AV IN, HDMI, USB, VGA, Earphone)', image: tv2, category: 'appliances' },
      { id: 'LED-AH40Normal', name: 'LED-AH40Normal', price: '₹ 10,000', mrp: '₹ 17,999', desc: '(AOSP), Normal, Speaker 20W, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv3, category: 'appliances' },
      { id: 'LED-32PROSmart', name: 'LED-32PROSmart', price: '₹ 8,000', mrp: '₹ 15,000', desc: 'Android (AOSP), 1.25/4GB , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv4, category: 'appliances' },
      { id: 'LED-32SIRIS LED TV', name: 'LED-32SIRIS LED TV', price: '₹ 8,400', mrp: '₹ 9,999', desc: 'Android IRIS , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built', image: tv5, category: 'appliances' },
      { id: 'LED-AH32SOTIS LED TV', name: 'LED-AH32SOTIS LED TV', price: '₹ 9,999', mrp: '₹ 16,999', desc: 'Android (OTIS), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built', image: tv2, category: 'appliances' },
      { id: 'LED-AH32BLSmart', name: 'LED-AH32BLSmart', price: '₹ 10,999', mrp: '₹ 17,999', desc: 'Android (AOSP), Bezel Less, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built', image: tv3, category: 'appliances' },
      { id: 'LED-AH40Smart', name: 'LED-AH40Smart', price: '₹ 13,999', mrp: '₹ 21,000', desc: 'Android (AOSP), BT, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv4, category: 'appliances' },
      { id: 'LED-AH43SBSmart', name: 'LED-AH43SBSmart', price: '₹ 17,999', mrp: '₹ 27,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Sound Bar In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv5, category: 'appliances' },
      { id: 'LED-AH43BLSmart', name: 'LED-AH43BLSmart', price: '₹ 19,999', mrp: '₹ 28,000', desc: 'Bezel less, Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Voice Remote, BT In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv2, category: 'appliances' },
      { id: 'LED-AH43WEB', name: 'LED-AH43WEB', price: '₹ 24,999', mrp: '₹ 34,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))', image: tv3, category: 'appliances' },
      { id: 'LED-AH50Smart', name: 'LED-AH50Smart', price: '₹ 25,999', mrp: '₹ 42,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv4, category: 'appliances' },
      { id: 'LED-AH50WEB', name: 'LED-AH50WEB', price: '₹ 29,999', mrp: '₹ 49,000', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))', image: tv5, category: 'appliances' },
      { id: 'LED-AN55Smart', name: 'LED-AN55Smart', price: '₹ 31,999', mrp: '₹ 50,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv2, category: 'appliances' },
      { id: 'LED-AH55WEB', name: 'LED-AH55WEB', price: '₹ 38,999', mrp: '₹ 55,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))', image: tv3, category: 'appliances' },
      { id: 'LED-AN65Smart', name: 'LED-AN65Smart', price: '₹ 49,999', mrp: '₹ 75,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))', image: tv4, category: 'appliances' },
      { id: 'AN Electric Chopper / 1311', name: 'AN Electric Chopper / 1311', price: '₹ 780', mrp: '₹ 1,999', desc: 'Chopper', image: mixer1, category: 'appliances' },
      { id: 'AN Hand Blender / 502', name: 'AN Hand Blender / 502', price: '₹ 880', mrp: '₹ 2,499', desc: 'Stainless Steel Stem & 3 Multifunctional SS Blades', image: mixer2, category: 'appliances' },
      { id: 'AN MINI POPULAR 450 (Copper)', name: 'AN MINI POPULAR 450 (Copper)', price: '₹ 1,150', mrp: '₹ 3,999', desc: '2 Poly JAR', image: mixer1, category: 'appliances' },
      { id: 'AN MINI DIAMOND 450 (Copper)', name: 'AN MINI DIAMOND 450 (Copper)', price: '₹ 1,100', mrp: '₹ 4,299', desc: '2 JARS', image: mixer2, category: 'appliances' },
      { id: 'AN Real JMG 450W (Copper)', name: 'AN Real JMG 450W (Copper)', price: '₹ 2,300', mrp: '₹ 4,999', desc: '1.5 Ltr Liquidizer & 200ml SS 3 Jar', image: mixer1, category: 'appliances' },
      { id: 'AN Marvel JMG 550W (Copper)', name: 'AN Marvel JMG 550W (Copper)', price: '₹ 2,650', mrp: '₹ 5,999', desc: '1.5 Ltr Ploy-Carbonate Jar & 500ml SS 3 Jar', image: mixer2, category: 'appliances' },
      { id: 'AN MINI DIAMOND 500 (Copper)', name: 'AN MINI DIAMOND 500 (Copper)', price: '₹ 1,500', mrp: '₹ 4,499', desc: '3 JARS', image: mixer1, category: 'appliances' },
      { id: 'AN Vista 550W (Copper)', name: 'AN Vista 550W (Copper)', price: '₹ 1,800', mrp: '₹ 4,299', desc: '3 JARS', image: mixer2, category: 'appliances' },
      { id: 'AN Gold Star 750W (Copper)', name: 'AN Gold Star 750W (Copper)', price: '₹ 2,400', mrp: '₹ 5,199', desc: '3 JARS', image: mixer1, category: 'appliances' },
      { id: 'AN Mega Star 1HP (Copper)', name: 'AN Mega Star 1HP (Copper)', price: '₹ 2,650', mrp: '₹ 4,999', desc: '3 JARS', image: mixer2, category: 'appliances' },
      { id: 'AN W671100', name: 'AN W671100', price: '₹ 2,100', mrp: '₹ 4,499', desc: 'Induction Cooker', image: mixer1, category: 'appliances' },
      { id: 'Ac-ATSAC183101TV', name: 'Ac-ATSAC183101TV', price: '₹ 29,999', mrp: '₹ 45,000', desc: 'AC Split 3 Star 1.5 Ton (Inverter) / 3 STAR / 3.92*', image: ac, category: 'appliances' }
    ];
    const match = allTableRows.find(row => row.id === productId);
    if (match) {
      details = {
        id: match.id,
        name: match.name,
        price: match.price,
        subtitle: match.desc,
        images: [match.image, match.image, match.image],
        colors: ['Standard'],
        specs: {
          'MODEL': match.name,
          'PRICE': match.price,
          'MRP': match.mrp,
          'DESCRIPTION': match.desc,
          'WARRANTY': '1 YEAR STANDARD WARRANTY'
        },
        category: match.category
      };
    }
  }
  if (!details) {
    details = productDetailsData.x1;
  }
  // Defensive normalization: CMS can return partial/missing fields during sync.
  details = {
    ...details,
    images: Array.isArray(details?.images) && details.images.length ? details.images : ['/x1bg2.webp'],
    colors: Array.isArray(details?.colors) && details.colors.length ? details.colors : ['Standard'],
    specs: details?.specs && typeof details.specs === 'object' ? details.specs : {},
    category: details?.category || 'evs',
    id: details?.id || 'x1',
  };
  const safeProducts = Array.isArray(allProducts) ? allProducts : [];

  const [activeImage, setActiveImage] = useState(details.images[0]);
  const [selectedColor, setSelectedColor] = useState(details.colors[0]);
  // Cart and simulated Checkout states
  const [toastMessage, setToastMessage] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '' });
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedApp, setSelectedApp] = useState('phonepe');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    setActiveImage(details.images[0]);
    setSelectedColor(details.colors[0]);
    // Scroll to top when loading a new product detail
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId, details]);

  // Find related products
  const allRelated = safeProducts.filter(
    (p) => p.category === details.category && p.id !== details.id
  );


  const isEv = details.category === 'evs';

  return (
    <div className={`min-h-screen font-sans ${isEv ? 'bg-white text-zinc-950' : 'bg-[#f8f9fa] text-zinc-950'}`}>
      
      {/* First Section (Hero with Background for Scooter, Default Style for others) */}
      <div 
        className={`relative pt-28 pb-16 px-6 ${
          isEv 
            ? 'bg-cover bg-center border-b border-zinc-200' 
            : 'bg-[#f8f9fa]'
        }`}
        style={isEv ? { backgroundImage: 'url("/haion_scooter_hero.webp")' } : {}}
      >
        {isEv && <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] z-0" />}

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Go Back Button */}
          <div className="mb-8 flex justify-start">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-white border border-zinc-200 hover:border-zinc-950 text-zinc-800 hover:text-zinc-950 text-sm font-bold shadow-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group backdrop-blur-sm"
            >
              <FiArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Go Back
            </button>
          </div>

          {/* Main Product Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Side: Thumbnail Stack & Image Showcase */}
            <div className="lg:col-span-7 grid grid-cols-12 gap-4">
              {/* Thumbnails */}
              <div className="col-span-3 md:col-span-2 flex flex-col gap-3">
                {details.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-square w-full rounded-xl overflow-hidden bg-white border-2 flex items-center justify-center p-1.5 transition-all duration-300 cursor-pointer ${
                      activeImage === img ? 'border-purple-500 shadow-md' : 'border-zinc-200/60 hover:border-zinc-350'
                    }`}
                  >
                    <img src={img} alt={`${details.name} view ${idx + 1}`} className="max-h-full object-contain" />
                  </button>
                ))}
              </div>

              {/* Active Big Image display */}
              <div className="col-span-9 md:col-span-10 relative aspect-[4/3] rounded-2xl border border-zinc-200/50 bg-white flex items-center justify-center p-6 group">
                <img
                  src={activeImage}
                  alt={details.name}
                  className="max-h-[85%] object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-4 right-4 bg-white border border-zinc-200/80 p-2 rounded-xl shadow-sm text-zinc-500 hover:text-purple-500 cursor-pointer transition-colors">
                  <FiMaximize2 size={16} />
                </div>
              </div>
            </div>

            {/* Right Side: Product Details Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-zinc-950 font-display mb-2">
                  {details.name}
                </h1>
                
                <div className="text-3xl font-black text-purple-500 font-display mb-4">
                  {details.price}
                </div>

                <p className="text-zinc-650 text-base font-normal mb-8 leading-relaxed">
                  {details.subtitle}
                </p>

                {/* Attributes Selectors */}
                <div className="space-y-6 mb-8 border-t border-zinc-200/60 pt-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Available Color:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 cursor-pointer transition-all duration-300 appearance-none"
                      >
                        {details.colors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      {/* Custom Arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Inquiry Query & Add/Buy Buttons */}
              <div className="space-y-4 pt-4 border-t border-zinc-200/60">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart(details, selectedColor);
                      }
                      setToastMessage(`"${details.name}" added to cart!`);
                      setTimeout(() => setToastMessage(''), 3000);
                    }}
                    className="w-full py-3.5 text-xs font-bold text-center uppercase tracking-wider rounded-full border-2 border-zinc-900 hover:bg-zinc-50 text-zinc-900 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Add To Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckout(true);
                      setOrderComplete(false);
                    }}
                    className="w-full py-3.5 text-xs font-bold text-center uppercase tracking-wider rounded-full bg-gradient-to-r from-zinc-950 to-amber-500 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.03] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Buy Now
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 text-center">
                  Our support team typically responds to inquiries within 15 minutes.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 px-6">
        {/* Meet The Incredible Electric Scooter Section (Only for EVs) */}
        {details.category === 'evs' && (
          <div className="mb-16 bg-[#edf1ec] rounded-3xl p-8 md:p-12 text-center border border-zinc-200/50 shadow-sm">
            <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-950 mb-10 font-display text-center">
              Meet The <span className="text-purple-650">Incredible</span> Electric Scooter.
            </h2>

            {/* Key Specifications Card */}
            <div className="mb-12 max-w-5xl mx-auto bg-[#1a1a1a] text-white rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-2xl border border-zinc-800">
              {/* Background wave decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-50,120 C150,180 250,50 450,110 C650,170 750,70 850,130" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M-50,150 C180,210 220,70 480,140 C620,200 780,100 880,160" stroke="white" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto relative z-10">
                {/* Km Range */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 w-full flex justify-center">
                    <svg viewBox="0 0 160 100" className="w-full max-w-[140px] h-24 md:h-28" xmlns="http://www.w3.org/2000/svg">
                      <style>{`
                        @keyframes moveRoad {
                          to { stroke-dashoffset: -28; }
                        }
                        .animate-road-line {
                          animation: moveRoad 1.2s linear infinite;
                        }
                      `}</style>
                      <rect width="160" height="100" rx="8" fill="#edf2ee" />
                      <polygon points="-10,65 30,30 70,65" fill="#4b5563" />
                      <polygon points="20,38 30,30 40,38" fill="#e5e7eb" />
                      
                      <polygon points="50,65 95,20 140,65" fill="#374151" />
                      <polygon points="82,33 95,20 108,33" fill="#e5e7eb" />

                      <polygon points="100,65 130,35 165,65" fill="#4b5563" />
                      <polygon points="120,45 130,35 140,45" fill="#e5e7eb" />

                      <path d="M-10,30 Q20,15 50,30 Q80,15 110,30 Q140,15 170,30 L170,65 L-10,65 Z" fill="#9ca3af" opacity="0.4" />
                      <path d="M-10,38 Q15,25 40,38 Q65,25 90,38 Q115,25 140,38 L140,65 L-10,65 Z" fill="#d1d5db" opacity="0.6" />

                      <rect y="65" width="160" height="35" fill="#65a30d" />

                      <polygon points="10,100 75,65 85,65 150,100" fill="#1f2937" />
                      <line x1="80" y1="65" x2="80" y2="100" stroke="#ffffff" strokeWidth="3" strokeDasharray="8,6" className="animate-road-line" />

                      <rect x="12" y="60" width="3" height="12" fill="#78350f" />
                      <circle cx="13.5" cy="54" r="7" fill="#22c55e" />
                    </svg>
                  </div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1 flex items-start justify-center">
                    200<span className="text-sm text-zinc-400 ml-0.5 mt-1">*</span>
                  </div>
                  <div className="text-xs md:text-sm text-zinc-450 font-medium tracking-wide">Km Range Per Charge</div>
                </div>

                {/* Watt Peak Power */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 w-full flex justify-center">
                    <svg viewBox="0 0 100 100" className="w-full max-w-[140px] h-24 md:h-28" xmlns="http://www.w3.org/2000/svg">
                      <style>{`
                        @keyframes pulseLightning {
                          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(56, 189, 248, 0.4)); }
                          50% { transform: scale(1.08); filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.9)); }
                        }
                        .animate-lightning {
                          animation: pulseLightning 1.8s ease-in-out infinite;
                          transform-origin: center;
                        }
                      `}</style>
                      <path d="M58,5 L32,54 H50 L42,95 L68,46 H50 Z" fill="#38bdf8" className="animate-lightning" />
                    </svg>
                  </div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">
                    1200
                  </div>
                  <div className="text-xs md:text-sm text-zinc-450 font-medium tracking-wide">Watt Peak Power</div>
                </div>

                {/* Modes & Reverse */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 w-full flex justify-center">
                    <svg viewBox="0 0 100 100" className="w-full max-w-[140px] h-24 md:h-28" xmlns="http://www.w3.org/2000/svg">
                      <style>{`
                        @keyframes spinClockwise {
                          to { transform: rotate(360deg); }
                        }
                        @keyframes spinCounterClockwise {
                          to { transform: rotate(-360deg); }
                        }
                        .gear-blue {
                          animation: spinClockwise 8s linear infinite;
                          transform-origin: 38px 38px;
                        }
                        .gear-slate {
                          animation: spinCounterClockwise 6s linear infinite;
                          transform-origin: 64px 44px;
                        }
                        .gear-orange {
                          animation: spinCounterClockwise 10s linear infinite;
                          transform-origin: 48px 66px;
                        }
                      `}</style>
                      <g transform="translate(38, 38)" fill="#3b82f6" className="gear-blue">
                        <circle cx="0" cy="0" r="14" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(0)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(45)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(90)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(135)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(180)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(225)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(270)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(315)" />
                        <circle cx="0" cy="0" r="6" fill="#1a1a1a" />
                      </g>
                      <g transform="translate(64, 44)" fill="#64748b" className="gear-slate">
                        <circle cx="0" cy="0" r="11" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(22.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(67.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(112.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(157.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(202.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(247.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(292.5)" />
                        <rect x="-2.5" y="-14" width="5" height="6" rx="1" transform="rotate(337.5)" />
                        <circle cx="0" cy="0" r="5" fill="#1a1a1a" />
                      </g>
                      <g transform="translate(48, 66)" fill="#f97316" className="gear-orange">
                        <circle cx="0" cy="0" r="14" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(15)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(60)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(105)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(150)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(195)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(240)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(285)" />
                        <rect x="-3" y="-18" width="6" height="8" rx="1" transform="rotate(330)" />
                        <circle cx="0" cy="0" r="6" fill="#1a1a1a" />
                      </g>
                    </svg>
                  </div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1">
                    4
                  </div>
                  <div className="text-xs md:text-sm text-zinc-450 font-medium tracking-wide">I 2 3 4 Modes & Reverse</div>
                </div>

                {/* Top Speed */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 w-full flex justify-center items-center h-32">
                    <AnimatedSpeedometer />
                  </div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white font-display mb-1 flex items-start justify-center">
                    25<span className="text-sm text-zinc-400 ml-0.5 mt-1">*</span>
                  </div>
                  <div className="text-xs md:text-sm text-zinc-450 font-medium tracking-wide">KMPH Top Speed</div>
                </div>
              </div>
            </div>

            {/* Collage Feature Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                {/* Digital Meter */}
                <div className="relative group overflow-hidden rounded-2xl bg-white border border-zinc-200 aspect-[4/3] flex items-center justify-center">
                  <img 
                    src="/front.webp" 
                    alt="Digital Meter" 
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                  <div className="absolute bottom-6 left-6 text-left z-20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-300 block">Digital</span>
                    <span className="text-xl font-bold text-white uppercase mt-0.5 block">Meter</span>
                  </div>
                </div>

                {/* LED Light */}
                <div className="relative group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-850 aspect-[4/3] flex items-center justify-center">
                  <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                    <img 
                      src="/body.webp" 
                      alt="LED Light" 
                      className="w-full h-full object-cover rotate-90 scale-[1.6] group-hover:scale-[1.7] transition-transform duration-500" 
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-6 left-6 text-left z-20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Led</span>
                    <span className="text-xl font-bold text-white uppercase mt-0.5 block">Light</span>
                  </div>
                </div>
              </div>

              {/* Middle Column - Tall Center Card */}
              <div className="relative group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-850 h-full min-h-[350px] md:min-h-[472px] flex items-center justify-center">
                <img 
                  src="/body2.webp" 
                  alt="Haion Scooter Front Profile" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                {/* Dual Suspension */}
                <div className="relative group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-850 aspect-[4/3] flex items-center justify-center">
                  <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                    <img 
                      src="/back.webp" 
                      alt="Dual Suspension" 
                      className="w-full h-full object-cover rotate-90 scale-[1.4] group-hover:scale-[1.5] transition-transform duration-500" 
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-6 left-6 text-left z-20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Dual</span>
                    <span className="text-xl font-bold text-white uppercase mt-0.5 block">Suspension</span>
                  </div>
                </div>

                {/* Disc Brakes */}
                <div className="relative group overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-850 aspect-[4/3] flex items-center justify-center">
                  <div className="w-full h-full overflow-hidden flex items-center justify-center relative">
                    <img 
                      src="/back.webp" 
                      alt="Disc Brakes" 
                      className="w-full h-full object-cover rotate-90 scale-[1.8] origin-center group-hover:scale-[1.9] transition-transform duration-500" 
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <div className="absolute bottom-6 left-6 text-left z-20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Disc</span>
                    <span className="text-xl font-bold text-white uppercase mt-0.5 block">Brakes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {/* Feature 1 */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 text-left sm:text-center p-4 bg-white/40 rounded-2xl border border-zinc-200/30">
                <div className="flex-shrink-0">
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 55 V82" stroke="#386a45" strokeWidth="4" strokeLinecap="round" />
                    <path d="M50 70 Q38 66 40 58 Q48 60 50 70" fill="#386a45" />
                    <path d="M50 75 Q62 71 60 63 Q52 65 50 75" fill="#386a45" />
                    <path d="M30 82 H70 C65 89 35 89 30 82Z" fill="#5c3a21" />
                    <g transform="translate(50, 38)">
                      {[...Array(12)].map((_, i) => (
                        <path
                          key={i}
                          d="M0 0 Q-7 -18 0 -24 Q7 -18 0 0"
                          fill="#ffc72c"
                          transform={`rotate(${i * 30})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="14" fill="#f39c12" />
                      <circle cx="0" cy="0" r="12" fill="#f1c40f" />
                      <text x="0" y="4.5" fill="#7f8c8d" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">₹</text>
                    </g>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-zinc-900">10 Paisa*</div>
                  <div className="text-sm text-zinc-600 font-medium">per Km</div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 text-left sm:text-center p-4 bg-white/40 rounded-2xl border border-zinc-200/30">
                <div className="flex-shrink-0">
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30 25 C30 25 50 18 50 18 C50 18 70 25 70 25 C70 50 58 72 50 80 C42 72 30 50 30 25Z" fill="#a0c4ff" stroke="#3b82f6" strokeWidth="3" />
                    <path d="M50 18 C50 18 70 25 70 25 C70 50 58 72 50 80 V18Z" fill="#3b82f6" opacity="0.3" />
                    <path d="M38 50 L48 60 L68 35" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M38 50 L48 60 L68 35" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-zinc-900">3 Years</div>
                  <div className="text-sm text-zinc-600 font-medium">Warranty on Battery</div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 text-left sm:text-center p-4 bg-white/40 rounded-2xl border border-zinc-200/30">
                <div className="flex-shrink-0">
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="34" y="24" width="32" height="36" rx="16" stroke="#0f172a" strokeWidth="4" fill="none" />
                    <rect x="26" y="46" width="48" height="34" rx="8" fill="white" stroke="#0f172a" strokeWidth="4" />
                    <circle cx="50" cy="60" r="4" fill="#0f172a" />
                    <path d="M48 63 H52 L53 72 H47 Z" fill="#0f172a" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-zinc-900">Anti Theft</div>
                  <div className="text-sm text-zinc-600 font-medium">Alarm</div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 text-left sm:text-center p-4 bg-white/40 rounded-2xl border border-zinc-200/30">
                <div className="flex-shrink-0">
                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="42" y="16" width="16" height="6" rx="2" fill="#0f172a" stroke="#0f172a" strokeWidth="2" />
                    <rect x="33" y="22" width="34" height="58" rx="6" fill="white" stroke="#0f172a" strokeWidth="4" />
                    <rect x="38" y="74" width="24" height="0" rx="3" fill="#22c55e" stroke="#0f172a" strokeWidth="2">
                      <animate 
                        attributeName="height" 
                        values="0;46;0" 
                        dur="2.5s" 
                        repeatCount="indefinite" 
                      />
                      <animate 
                        attributeName="y" 
                        values="74;28;74" 
                        dur="2.5s" 
                        repeatCount="indefinite" 
                      />
                    </rect>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-zinc-900">70 - 200 Km</div>
                  <div className="text-sm text-zinc-600 font-medium">in Single Charge</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spec Table: Product Information */}
        <div className="mb-20">
          <div className="flex border-b border-zinc-200 mb-8 justify-center">
            <span className="pb-3 text-lg font-bold border-b-2 border-purple-500 text-zinc-950 font-display">
              Description
            </span>
          </div>

          <GlassCard className="p-0 border-zinc-200/50 bg-white/80 overflow-hidden shadow-sm rounded-2xl">
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-bold text-zinc-900 mb-6 font-display text-center">
                Product Information
              </h3>
              
              <div className="divide-y divide-zinc-200/40">
                {Object.entries(details.specs).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-12 py-4 gap-2 text-sm text-center">
                    <div className="md:col-span-4 font-bold text-zinc-500 uppercase tracking-wider text-center">
                      {key}
                    </div>
                    <div className="md:col-span-8 text-zinc-800 font-semibold text-right pr-4 md:pr-16">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Whole New Range of LED TV specifications/pricing sheet */}
        {details.id.startsWith('tv') && (
          <div className="mb-20">
            <div className="flex border-b border-zinc-200 mb-8 justify-center">
              <span className="pb-3 text-lg font-bold border-b-2 border-purple-500 text-zinc-950 font-display">
                Whole New Range of LED TV
              </span>
            </div>

            <GlassCard className="p-0 border-zinc-200/50 bg-white/80 overflow-hidden shadow-sm rounded-2xl">
              <div className="p-6 md:p-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/50 text-xs font-bold uppercase tracking-wider text-zinc-950">
                      <th className="py-4 px-6 text-zinc-950">Model</th>
                      <th className="py-4 px-6 text-right text-zinc-950">Price</th>
                      <th className="py-4 px-6 text-right text-zinc-950">MRP</th>
                      <th className="py-4 px-6 text-zinc-950">Description</th>
                      <th className="py-4 px-6 text-zinc-950">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 text-sm">
                    {[
                      { model: 'LED-AH24', price: '₹ 5,400', mrp: '₹ 9,999', desc: 'Speaker 20 W Connectivity (AV IN, HDMI, USB, VGA, Earphone)' },
                      { model: 'LED-AH40Normal', price: '₹ 10,000', mrp: '₹ 17,999', desc: '(AOSP), Normal, Speaker 20W, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-32PROSmart', price: '₹ 8,000', mrp: '₹ 15,000', desc: 'Android (AOSP), 1.25/4GB , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-32SIRIS LED TV', price: '₹ 8,400', mrp: '₹ 9,999', desc: 'Android IRIS , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
                      { model: 'LED-AH32SOTIS LED TV', price: '₹ 9,999', mrp: '₹ 16,999', desc: 'Android (OTIS), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
                      { model: 'LED-AH32BLSmart', price: '₹ 10,999', mrp: '₹ 17,999', desc: 'Android (AOSP), Bezel Less, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
                      { model: 'LED-AH40Smart', price: '₹ 13,999', mrp: '₹ 21,000', desc: 'Android (AOSP), BT, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-AH43SBSmart', price: '₹ 17,999', mrp: '₹ 27,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Sound Bar In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-AH43BLSmart', price: '₹ 19,999', mrp: '₹ 28,000', desc: 'Bezel less, Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Voice Remote, BT In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-AH43WEB', price: '₹ 24,999', mrp: '₹ 34,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
                      { model: 'LED-AH50Smart', price: '₹ 25,999', mrp: '₹ 42,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-AH50WEB', price: '₹ 29,999', mrp: '₹ 49,000', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
                      { model: 'LED-AN55Smart', price: '₹ 31,999', mrp: '₹ 50,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
                      { model: 'LED-AH55WEB', price: '₹ 38,999', mrp: '₹ 55,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
                      { model: 'LED-AN65Smart', price: '₹ 49,999', mrp: '₹ 75,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' }
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-zinc-950">{row.model}</td>
                        <td className="py-4 px-6 text-right font-bold text-zinc-950">{row.price}</td>
                        <td className="py-4 px-6 text-right font-medium text-zinc-400 line-through">{row.mrp}</td>
                        <td className="py-4 px-6 text-zinc-950 font-normal leading-relaxed">{row.desc}</td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => onViewProduct(row.model)}
                            className="inline-flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs py-1.5 px-3.5 rounded-full cursor-pointer transition-all duration-300 shadow-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* You May Also Like Section */}
        <div>
          <h2 className="text-3xl font-extrabold text-center text-zinc-950 font-display mb-12">
            You May Also Like
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allRelated.map((product) => (
              <div 
                key={product.id}
                onClick={() => onViewProduct(product.id)}
                className="cursor-pointer"
              >
                <GlassCard className="h-full flex flex-col justify-between p-6 border-zinc-200/50 bg-white/70 hover:bg-white hover:border-purple-500/35 hover:shadow-[0_12px_30px_rgba(232,141,1,0.08)] transition-all duration-500 rounded-2xl group">
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4 flex items-center justify-center bg-zinc-50 border border-zinc-100">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className={`max-h-40 object-contain z-10 transition-transform duration-500 ${
                        product.id.startsWith('x') 
                          ? 'scale-[1.35] group-hover:scale-[1.42]' 
                          : 'group-hover:scale-105'
                      }`}
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-extrabold text-zinc-900 mb-1 font-display group-hover:text-purple-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-zinc-500 text-xs font-normal px-2 line-clamp-2">
                      {product.subtitle}
                    </p>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Floating Add to Cart Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[110] bg-zinc-950 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-zinc-800 text-sm font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Checkout Modal Overlay */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-y-auto max-h-[90vh] max-w-md w-full shadow-2xl border border-zinc-200 flex flex-col"
            >
              <div className="bg-zinc-950 text-white p-6 relative flex-shrink-0">
                <button
                  onClick={() => {
                    if (!paymentProcessing) {
                      setShowCheckout(false);
                    }
                  }}
                  className="absolute top-6 right-6 text-white hover:text-zinc-300 transition-colors cursor-pointer"
                  disabled={paymentProcessing}
                >
                  ✕
                </button>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Secure Checkout
                </span>
                <h3 className="text-xl font-bold font-display">
                  Buy {details.name}
                </h3>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {paymentProcessing ? (
                  <div className="text-center py-10 space-y-6 flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900">Secure Payment via Razorpay</h4>
                      <p className="text-xs text-zinc-500 mt-2 max-w-xs mx-auto">
                        Complete payment in the Razorpay window for {details.price}.
                      </p>
                    </div>
                  </div>
                ) : orderComplete ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-300 text-2xl font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900">
                        {paymentMethod === 'online' ? 'Payment Verified & Order Placed!' : 'Order Placed Successfully!'}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Thank you for your purchase. {paymentMethod === 'online' && 'Your Razorpay payment was successful.'}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Your Tracking ID</span>
                      <span className="text-lg font-black text-zinc-950 font-display block select-all mt-1">{generatedOrderId}</span>
                      <button
                        onClick={() => {
                          setShowCheckout(false);
                          if (onTrackOrder) {
                            onTrackOrder(generatedOrderId);
                          }
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Track Shipment Status →
                      </button>
                    </div>

                    <button
                      onClick={() => setShowCheckout(false)}
                      className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCheckoutError('');
                      setPaymentProcessing(true);
                      try {
                        const cartItem = {
                          id: details.id,
                          name: details.name,
                          price: details.price,
                          image: details.images?.[0],
                          color: selectedColor,
                          quantity: 1,
                        };
                        const result = await processStoreCheckout({
                          cartItems: [cartItem],
                          customer: {
                            name: checkoutForm.name,
                            phone: checkoutForm.phone,
                            address: checkoutForm.address,
                          },
                          paymentMethod,
                          merchantName: 'HAION EV & Appliances',
                        });
                        setGeneratedOrderId(result.orderNo);
                        setOrderComplete(true);
                      } catch (err) {
                        setCheckoutError(err?.response?.data?.message || err?.message || 'Checkout failed.');
                      } finally {
                        setPaymentProcessing(false);
                      }
                    }}
                    className="space-y-4 text-left"
                  >
                    {checkoutError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{checkoutError}</div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">FullName *</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        placeholder="10-digit number"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">Shipping Address *</label>
                      <textarea
                        required
                        rows="3"
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        placeholder="Enter full address"
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-2">Payment Method *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                          paymentMethod === 'cod' 
                            ? 'border-zinc-950 bg-zinc-950 text-white' 
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="cod" 
                            checked={paymentMethod === 'cod'} 
                            onChange={() => setPaymentMethod('cod')} 
                            className="sr-only"
                          />
                          <span>Cash on Delivery</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                          paymentMethod === 'online' 
                            ? 'border-zinc-950 bg-zinc-950 text-white' 
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="online" 
                            checked={paymentMethod === 'online'} 
                            onChange={() => setPaymentMethod('online')} 
                            className="sr-only"
                          />
                          <span>Pay Online</span>
                        </label>
                      </div>
                    </div>

                    {paymentMethod === 'online' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        Pay securely with Razorpay — UPI, cards, netbanking &amp; wallets.
                      </div>
                    )}

                    <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-2xl flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Price details</span>
                        <span className="text-base font-black text-zinc-900">{details.price}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 text-xs font-bold text-center uppercase tracking-wider rounded-full bg-gradient-to-r from-zinc-950 to-amber-500 text-white hover:scale-[1.02] transition-all duration-300 mt-6 cursor-pointer"
                    >
                      {paymentMethod === 'online' ? 'Pay with Razorpay' : 'Confirm Order'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
