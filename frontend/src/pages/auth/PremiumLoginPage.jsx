import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { ROLE_HOME_ROUTE } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { env } from '@/config/env';
import {
  ShieldCheck, Lock, Mail, Eye, EyeOff, Gauge, BatteryCharging,
  Compass, KeyRound, Wrench, Store, Layers, ArrowRight,
  Building2, UserCheck, X, CheckCircle2, Zap, FileText, Sparkles
} from 'lucide-react';
import '../../styles/haion-premium-login.css';

/* ====================================================
   HAION PREMIUM SVG LOGO — Aesthetic Geometric Mark
   ==================================================== */
function HaionSVGLogo({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer partial arc ring — 270° sweep, gap at bottom-right */}
      <circle
        cx="20" cy="20" r="17"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="88 20"
        strokeDashoffset="0"
      />

      {/* Inner accent ring */}
      <circle
        cx="20" cy="20" r="13"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray="55 28"
        strokeDashoffset="15"
      />

      {/* Bold H — left vertical bar */}
      <rect x="10.5" y="11" width="3.8" height="18" rx="1.2" fill="white" />

      {/* Bold H — right vertical bar */}
      <rect x="25.7" y="11" width="3.8" height="18" rx="1.2" fill="white" />

      {/* H crossbar — left half */}
      <rect x="10.5" y="18.2" width="6.8" height="3.6" rx="1" fill="white" />

      {/* H crossbar — right half */}
      <rect x="22.7" y="18.2" width="6.8" height="3.6" rx="1" fill="white" />

      {/* Lightning slash across crossbar gap */}
      <path
        d="M18.5 15.5 L21.5 19.2 L19.8 19.2 L22.2 24.5"
        stroke="rgba(255,200,120,0.95)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small accent dot — top right */}
      <circle cx="32" cy="10" r="1.5" fill="rgba(255,200,120,0.7)" />
      {/* Small accent dot — bottom left */}
      <circle cx="8" cy="31" r="1" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

/* ====================================================
   SCOOTER MODEL DATA
   ==================================================== */
const SCOOTER_MODELS = [
  { id: 'x3', name: 'HAION X3', series: 'PEAK PERFORMANCE', battery: '72V 52Ah LFP', range: '130 KM', topSpeed: '75 KM/H', warranty: '5 YEARS', price: '₹1,24,999', image: '/haion/models/x3_clean.png', tagline: 'Hyper-tuned acceleration & adaptive suspension', features: ['Dual Disk ABS Braking', '7-Inch HD Touch Telemetry', 'HyperCharge 0-80% in 45 Mins', 'OTA Cloud Diagnostics'] },
  { id: 'x1', name: 'HAION X1', series: 'URBAN PRECISION', battery: '60V 32Ah LFP', range: '70 KM', topSpeed: '55 KM/H', warranty: '3 YEARS', price: '₹89,999', image: '/haion/models/x1_clean.png', tagline: 'Precision engineered urban daily commuter', features: ['Regenerative Braking v2', 'Smart App Keyless Entry', 'LED Matrix Headlight', 'Under-Seat 28L Storage'] },
  { id: 'x2', name: 'HAION X2', series: 'EXECUTIVE RIDE', battery: '72V 40Ah LFP', range: '95 KM', topSpeed: '65 KM/H', warranty: '3 YEARS', price: '₹1,04,999', image: '/haion/models/x2_clean.png', tagline: 'Balanced power with dual disk braking', features: ['Dual Disk Hydraulic Brakes', 'Anti-Theft GPS Tracking', 'Comfort Ergonomic Seat', 'Dual Riding Modes'] },
  { id: 'x1-plus', name: 'HAION X1 PLUS', series: 'URBAN REFINED', battery: '60V 36Ah LFP', range: '80 KM', topSpeed: '60 KM/H', warranty: '3 YEARS', price: '₹96,999', image: '/haion/models/x1_plus_clean.png', tagline: 'Enhanced battery density & sleek chrome accents', features: ['High Density Cell Technology', 'Fast Charger Included', 'Digital Speedo Display', 'Alloy Wheels'] },
  { id: 'x4-plus', name: 'HAION X4 PLUS', series: 'LONG RANGE', battery: '72V 48Ah LFP', range: '120 KM', topSpeed: '70 KM/H', warranty: '4 YEARS', price: '₹1,14,999', image: '/haion/models/x4_plus_clean.png', tagline: 'Extended range efficiency for heavy commuters', features: ['Ultra Range Battery Pack', 'Reverse Assistance Mode', 'Telescopic Suspension', 'IP67 Water Resistance'] },
  { id: 's-pro', name: 'HAION S-PRO', series: 'SUPREME FLAGSHIP', battery: '84V 64Ah LFP', range: '180 KM', topSpeed: '88 KM/H', warranty: '5 YEARS', price: '₹1,49,999', image: '/haion/models/s_pro_clean.png', tagline: 'Flagship titanium chassis with 4K digital dash', features: ['Titanium Monocoque Frame', '4K Digital Cockpit Display', 'Dual Hub Motor Power', 'Cruise Control & Hill Hold'] }
];

/**
 * Seeded QA logins. These are real, working credentials — they are only ever
 * rendered on a development build (see `showDemoAccounts` below) and must never
 * reach a deployed site.
 */
/**
 * Seeded QA logins. Guarded on `import.meta.env.DEV` directly rather than a
 * runtime flag so Vite folds this to an empty array at build time — the
 * credentials are real, and must not survive into a deployed bundle even as
 * unreachable strings.
 */
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      { label: 'Admin', email: 'admin@haion.com', pass: 'password', icon: Building2, portal: 'staff' },
      { label: 'Dealer', email: 'dealer@haion.com', pass: 'password', icon: Store, portal: 'staff' },
      { label: 'Employee', email: 'employee@haion.com', pass: 'password', icon: UserCheck, portal: 'staff' },
      { label: 'Service', email: 'service@haion.com', pass: 'password', icon: Wrench, portal: 'staff' },
      { label: 'Customer', email: 'customer@haion.com', pass: 'password', icon: Layers, portal: 'customer' }
    ]
  : [];

/* ====================================================
   ANIMATION VARIANTS
   ==================================================== */
const cardVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
  })
};

const brandVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

/* ====================================================
   MAIN COMPONENT
   ==================================================== */
/**
 * @param initialPortal  Which side of the login opens first: 'staff' | 'customer'
 * @param lockPortal     Hide the portal switcher entirely. The customer route
 *                       uses this so buyers never see the staff ERP login —
 *                       they get a customer-only screen.
 */
export default function PremiumLoginPage({ initialPortal = 'staff', lockPortal = false }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activePortal, setActivePortal] = useState(initialPortal);
  // Never pre-fill credentials on a deployed build.
  const [email, setEmail] = useState(env.isDev ? 'admin@haion.com' : '');
  const [password, setPassword] = useState(env.isDev ? 'password' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isModelsOpen, setIsModelsOpen] = useState(false);
  const [modelIndex, setModelIndex] = useState(0);

  const selectedModel = SCOOTER_MODELS[modelIndex];

  // Empty on a production build; on the customer screen only the customer
  // account is ever relevant.
  const visibleDemoAccounts = DEMO_ACCOUNTS.filter(
    (acc) => !lockPortal || acc.portal === activePortal
  );

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const user = await login({ email, password });
      setShowTransition(true);
      const targetRoute = user?.role === 'CUSTOMER'
        ? '/customer/dashboard'
        : (ROLE_HOME_ROUTE[user?.role] || ROUTES.ADMIN_DASHBOARD);
      setTimeout(() => {
        toast.success(`Welcome back, ${user?.name || user?.email || 'User'}!`);
        navigate(targetRoute, { replace: true });
      }, 1600);
    } catch (error) {
      toast.error(error.message || 'Authentication failed.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    // A locked screen stays on its own portal — filling a demo account must not
    // slide the customer login over to the staff one.
    if (!lockPortal) setActivePortal(acc.portal);
    setErrors({});
  };

  return (
    <div className="haion-root">

      {/* ====== BACKGROUND LAYER: VIDEO FOR STAFF, AMBIENT GLOW FOR CUSTOMER ====== */}
      {!lockPortal && activePortal === 'staff' ? (
        <div className="haion-video-bg">
          <video src="/Create_a_premium_cinematic_bac.mp4"
            autoPlay loop muted playsInline
            className="haion-video-el"
          />
          <div className="haion-vignette" />
        </div>
      ) : (
        <div className="customer-ambient-bg">
          <div className="customer-glow-orb-1" />
          <div className="customer-glow-orb-2" />
        </div>
      )}

      {/* ====== TOP HEADER ====== */}
      <motion.div
        className="haion-header"
        variants={brandVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ====== ENHANCED BRAND BLOCK ====== */}
        <div className="brand-block">
          {/* Logo with animated spinning ring */}
          <div className="brand-logo-wrap">
            <div className="brand-logo-ring" />
            <div className="brand-logo-inner">
              <HaionSVGLogo size={24} />
            </div>
          </div>

          {/* Brand text col */}
          <div className="brand-text-col">
            <span className="brand-main-name">HAION</span>
            <div className="brand-ev-tag">
              <div className="brand-ev-dot" />
              <span className="brand-ev-text">India's Best EV Scooter</span>
            </div>
          </div>
        </div>

        {/* Explore button */}
        <motion.button
          type="button"
          className="btn-explore"
          onClick={() => setIsModelsOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Explore Scooter Models</span>
        </motion.button>
      </motion.div>

      {/* ====== MAIN ====== */}
      <div className="haion-main">

        {/* ====== GLASS FORM CARD ====== */}
        <motion.div
          className="haion-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >

          {/* Portal switcher — hidden on the customer route, where the staff
              ERP login is not something a buyer should ever be offered. */}
          {!lockPortal && (
            <motion.div
              className="portal-tabs"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {[
                { key: 'staff', label: 'Enterprise Portal', icon: Building2 },
                { key: 'customer', label: 'Customer Hub', icon: Layers }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  className={`portal-tab ${activePortal === tab.key ? 'active' : ''}`}
                  onClick={() => setActivePortal(tab.key)}
                  whileTap={{ scale: 0.97 }}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Card heading */}
          <motion.div
            className="card-head"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            {activePortal === 'customer' && (
              <div className="customer-hero-badge">
                <Zap className="w-3.5 h-3.5 fill-amber-500/20 text-amber-500" />
                <span>HAION Smart Mobility Hub</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.h1
                key={activePortal}
                className="card-title"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {activePortal === 'staff' ? 'Sign in to HAION' : 'Customer Access Hub'}
              </motion.h1>
            </AnimatePresence>
            <p className="card-sub">
              {activePortal === 'staff'
                ? 'Enter your credentials to access inventory & ERP'
                : 'Access your scooter telemetry, bills & rewards'}
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="form-stack">

            {/* Email Field */}
            <motion.div
              className="field-wrap"
              custom={0}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="field-label-row">
                <label className="field-label">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </label>
              </div>
              <div className="input-wrap">
                <div className="input-glow-border" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: null }); }}
                  placeholder="name@company.com"
                  className="haion-input"
                />
                <Mail className="input-icon w-4 h-4" />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{ fontSize: '11px', fontWeight: 500, color: '#f87171', marginTop: '2px' }}
                  >
                    {errors.email}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password Field */}
            <motion.div
              className="field-wrap"
              custom={1}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="field-label-row">
                <label className="field-label">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Security Password</span>
                </label>
                <Link to={ROUTES.AUTH_FORGOT_PASSWORD} className="forgot-link">Forgot?</Link>
              </div>
              <div className="input-wrap">
                <div className="input-glow-border" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: null }); }}
                  placeholder="••••••••"
                  className="haion-input password-field"
                />
                <KeyRound className="input-icon w-4 h-4" />

                {/* 3D Eye Toggle */}
                <motion.button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  whileTap={{ scale: 0.88, rotateX: 14 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={showPassword ? 'hide' : 'show'}
                      initial={{ opacity: 0, rotate: -25, scale: 0.7 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 25, scale: 0.7 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex' }}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{ fontSize: '11px', fontWeight: 500, color: '#f87171', marginTop: '2px' }}
                  >
                    {errors.password}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick Demo Box — development builds only. These are real
                credentials, so they must never render on a deployed site. */}
            {visibleDemoAccounts.length > 0 && (
              <motion.div
                className="demo-box"
                custom={2}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
              >
                <span className="demo-box-label">Quick Demo Login:</span>
                <div className="demo-pills">
                  {visibleDemoAccounts.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <motion.button
                        key={acc.label}
                        type="button"
                        className="demo-pill"
                        onClick={() => handleQuickFill(acc)}
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.94 }}
                      >
                        <Icon className="w-3 h-3" style={{ color: '#c97b4b' }} />
                        <span>{acc.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Submit button */}
            <motion.div
              custom={3}
              variants={fieldVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                type="submit"
                className="btn-login"
                disabled={isLoading}
                whileHover={!isLoading ? { y: -2 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Enter HAION Portal</span>
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </motion.span>
                  </>
                )}
              </motion.button>
            </motion.div>

          </form>

          {/* Minimal Customer Utility Links */}
          {activePortal === 'customer' && (
            <motion.div
              className="compact-customer-links"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Link to={ROUTES.CUSTOMER_ACCESS} className="compact-customer-link">
                <FileText className="w-3 h-3" />
                <span>ID / Bill Lookup</span>
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>•</span>
              <Link to={ROUTES.PUBLIC_WARRANTY_CHECK} className="compact-customer-link">
                <ShieldCheck className="w-3 h-3" />
                <span>Warranty</span>
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>•</span>
              <Link to={ROUTES.PUBLIC_COMPLAINT} className="compact-customer-link">
                <Wrench className="w-3 h-3" />
                <span>Support</span>
              </Link>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            className="card-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="security-badge">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit Encrypted Session</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, monospace', fontSize: '10px', color: '#94a3b8' }}>HAION OS v4.2</span>
          </motion.div>

        </motion.div>
      </div>

      {/* ====== CINEMATIC LOGIN TRANSITION PORTAL ====== */}
      {showTransition && createPortal(
        <motion.div
          key="haion-transition"
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        >
          {/* Layer 1: Copper sweep from bottom */}
          <motion.div
            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e89572 0%, #c87550 50%, #9a5230 100%)', transformOrigin: 'bottom' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          />
          {/* Layer 2: Dark sweep covers copper */}
          <motion.div
            style={{ position: 'absolute', inset: 0, background: '#060a12', transformOrigin: 'bottom' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1], delay: 0.4 }}
          />
          {/* Center reveal */}
          <motion.div
            style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            initial={{ opacity: 0, scale: 0.6, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.56 }}
          >
            {/* Glow ring */}
            <motion.div
              style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: 'rgba(200,117,80,0.25)', filter: 'blur(22px)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0.3, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #e89572, #c87550, #9a5230)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(200,117,80,0.8)', position: 'relative' }}>
              <HaionSVGLogo size={36} />
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 34, fontWeight: 900, letterSpacing: -1, color: '#fff', textShadow: '0 0 30px rgba(200,117,80,0.7)' }}>HAION</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(232,149,114,0.8)' }}>SIGNING YOU IN...</span>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* ====== SCOOTER MODELS MODAL ====== */}
      <AnimatePresence>
        {isModelsOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsModelsOpen(false)}
          >
            <motion.div
              className="modal-sheet"
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="modal-close" onClick={() => setIsModelsOpen(false)}>
                <X className="w-4 h-4" />
              </button>
              <div className="modal-head">
                <h2 className="modal-title">HAION Electric Fleet Telemetry</h2>
                <p className="modal-sub">Explore models, battery specifications & performance</p>
              </div>
              <div className="modal-tabs">
                {SCOOTER_MODELS.map((m, idx) => (
                  <button key={m.id} className={`modal-tab ${modelIndex === idx ? 'active' : ''}`} onClick={() => setModelIndex(idx)}>
                    {m.name}
                  </button>
                ))}
              </div>
              <div className="modal-grid">
                <div className="modal-stage">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedModel.id}
                      src={selectedModel.image}
                      alt={selectedModel.name}
                      className="modal-scooter-img"
                      initial={{ opacity: 0, scale: 0.9, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 20 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedModel.id}
                    className="modal-details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="model-header">
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#c97b4b', letterSpacing: '1px', textTransform: 'uppercase' }}>{selectedModel.series}</span>
                        <h3 className="model-title">{selectedModel.name}</h3>
                        <p className="model-tagline">{selectedModel.tagline}</p>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', background: 'rgba(201,123,75,0.2)', border: '1px solid rgba(201,123,75,0.4)', padding: '5px 12px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                        {selectedModel.price}
                      </span>
                    </div>
                    <div className="specs-grid">
                      {[
                        { icon: Compass, label: 'RANGE', val: selectedModel.range },
                        { icon: BatteryCharging, label: 'BATTERY', val: selectedModel.battery },
                        { icon: Gauge, label: 'TOP SPEED', val: selectedModel.topSpeed },
                        { icon: ShieldCheck, label: 'WARRANTY', val: selectedModel.warranty },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="spec-card">
                          <div className="spec-label"><Icon className="w-3 h-3" /><span>{label}</span></div>
                          <div className="spec-val">{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="feat-list">
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Features:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {selectedModel.features.map((feat, i) => (
                          <div key={i} className="feat-item">
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#34d399', flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spinner keyframes (inline) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>
  );
}