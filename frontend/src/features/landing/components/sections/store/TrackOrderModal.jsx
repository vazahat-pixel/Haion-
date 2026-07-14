import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiPackage, FiTruck, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { useCMSTrackingUiCopy, useCMSCheckoutCopy } from '../../../cms/hooks/useCMSCopy';
import { storePublicService } from '@/services/store.service';

export default function TrackOrderModal({ isOpen, onClose, initialOrderId = '' }) {
  const tracking = useCMSTrackingUiCopy();
  const checkout = useCMSCheckoutCopy();
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState('');
  const [searchedId, setSearchedId] = useState(initialOrderId);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError(tracking.emptyError || 'Please enter a valid Order ID');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter the phone number used during checkout');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const cleanId = orderId.trim().toUpperCase();
      const order = await storePublicService.trackOrder(cleanId, phone.trim());
      setOrderData({
        id: order.orderNo,
        date: new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: (order.lineItems || []).map((i) => `${i.name} (x${i.quantity})`).join(', '),
        status: order.status,
        address: order.shippingAddress,
        timeline: order.timeline || [],
        paymentMethod: order.paymentMethod,
      });
      setSearchedId(cleanId);
    } catch {
      setError(tracking.notFoundError || 'Order not found. Check order ID and phone number.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      setSearchedId(initialOrderId);
    }
  }, [initialOrderId]);

  const statusSteps = ['CONFIRMED', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED'];
  const currentIdx = orderData ? statusSteps.indexOf(orderData.status) : -1;

  const steps = (tracking.steps || []).map((step, i) => ({
    label: step.label,
    desc: step.desc || step.description || '',
    icon: [<FiPackage />, <FiCheckCircle />, <FiTruck />, <FiMapPin />][i] || <FiPackage />,
    completed: currentIdx >= i,
    active: currentIdx === i,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-zinc-200"
          >
            <div className="bg-zinc-950 text-white p-6 relative">
              <button onClick={onClose} className="absolute top-6 right-6 text-white hover:text-zinc-300 transition-colors cursor-pointer">
                <FiX size={20} />
              </button>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                {tracking.badge || 'Track Order'}
              </span>
              <h3 className="text-xl font-bold font-display">{tracking.title || 'Track Your Order'}</h3>
            </div>

            <div className="p-6">
              {!orderData ? (
                <form onSubmit={handleTrack} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">{tracking.orderIdLabel || 'Order ID'}</label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder={tracking.orderIdPlaceholder || 'HAION-123456'}
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <FiSearch size={14} />
                    {loading ? 'Searching…' : (tracking.trackButtonLabel || 'Track Order')}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Order ID</span>
                    <span className="text-lg font-black text-zinc-950 font-display">{searchedId}</span>
                    <p className="text-xs text-zinc-500 mt-2">{orderData.items}</p>
                    <p className="text-xs text-zinc-500 mt-1">{orderData.address}</p>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, i) => (
                      <div key={i} className={`flex gap-4 ${step.completed ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          step.active ? 'bg-amber-500 text-white' : step.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'
                        }`}>
                          {step.icon}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{step.label}</p>
                          <p className="text-xs text-zinc-500">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setOrderData(null); setError(''); }}
                    className="w-full py-3 border border-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer"
                  >
                    Track Another Order
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
