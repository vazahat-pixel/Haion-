import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProductDetails from './components/sections/ProductDetails';
import AboutUs from './components/sections/AboutUs';
import HomeAppliancesPage from './components/sections/HomeAppliancesPage';
import ServiceDetailsPage from './components/sections/ServiceDetailsPage';
import StorePage from './components/sections/StorePage';
import LeadPopup from './components/ui/LeadPopup';
import SectionRenderer from './cms/SectionRenderer';
import CareerFormModal from './components/sections/store/CareerFormModal';
import { CartDrawer } from './components/ui';
import TrackOrderModal from './components/sections/store/TrackOrderModal';
import ProfilePage from './components/sections/ProfilePage';
import InverterPage from './components/sections/InverterPage';
import { useCMSLeadPopupFullCopy, useCMSCheckoutCopy } from './cms/hooks/useCMSCopy';
import { processStoreCheckout } from './utils/storeCheckout';

function App() {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const scrollRef = React.useRef(0);
  const previousServiceIdRef = React.useRef(null);
  const [previousPage, setPreviousPage] = useState(null); // 'home' | 'appliances' | 'inverter' | 'service'

  const handleOpenProductDetails = (id, fromPage = 'home') => {
    scrollRef.current = window.scrollY;
    setPreviousPage(fromPage);
    if (fromPage === 'service') {
      previousServiceIdRef.current = selectedServiceId;
      setSelectedServiceId(null);
    }
    if (fromPage === 'appliances') {
      setShowHomeAppliances(false);
    }
    if (fromPage === 'inverter') {
      setShowInverter(false);
    }
    setSelectedProductId(id);
  };

  const handleCloseProductDetails = () => {
    setSelectedProductId(null);
    if (previousPage === 'appliances') {
      setShowHomeAppliances(true);
    } else if (previousPage === 'inverter') {
      setShowInverter(true);
    } else if (previousPage === 'service') {
      setSelectedServiceId(previousServiceIdRef.current);
    }
    // Restore scroll position
    setTimeout(() => {
      window.scrollTo({ top: scrollRef.current, behavior: 'smooth' });
    }, 100);
  };

  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showHomeAppliances, setShowHomeAppliances] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showCareersModal, setShowCareersModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInverter, setShowInverter] = useState(false);

  // Global Cart state
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCartCheckout, setShowCartCheckout] = useState(false);
  const [cartCheckoutForm, setCartCheckoutForm] = useState({ name: '', phone: '', address: '' });
  const [cartOrderComplete, setCartOrderComplete] = useState(false);
  const [cartPaymentMethod, setCartPaymentMethod] = useState('cod');
  const [cartSelectedApp, setCartSelectedApp] = useState('phonepe');
  const [cartPaymentProcessing, setCartPaymentProcessing] = useState(false);
  const [cartGeneratedOrderId, setCartGeneratedOrderId] = useState('');
  const [cartCheckoutError, setCartCheckoutError] = useState('');

  // Global Tracking state
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');

  const handleOpenTracking = (orderId = '') => {
    setTrackingOrderId(orderId);
    setIsTrackingOpen(true);
  };

  const handleAddToCart = (product, color) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.color === color);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.color === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          color,
          quantity: 1
        }
      ];
    });
  };

  const handleUpdateCartQuantity = (id, color, quantity) => {
    if (quantity <= 0) {
      handleRemoveCartItem(id, color);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id && item.color === color ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (id, color) => {
    setCartItems((prev) => prev.filter((item) => !(item.id === id && item.color === color)));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const leadPopup = useCMSLeadPopupFullCopy();
  const checkoutCopy = useCMSCheckoutCopy();

  React.useEffect(() => {
    if (!leadPopup.enabled) return undefined;
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, leadPopup.delayMs);
    return () => clearTimeout(timer);
  }, [leadPopup.enabled, leadPopup.delayMs]);

  const navigateToHomeSection = (href) => {
    setShowProfile(false);
    if (href.startsWith('#service-')) {
      const serviceId = href.replace('#service-', '');
      setSelectedServiceId(serviceId);
      setShowAboutUs(false);
      setShowHomeAppliances(false);
      setShowStore(false);
      setSelectedProductId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowAboutUs(false);
    setShowHomeAppliances(false);
    setShowStore(false);
    setShowInverter(false);
    setSelectedProductId(null);
    setSelectedServiceId(null);
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-gray-200 antialiased overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      {/* Sticky Premium Navbar */}
      <Navbar 
        onAboutUsClick={() => {
          setSelectedProductId(null);
          setShowHomeAppliances(false);
          setSelectedServiceId(null);
          setShowStore(false);
          setShowProfile(false);
          setShowInverter(false);
          setShowAboutUs(true);
        }}
        onHomeAppliancesClick={() => {
          setSelectedProductId(null);
          setShowAboutUs(false);
          setSelectedServiceId(null);
          setShowStore(false);
          setShowProfile(false);
          setShowInverter(false);
          setShowHomeAppliances(true);
        }}
        onHomeClick={() => {
          setShowAboutUs(false);
          setShowHomeAppliances(false);
          setSelectedProductId(null);
          setSelectedServiceId(null);
          setShowStore(false);
          setShowProfile(false);
          setShowInverter(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onStoreClick={() => {
          setSelectedProductId(null);
          setShowAboutUs(false);
          setSelectedServiceId(null);
          setShowHomeAppliances(false);
          setShowProfile(false);
          setShowInverter(false);
          setShowStore(true);
        }}
        onNavLinkClick={navigateToHomeSection}
        onCareersClick={() => setShowCareersModal(true)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onTrackClick={() => handleOpenTracking('')}
        onProfileClick={() => {
          setSelectedProductId(null);
          setShowAboutUs(false);
          setSelectedServiceId(null);
          setShowStore(false);
          setShowHomeAppliances(false);
          setShowInverter(false);
          setShowProfile(true);
        }}
        onInverterClick={() => {
          setSelectedProductId(null);
          setShowAboutUs(false);
          setSelectedServiceId(null);
          setShowStore(false);
          setShowHomeAppliances(false);
          setShowProfile(false);
          setShowInverter(true);
        }}
      />

      {/* Main Cinematic Sections */}
      <main>
        {showProfile ? (
          <ProfilePage onClose={() => setShowProfile(false)} />
        ) : showHomeAppliances ? (
          <HomeAppliancesPage
            onViewDetails={(id) => handleOpenProductDetails(id, 'appliances')}
            onClose={() => setShowHomeAppliances(false)}
          />
        ) : showInverter ? (
          <InverterPage
            onViewDetails={(id) => handleOpenProductDetails(id, 'inverter')}
            onClose={() => setShowInverter(false)}
          />
        ) : showAboutUs ? (
          <AboutUs onClose={() => setShowAboutUs(false)} onCareersClick={() => setShowCareersModal(true)} />
        ) : showStore ? (
          <StorePage onClose={() => setShowStore(false)} />
        ) : selectedServiceId ? (
          <ServiceDetailsPage
            serviceId={selectedServiceId}
            onViewProduct={(id) => handleOpenProductDetails(id, 'service')}
            onClose={() => setSelectedServiceId(null)}
          />
        ) : selectedProductId ? (
          <ProductDetails
            productId={selectedProductId}
            onClose={handleCloseProductDetails}
            onViewProduct={(id) => handleOpenProductDetails(id, previousPage)}
            onAddToCart={handleAddToCart}
            onTrackOrder={handleOpenTracking}
          />
        ) : (
          <SectionRenderer onViewDetails={(id) => handleOpenProductDetails(id, 'home')} />
        )}
      </main>

      {/* 14. PREMIUM FOOTER */}
      <Footer onCareersClick={() => setShowCareersModal(true)} />

      {/* Automated Lead Popup */}
      <LeadPopup isOpen={showPopup} onClose={() => setShowPopup(false)} copy={leadPopup} />

      {/* Career Application Form Modal */}
      <CareerFormModal isOpen={showCareersModal} onClose={() => setShowCareersModal(false)} />

      {/* Real-time Order Tracking Modal */}
      <TrackOrderModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderId={trackingOrderId}
      />

      {/* Global Cart Slide-out Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setShowCartCheckout(true);
          setCartOrderComplete(false);
        }}
      />

      {/* Global Checkout Modal */}
      <AnimatePresence>
        {showCartCheckout && (
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
                    if (!cartPaymentProcessing) {
                      setShowCartCheckout(false);
                    }
                  }}
                  className="absolute top-6 right-6 text-white hover:text-zinc-300 transition-colors cursor-pointer"
                  disabled={cartPaymentProcessing}
                >
                  ✕
                </button>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  {checkoutCopy.secureCheckoutLabel}
                </span>
                <h3 className="text-xl font-bold font-display">
                  {checkoutCopy.orderDetailsTitle}
                </h3>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {cartPaymentProcessing ? (
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
                        Complete payment in the Razorpay window — UPI, cards &amp; wallets accepted.
                      </p>
                    </div>
                  </div>
                ) : cartOrderComplete ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-300 text-2xl font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-zinc-900">
                        {cartPaymentMethod === 'online' ? 'Payment Verified & Order Placed!' : 'Order Placed Successfully!'}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1">
                        Thank you for your purchase. {cartPaymentMethod === 'online' && 'Your Razorpay payment was successful.'}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Your Tracking ID</span>
                      <span className="text-lg font-black text-zinc-950 font-display block select-all mt-1">{cartGeneratedOrderId}</span>
                      <button
                        onClick={() => {
                          setShowCartCheckout(false);
                          handleOpenTracking(cartGeneratedOrderId);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Track Shipment Status →
                      </button>
                    </div>

                    <button
                      onClick={() => setShowCartCheckout(false)}
                      className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCartCheckoutError('');
                      setCartPaymentProcessing(true);
                      try {
                        const result = await processStoreCheckout({
                          cartItems,
                          customer: {
                            name: cartCheckoutForm.name,
                            phone: cartCheckoutForm.phone,
                            address: cartCheckoutForm.address,
                          },
                          paymentMethod: cartPaymentMethod,
                          merchantName: checkoutCopy.merchantName,
                        });
                        setCartGeneratedOrderId(result.orderNo);
                        setCartOrderComplete(true);
                        handleClearCart();
                      } catch (err) {
                        setCartCheckoutError(err?.response?.data?.message || err?.message || 'Checkout failed. Please try again.');
                      } finally {
                        setCartPaymentProcessing(false);
                      }
                    }}
                  >
                    {cartCheckoutError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                        {cartCheckoutError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">{checkoutCopy.nameLabel} *</label>
                      <input
                        type="text"
                        required
                        value={cartCheckoutForm.name}
                        onChange={(e) => setCartCheckoutForm({ ...cartCheckoutForm, name: e.target.value })}
                        placeholder={checkoutCopy.namePlaceholder}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">{checkoutCopy.phoneLabel} *</label>
                      <input
                        type="tel"
                        required
                        value={cartCheckoutForm.phone}
                        onChange={(e) => setCartCheckoutForm({ ...cartCheckoutForm, phone: e.target.value })}
                        placeholder={checkoutCopy.phonePlaceholder}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-1">{checkoutCopy.addressLabel} *</label>
                      <textarea
                        required
                        rows="3"
                        value={cartCheckoutForm.address}
                        onChange={(e) => setCartCheckoutForm({ ...cartCheckoutForm, address: e.target.value })}
                        placeholder={checkoutCopy.addressPlaceholder}
                        className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-2.5 text-zinc-800 text-sm focus:outline-none focus:border-zinc-950 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-650 uppercase mb-2">{checkoutCopy.paymentMethodLabel} *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                          cartPaymentMethod === 'cod' 
                            ? 'border-zinc-950 bg-zinc-950 text-white' 
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}>
                          <input 
                            type="radio" 
                            name="cartPaymentMethod" 
                            value="cod" 
                            checked={cartPaymentMethod === 'cod'} 
                            onChange={() => setCartPaymentMethod('cod')} 
                            className="sr-only"
                          />
                          <span>{checkoutCopy.codLabel}</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                          cartPaymentMethod === 'online' 
                            ? 'border-zinc-950 bg-zinc-950 text-white' 
                            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                        }`}>
                          <input 
                            type="radio" 
                            name="cartPaymentMethod" 
                            value="online" 
                            checked={cartPaymentMethod === 'online'} 
                            onChange={() => setCartPaymentMethod('online')} 
                            className="sr-only"
                          />
                          <span>{checkoutCopy.onlineLabel}</span>
                        </label>
                      </div>
                    </div>

                    {cartPaymentMethod === 'online' && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        Pay securely with Razorpay — UPI, debit/credit cards, netbanking &amp; wallets.
                      </div>
                    )}

                    <div className="bg-zinc-50 border border-zinc-150 p-4 rounded-2xl flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">{checkoutCopy.totalPayableLabel}</span>
                        <span className="text-base font-black text-zinc-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          }).format(
                            cartItems.reduce((acc, item) => {
                              const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
                              return acc + priceNum * item.quantity;
                            }, 0)
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        {cartPaymentMethod === 'cod' ? checkoutCopy.codLabel : checkoutCopy.onlineLabel}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 text-xs font-bold text-center uppercase tracking-wider rounded-full bg-gradient-to-r from-zinc-950 to-amber-500 text-white hover:scale-[1.02] transition-all duration-300 mt-6 cursor-pointer"
                    >
                      {cartPaymentMethod === 'online' ? 'Pay with Razorpay' : checkoutCopy.confirmOrderLabel}
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

export default App;
