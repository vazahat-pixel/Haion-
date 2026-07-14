import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiPackage, FiMapPin, FiTruck, FiCheckCircle, FiPhone, FiMail } from 'react-icons/fi';

import { useCMSProfileUiCopy, useCMSTrackingCopy } from '../../cms/hooks/useCMSCopy';

export default function ProfilePage({ onClose }) {
  const profile = useCMSProfileUiCopy();
  const tracking = useCMSTrackingCopy();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const checkOrders = () => {
      const stored = JSON.parse(localStorage.getItem('haion_orders') || '[]');
      setOrders(stored);
      // Select the first order by default if available
      if (stored.length > 0 && !selectedOrder) {
        setSelectedOrder(stored[stored.length - 1]); // Select latest order
      }
    };
    checkOrders();
    const interval = setInterval(checkOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  // Use values from the latest order if available to populate the profile dynamically
  const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null;
  const userName = latestOrder?.name || profile.guestName;
  const userPhone = latestOrder?.phone || profile.guestPhone;
  const userAddress = latestOrder?.address || profile.noAddress;

  const steps = (tracking.steps || []).map((step, i) => ({
    label: step.label,
    desc: step.desc || step.description || '',
    icon: [<FiPackage />, <FiCheckCircle />, <FiTruck />, <FiMapPin />][i] || <FiPackage />,
    completed: i < 2,
    active: i === 2,
  }));

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-800 pt-28 pb-16 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition-colors duration-300 font-semibold text-sm cursor-pointer"
          >
            <FiArrowLeft size={16} />
            {profile.backLabel}
          </button>
          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">{profile.clubLabel}</span>
            <h1 className="text-2xl font-black font-display text-zinc-900">{profile.pageTitle}</h1>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card & Orders List */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Profile Info Card */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 relative overflow-hidden shadow-xs">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-black shadow-md border border-amber-400/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 font-display">{userName}</h2>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-full">
                    {profile.memberTier}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3.5 border-t border-zinc-100 pt-5">
                <div className="flex items-center gap-3 text-xs">
                  <FiMail className="text-zinc-400 text-sm" />
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">{profile.emailLabel}</span>
                    <span className="text-zinc-700 font-semibold">{profile.guestEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <FiPhone className="text-zinc-400 text-sm" />
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">{profile.phoneLabel}</span>
                    <span className="text-zinc-700 font-semibold">{userPhone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <FiMapPin className="text-zinc-400 text-sm mt-0.5" />
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">{profile.addressLabel}</span>
                    <span className="text-zinc-700 font-semibold leading-relaxed">{userAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders History List */}
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 font-display uppercase tracking-wider border-b border-zinc-100 pb-2">
                Order History ({orders.length})
              </h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 text-xs">
                  <FiPackage className="mx-auto text-2xl mb-2 text-zinc-350" />
                  No orders placed yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left flex justify-between items-center ${
                        selectedOrder?.id === ord.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 font-mono tracking-wider">{ord.id}</span>
                        <p className="text-xs font-semibold text-zinc-800 truncate max-w-[180px]">{ord.items}</p>
                        <span className="text-[9px] text-zinc-400 font-medium block">{ord.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-zinc-900 block">₹{ord.price || "5,499"}</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          {ord.status || 'In Transit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order Live Tracking Details */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-6">
                
                {/* Tracking Header */}
                <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Live Status</span>
                    <h2 className="text-lg font-bold text-zinc-900 font-display">Tracking {selectedOrder.id}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Est. Delivery</span>
                    <span className="text-emerald-600 font-extrabold text-xs font-display">2-3 Business Days</span>
                  </div>
                </div>

                {/* Items & Shipping Summary */}
                <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Items Ordered</span>
                    <span className="text-zinc-850 font-bold max-w-[250px] text-right truncate">{selectedOrder.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Shipping to</span>
                    <span className="text-zinc-850 font-bold max-w-[250px] text-right truncate">{selectedOrder.address}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-2 mt-2">
                    <span className="text-zinc-500 font-semibold">Order Placed On</span>
                    <span className="text-zinc-800 font-mono font-bold">{selectedOrder.date}</span>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="space-y-6 relative pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-200 mt-4 text-left">
                  {steps.map((step, idx) => (
                    <div key={idx} className="relative flex gap-4 items-start">
                      <div className={`absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs transition-all duration-500 ${
                        step.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : step.active
                          ? 'bg-amber-500 border-amber-500 text-zinc-950 animate-pulse font-bold'
                          : 'bg-white border-zinc-200 text-zinc-400'
                      }`}>
                        {step.icon}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${step.completed || step.active ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {step.label}
                          {step.active && (
                            <span className="ml-2 inline-block bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                              Live
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map Graphics */}
                <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-sky-50 relative h-48 flex items-center justify-center shadow-inner">
                  {/* Simulated light Map Lines */}
                  <svg className="absolute inset-0 w-full h-full text-zinc-200" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <path d="M20,0 L20,100 M60,0 L60,100 M0,20 L100,20 M0,80 L100,80" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                  </svg>

                  {/* Truck animation */}
                  <div className="absolute left-[45%] top-[40%] flex flex-col items-center">
                    <div className="w-6 h-6 bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 rounded-full flex items-center justify-center shadow-md animate-bounce text-xs">
                      🚚
                    </div>
                    <div className="w-3 h-1 bg-black/15 rounded-full blur-xs mt-0.5" />
                  </div>

                  <div className="absolute right-[15%] top-[30%] flex flex-col items-center">
                    <div className="w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-md text-[9px] text-white">
                      ✓
                    </div>
                    <span className="bg-emerald-650 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md mt-1.5 shadow-sm">
                      Destination
                    </span>
                  </div>

                  <span className="absolute bottom-3 left-3 bg-zinc-900/90 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg shadow-sm">
                    Fleet GPS Signal Connected
                  </span>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-zinc-200/80 rounded-3xl p-12 text-center text-zinc-400 h-full flex flex-col justify-center items-center gap-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-150 text-3xl">
                  📦
                </div>
                <div>
                  <h3 className="text-zinc-800 font-bold text-sm font-display uppercase tracking-wider">No Active Tracking Selection</h3>
                  <p className="text-xs mt-1 max-w-sm mx-auto text-zinc-500">
                    Place an order or select one of your order records from the list to view real-time shipping logs and map route tracking details.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
