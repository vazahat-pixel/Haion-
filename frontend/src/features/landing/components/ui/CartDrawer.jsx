import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCMSCartFullCopy } from '../../cms/hooks/useCMSCopy';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) {
  const cartCopy = useCMSCartFullCopy();
  const subtotal = cartItems.reduce((acc, item) => {
    // Parse integer price (e.g. "₹38,999" -> 38999)
    const priceNum = parseInt(item.price.replace(/[^\d]/g, ''), 10) || 0;
    return acc + priceNum * item.quantity;
  }, 0);

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white text-zinc-950 shadow-2xl z-[101] flex flex-col h-full border-l border-zinc-200"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-150 flex items-center justify-between bg-zinc-950 text-white">
              <div className="flex items-center gap-2.5">
                <FiShoppingBag className="text-xl text-amber-500" />
                <span className="text-lg font-bold font-display">{cartCopy.title}</span>
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <FiShoppingBag size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-800">{cartCopy.emptyTitle}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{cartCopy.emptyBody}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider"
                  >
                    {cartCopy.continueShopping}
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={`${item.id}-${item.color}`}
                    className="flex gap-4 p-4 rounded-2xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-white border border-zinc-200/80 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full object-contain"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-sm text-zinc-900 truncate font-display">
                            {item.name}
                          </h4>
                          <span className="font-bold text-sm text-purple-600 whitespace-nowrap">
                            {item.price}
                          </span>
                        </div>
                        {item.color && (
                          <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                            Color: {item.color}
                          </span>
                        )}
                      </div>

                      {/* Quantity & Delete Actions */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center border border-zinc-250 bg-white rounded-lg overflow-hidden shadow-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.color, item.quantity - 1)}
                            className="p-1.5 hover:bg-zinc-50 text-zinc-650 cursor-pointer"
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="px-3 text-xs font-bold text-zinc-800 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.color, item.quantity + 1)}
                            className="p-1.5 hover:bg-zinc-50 text-zinc-650 cursor-pointer"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id, item.color)}
                          className="text-zinc-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Actions */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-zinc-150 bg-zinc-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-zinc-600">{cartCopy.subtotalLabel}</span>
                  <span className="text-xl font-extrabold text-zinc-950 font-display">
                    {formattedSubtotal}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">{cartCopy.taxNote}</p>
                <button
                  onClick={onCheckout}
                  className="w-full py-3.5 bg-gradient-to-r from-zinc-950 to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                >
                  {cartCopy.checkoutLabel}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
