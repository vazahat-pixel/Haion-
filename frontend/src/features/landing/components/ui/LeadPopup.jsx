import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiTarget, FiStar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeadPopup({ isOpen, onClose, copy = {} }) {
  // Steps: 'details' | 'otp' | 'survey' | 'schedule' | 'confirmation'
  const [step, setStep] = useState('details');
  
  // Step 1 Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pinCode: '',
    model: ''
  });

  // Step 2 Data (OTP)
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // Step 3 Data (Survey)
  const [timeline, setTimeline] = useState('');
  const [helpTopic, setHelpTopic] = useState('');

  // Step 4 Data (Schedule)
  const [selectedDateIdx, setSelectedDateIdx] = useState(1); // Default to tomorrow
  const [datesList, setDatesList] = useState([]);

  // Generate 6 upcoming days dynamically
  useEffect(() => {
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Start from today: June 13, 2026
    const baseDate = new Date(2026, 5, 13); // June is index 5
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      
      let relativeDay = weekdays[d.getDay()];
      if (i === 0) relativeDay = 'Today';
      if (i === 1) relativeDay = 'Tomorrow';

      days.push({
        dayNum: d.getDate(),
        month: months[d.getMonth()],
        label: relativeDay,
        formatted: `${relativeDay}, ${d.getDate()}th ${months[d.getMonth()]} 2026`,
        isPopular: i < 2 // First two cards are popular picks
      });
    }
    setDatesList(days);
  }, []);

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.pinCode && formData.model) {
      setStep('otp');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace to focus previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 4) {
      setStep('survey');
    }
  };

  const resetModal = () => {
    setStep('details');
    setFormData({ name: '', phone: '', pinCode: '', model: '' });
    setOtp(['', '', '', '']);
    setTimeline('');
    setHelpTopic('');
    setSelectedDateIdx(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Form Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-purple-50/60 via-white to-amber-50/40 rounded-[32px] w-full max-w-[420px] p-8 md:p-10 shadow-2xl text-left z-10 overflow-hidden font-sans text-zinc-900 border border-purple-100/50"
          >
            {/* Background pattern matching reference image */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] select-none" />
            
            {/* Left side triangle watermark pattern */}
            <div className="absolute inset-y-0 left-0 w-8 opacity-[0.06] pointer-events-none select-none overflow-hidden flex flex-col justify-around py-8">
              {[...Array(6)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-zinc-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
                </svg>
              ))}
            </div>

            {/* Right side triangle watermark pattern */}
            <div className="absolute inset-y-0 right-0 w-8 opacity-[0.06] pointer-events-none select-none overflow-hidden flex flex-col justify-around py-8">
              {[...Array(6)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-zinc-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
                </svg>
              ))}
            </div>

            {/* Top Right Tech Corner SVG (Reference style, App themed) */}
            <svg className="absolute top-0 right-0 w-36 h-14 pointer-events-none select-none" viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M160 0H80L66 14H134L122 26H160V0Z" fill="url(#techCornerGrad)" />
              <path d="M57 4L65 12L61 16L53 8L57 4Z" fill="url(#techCornerGrad)" opacity="0.8" />
              <path d="M44 4L49 9L46 12L41 7L44 4Z" fill="url(#techCornerGrad)" opacity="0.6" />
              <defs>
                <linearGradient id="techCornerGrad" x1="0" y1="0" x2="160" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>

            {/* Bottom Left Tech Corner SVG (Reference style, App themed) */}
            <svg className="absolute bottom-0 left-0 w-36 h-14 pointer-events-none select-none" viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 64H80L94 50H26L38 38H0V64Z" fill="url(#techCornerGrad)" />
              <path d="M103 60L95 52L99 48L107 56L103 60Z" fill="url(#techCornerGrad)" opacity="0.8" />
              <path d="M116 60L111 55L114 52L119 57L116 60Z" fill="url(#techCornerGrad)" opacity="0.6" />
            </svg>

            {/* Close Icon */}
            <button
              onClick={resetModal}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-800 transition-colors p-1 z-25"
              aria-label="Close"
            >
              <FiX size={22} />
            </button>

            {/* STEP 1: Details Entry */}
            {step === 'details' && (
              <form onSubmit={handleDetailsSubmit} className="space-y-6 relative z-10">
                <div>
                  <h2 className="text-[28px] font-extrabold tracking-tight font-display mb-1 text-zinc-950 leading-tight">
                    Talk to us, directly.
                  </h2>
                  <p className="text-purple-650 text-sm font-semibold">
                    Drop your details & we'll reach out to you.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Name*"
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-purple-500/50 focus:bg-white rounded-2xl px-5 py-4 text-sm text-zinc-800 focus:outline-none transition-all placeholder:text-zinc-400"
                  />

                  <div className="flex bg-zinc-50 border border-zinc-200 focus-within:border-purple-500/50 focus-within:bg-white rounded-2xl overflow-hidden transition-all">
                    <div className="flex items-center justify-center px-5 border-r border-zinc-200 text-sm font-medium text-zinc-500 bg-zinc-50 select-none">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="Phone number*"
                      className="w-full bg-transparent px-5 py-4 text-sm text-zinc-800 focus:outline-none placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="relative flex items-center bg-zinc-50 border border-zinc-200 focus-within:border-purple-500/50 focus-within:bg-white rounded-2xl overflow-hidden transition-all">
                    <input
                      type="text"
                      required
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      placeholder="Enter Pin Code or Area*"
                      className="w-full bg-transparent px-5 py-4 text-sm text-zinc-800 focus:outline-none placeholder:text-zinc-400"
                    />
                    <div className="absolute right-5 text-zinc-400">
                      <FiTarget size={18} className="cursor-pointer hover:text-purple-605 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm font-semibold">
                  <span className="text-zinc-600">Pick your model*</span>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-3 mt-1">
                    {['X1', 'X1Plus', 'X2', 'X2Plus', 'X3', 'X4Plus', 'S Pro', 'OX Plus', 'H pro', 'I pro', 'X4', 'X3 plus'].map((model) => (
                      <label key={model} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="model"
                          value={model}
                          checked={formData.model === model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-4 h-4 text-purple-650 focus:ring-0 focus:ring-offset-0 border-zinc-300 bg-white"
                        />
                        <span className="font-medium text-zinc-800 text-xs">{model}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!(formData.name && formData.phone.length === 10 && formData.pinCode && formData.model)}
                  className={`w-full py-4 rounded-full text-sm font-bold transition-all duration-300 ${
                    formData.name && formData.phone.length === 10 && formData.pinCode && formData.model
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-zinc-150 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  Submit
                </button>

                <p className="text-[10px] text-zinc-450 leading-relaxed">
                  By clicking on 'Submit' you are agreeing to our <span className="font-semibold underline cursor-pointer text-zinc-700">Privacy Policy</span> and are allowing us (Haion) and our service partners to get in touch with you.
                </p>
              </form>
            )}

            {/* STEP 2: OTP Entry */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight font-display mb-1 text-zinc-950">
                    Verify your number
                  </h2>
                  <p className="text-zinc-500 text-sm">
                    Enter the 4-digit OTP sent to <span className="font-semibold text-zinc-850">+91 {formData.phone}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      maxLength="1"
                      required
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-14 h-14 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-xl font-bold focus:bg-white focus:border-purple-500 focus:outline-none text-zinc-800 transition-all"
                    />
                  ))}
                </div>

                <div className="space-y-3 text-center">
                  <button
                    type="submit"
                    disabled={otp.join('').length < 4}
                    className={`w-full py-4 rounded-full text-sm font-bold transition-all duration-300 ${
                      otp.join('').length === 4
                        ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-150 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    Verify & Continue
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtp(['', '', '', ''])}
                    className="text-xs font-semibold text-purple-650 hover:text-purple-800 transition-colors mt-2 block mx-auto cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Intent Survey */}
            {step === 'survey' && (
              <div className="space-y-6 relative z-10">
                {/* Section 1 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-zinc-900 font-display">
                    How soon are you planning to buy?
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Immediately', 'Within 30 days', 'Just exploring'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTimeline(item)}
                        className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          timeline === item
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'bg-zinc-50 border-zinc-150 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-zinc-900 font-display">
                    What can we help you with?
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {['Pricing information', 'Latest offers', 'Detailed specifications'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setHelpTopic(item)}
                        className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          helpTopic === item
                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                            : 'bg-zinc-50 border-zinc-150 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue button */}
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  disabled={!timeline || !helpTopic}
                  className={`w-full py-4 rounded-full text-sm font-bold transition-all duration-300 ${
                    timeline && helpTopic
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                      : 'bg-zinc-150 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 4: Schedule a Visit */}
            {step === 'schedule' && (
              <div className="space-y-6 relative z-10">
                {/* Success Alert Banner */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100/50 p-3.5 rounded-2xl text-left">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800 leading-snug">
                    A Haion representative will contact you soon.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-zinc-900 font-display">
                    Continue to schedule a visit
                  </h3>

                  {/* Dates Selection Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {datesList.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDateIdx(idx)}
                        className={`relative p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-center min-h-[90px] ${
                          selectedDateIdx === idx
                            ? 'bg-white border-purple-500 ring-1 ring-purple-500/20 shadow-md text-zinc-900'
                            : 'bg-zinc-50 border-zinc-100 hover:bg-zinc-100/50 text-zinc-550'
                        }`}
                      >
                        {item.isPopular && (
                          <span className="absolute top-1.5 right-1.5 text-emerald-500">
                            <FiStar size={11} className="fill-emerald-500" />
                          </span>
                        )}
                        <span className="text-sm font-extrabold leading-tight">
                          {item.dayNum} {item.month}
                        </span>
                        <span className="text-[10px] text-zinc-450 font-medium mt-1 uppercase tracking-wide">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Popular Pick Legend */}
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">
                    <span>Popular Pick</span>
                    <span className="text-emerald-500">
                      <FiStar size={11} className="fill-emerald-500" />
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('confirmation')}
                  className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white py-4 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  Schedule a visit
                </button>
              </div>
            )}

            {/* STEP 5: Booking Confirmation */}
            {step === 'confirmation' && (
              <div className="space-y-8 py-4 text-center relative z-10">
                {/* Large Green Check Circle */}
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2 text-center max-w-xs mx-auto">
                  <h2 className="text-2xl font-extrabold tracking-tight font-display text-zinc-950">
                    Your appointment is booked!
                  </h2>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    We'll see you soon! Don't forget to carry your valid driving license.
                  </p>
                </div>

                {/* Details Table */}
                <div className="space-y-4 border-t border-b border-zinc-100 py-6 text-sm max-w-sm mx-auto">
                  <div className="flex justify-between items-baseline">
                    <span className="text-zinc-500 font-medium">Date</span>
                    <span className="font-extrabold text-zinc-900">
                      {datesList[selectedDateIdx]?.formatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-zinc-500 font-medium">Time</span>
                    <span className="font-extrabold text-zinc-900">9:30 AM - 8:30 PM</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-zinc-500 font-medium">Test ride at</span>
                    <span className="font-extrabold text-purple-650 underline decoration-zinc-300 hover:text-purple-800 cursor-pointer">
                      Haion Experience Center
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetModal}
                  className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white py-4 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                >
                  Okay
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
