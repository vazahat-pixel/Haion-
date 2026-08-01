import { useState, useRef } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift, Copy, CheckCheck, Users, Wallet, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, RotateCw,
  IndianRupee, Calendar, Star, Share2, ArrowDownToLine, BanknoteIcon, ShieldCheck,
  Zap, Target, Trophy,
} from 'lucide-react';
import { referralService } from '@/services/referral.service';
import { toast } from '@/utils/toast';
import { customerStagger, customerSpring } from '@/animations/customer.motion';
import { MotionPage } from '@/components/motion/MotionPage';
import { CustomerHomeBackground } from '@/components/customer/CustomerHomeBackground';
import { CustomerFloatingNav } from '@/components/customer/CustomerFloatingNav';
import { SkeletonCard } from '@/components/ui/skeleton';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
  APPROVED: { label: 'Approved', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: CheckCircle2 },
  PAID: { label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Star },
  COMPLETED: { label: 'Completed', color: 'text-violet-400', bg: 'bg-violet-400/10', icon: CheckCircle2 },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-zinc-400', bg: 'bg-zinc-400/10', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── 3D Holographic Privilege Card ─────────────────────────────────────────────
function HolographicPrivilegeCard({ referralCode, bonus }) {
  const [copied, setCopied] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);

  // Mouse tilt animation springs
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
  const spotlightX = useSpring(50, { stiffness: 300, damping: 30 });
  const spotlightY = useSpring(50, { stiffness: 300, damping: 30 });

  function handleMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 12;

    rotateX.set(rotX);
    rotateY.set(rotY);
    spotlightX.set((x / rect.width) * 100);
    spotlightY.set((y / rect.height) * 100);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    spotlightX.set(50);
    spotlightY.set(50);
  }

  function handleCopy(e) {
    e.stopPropagation();
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare(e) {
    e.stopPropagation();
    if (!referralCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Haion Referral Privilege Code',
        text: `Use my referral code ${referralCode} when buying your vehicle at Haion dealer to get exclusive benefits! 🚗`,
      });
    } else {
      handleCopy(e);
    }
  }

  const spotlightBg = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.22) 0%, transparent 65%)`
  );

  return (
    <div style={{ perspective: 1200 }} className="w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative min-h-[260px] w-full rounded-3xl cursor-pointer select-none overflow-hidden shadow-2xl transition-shadow duration-300 hover:shadow-indigo-500/25"
      >
        {/* Dynamic Spotlight Layer */}
        <motion.div
          style={{ background: spotlightBg }}
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        />

        {/* ── CARD FRONT ────────────────────────────────────────────────────── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
          }}
          className="absolute inset-0 z-10 flex flex-col justify-between p-7 border border-indigo-500/30 rounded-3xl"
        >
          {/* Top Row: Brand + Status */}
          <div className="flex items-start justify-between mb-3">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={customerSpring.snappy}
            >
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white font-extrabold shadow-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                H
              </motion.div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-100">HAION PRIVILEGE</p>
                <p className="text-[9px] font-medium text-indigo-300/80">Referral Rewards Pass</p>
              </div>
            </motion.div>
            <motion.button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
              title="View card details"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCw className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Middle: Code Display */}
          <motion.div
            className="my-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-[9px] uppercase tracking-widest text-indigo-300/70 font-bold mb-2">
              Your Unique Code
            </p>
            {referralCode ? (
              <motion.div
                className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-indigo-400/30 backdrop-blur-sm"
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                transition={customerSpring.smooth}
              >
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white drop-shadow-lg">
                  {referralCode}
                </span>
                <div className="flex flex-col gap-2 ml-auto">
                  <motion.button
                    onClick={handleCopy}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 border border-white/20 transition"
                    title="Copy code"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCheck className="h-5 w-5 text-emerald-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/30 text-purple-200 hover:bg-purple-500/40 border border-purple-400/30 transition"
                    title="Share code"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <p className="text-xs text-indigo-200/80 italic">Auto-generated after first purchase</p>
            )}
          </motion.div>

          {/* Bottom Row: Bonus Info + Status */}
          <motion.div
            className="flex items-center justify-between border-t border-indigo-400/20 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div>
              <p className="text-[9px] text-indigo-300/70 uppercase tracking-wider font-bold mb-0.5">Total Reward</p>
              <p className="text-xl font-black text-emerald-400 tracking-tight">₹40,000</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={bonus?.status || 'PENDING'} />
              <p className="text-[9px] text-indigo-300/60">16 monthly payouts</p>
            </div>
          </motion.div>
        </div>

        {/* ── CARD BACK (Flipped View) ───────────────────────────────────────── */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          }}
          className="absolute inset-0 z-10 flex flex-col justify-between p-7 border border-purple-500/30 rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Payout Details</p>
            <motion.button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
              title="View referral code"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCw className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Magnetic Stripe Effect */}
          <div className="-mx-7 my-2 h-10 bg-black/60 border-y border-white/10 flex items-center justify-center">
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-full w-0.5 bg-white/40"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>

          {/* Payout Info Grid */}
          <div className="space-y-3 text-xs text-slate-300">
            <motion.div
              className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              style={{ willChange: 'background-color' }}
            >
              <span className="text-slate-400 pointer-events-none">Monthly Payout</span>
              <span className="font-bold text-emerald-400 pointer-events-none">₹2,500</span>
            </motion.div>
            <motion.div
              className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              style={{ willChange: 'background-color' }}
            >
              <span className="text-slate-400 pointer-events-none">Transfer Method</span>
              <span className="font-medium text-slate-200 pointer-events-none">Bank Transfer</span>
            </motion.div>
            <motion.div
              className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              style={{ willChange: 'background-color' }}
            >
              <span className="text-slate-400 pointer-events-none">Payout Cycle</span>
              <span className="font-medium text-slate-200 pointer-events-none">1st of Month</span>
            </motion.div>
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[9px] text-slate-400">
            <span className="font-bold">HAION REF SYSTEM 2026</span>
            <span className="font-mono text-slate-300">{referralCode || 'EV20-PASS'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Interactive Referral Tree Visualizer ──────────────────────────────────────
function ReferralTreeVisualizer({ bonus }) {
  const count = bonus?.referredCount ?? 0;
  const referredCustomers = bonus?.referredCustomers || [];
  const isActive = bonus?.status === 'ACTIVE' || bonus?.status === 'COMPLETED';

  return (
    <motion.div
      style={{
        background: 'var(--customer-glass)',
        border: '1px solid var(--customer-glass-border)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
      }}
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={customerSpring.smooth}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/40 to-purple-500/40 text-indigo-400 border border-indigo-400/30"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={customerSpring.snappy}
          >
            <Users className="h-5 w-5" />
          </motion.div>
          <div>
            <p style={{ color: 'var(--customer-text)' }} className="text-sm font-bold">
              Referral Network
            </p>
            <p style={{ color: 'var(--customer-text-secondary)' }} className="text-xs">
              Refer 2 friends to unlock ₹40,000 bonus
            </p>
          </div>
        </div>
        <motion.span
          className="rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 px-3 py-1.5 text-xs font-bold text-indigo-300"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {count}/2 Activated
        </motion.span>
      </div>

      {/* SVG Node Graph */}
      <div className="relative py-6 flex flex-col items-center">
        {/* Parent Node (Me) */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-2"
          whileHover={{ scale: 1.08 }}
          transition={customerSpring.snappy}
        >
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold shadow-xl ring-4 ring-indigo-500/40 text-sm"
            animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 30px rgba(99,102,241,0.6)', '0 0 20px rgba(99,102,241,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            YOU
          </motion.div>
          <span className="text-[12px] font-bold text-indigo-300">Main Account</span>
        </motion.div>

        {/* Connecting Lines with Animation */}
        <div className="relative h-12 w-full max-w-[240px] mb-2">
          <svg className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: count >= 1 ? '#34d399' : 'rgba(255,255,255,0.2)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: count >= 1 ? '#10b981' : 'rgba(255,255,255,0.05)', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: count >= 2 ? '#34d399' : 'rgba(255,255,255,0.2)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: count >= 2 ? '#10b981' : 'rgba(255,255,255,0.05)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <line x1="50%" y1="0" x2="20%" y2="100%" stroke={count >= 1 ? '#34d399' : 'rgba(255,255,255,0.2)'} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="50%" y1="0" x2="80%" y2="100%" stroke={count >= 2 ? '#34d399' : 'rgba(255,255,255,0.2)'} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Child Nodes */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          {[0, 1].map((i) => {
            const customer = referredCustomers[i];
            const filled = !!customer;
            return (
              <motion.div
                key={i}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition ${
                  filled
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-slate-500/20 bg-white/5 hover:bg-white/8'
                }`}
                whileHover={{ scale: 1.05, translateY: -4 }}
                transition={customerSpring.smooth}
              >
                <motion.div
                  className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm shadow-md ${
                    filled
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white ring-2 ring-emerald-400/50'
                      : 'bg-white/10 text-slate-400 ring-2 ring-slate-400/20'
                  }`}
                  animate={filled ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {filled ? <CheckCircle2 className="h-5 w-5" /> : `${i + 1}`}
                </motion.div>
                <div className="text-center w-full">
                  <p className={`text-xs font-bold truncate ${filled ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {filled ? customer.name : `Friend ${i + 1}`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {filled ? formatDate(customer.activatedAt) : 'Not linked yet'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Activated Banner */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={customerSpring.smooth}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 p-4 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Trophy className="h-4 w-4 text-emerald-400" />
          </motion.div>
          🎉 Bonus Unlocked! ₹40,000 in 16 monthly installments
        </motion.div>
      )}
    </motion.div>
  );
}

// ── 16-Month Payout Roadmap Timeline Track ────────────────────────────────────
function PayoutRoadmapTimeline({ bonus }) {
  if (!bonus || bonus.status === 'PENDING') return null;

  const currentMonth = bonus.currentMonth ?? 0;
  const totalMonths = bonus.totalMonths ?? 16;
  const withdrawals = bonus.withdrawals || [];

  return (
    <motion.div
      style={{
        background: 'var(--customer-glass)',
        border: '1px solid var(--customer-glass-border)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
      }}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={customerSpring.smooth}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/40 to-amber-500/40 text-orange-400 border border-orange-400/30"
            whileHover={{ scale: 1.1, rotate: -10 }}
            transition={customerSpring.snappy}
          >
            <Calendar className="h-5 w-5" />
          </motion.div>
          <div>
            <p style={{ color: 'var(--customer-text)' }} className="text-sm font-bold">
              16-Month Payout Schedule
            </p>
            <p style={{ color: 'var(--customer-text-secondary)' }} className="text-xs">
              ₹2,500 released on 1st of every month
            </p>
          </div>
        </div>
      </div>

      {/* 16-Step Grid Track */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 py-2">
        {Array.from({ length: totalMonths }).map((_, idx) => {
          const mNum = idx + 1;
          const record = withdrawals.find((w) => w.month === mNum);
          const isPaid = record?.status === 'PAID';
          const isPending = record?.status === 'PENDING' || record?.status === 'APPROVED';
          const isCurrent = mNum === currentMonth;

          return (
            <motion.div
              key={mNum}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                isPaid
                  ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                  : isPending
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                  : isCurrent
                  ? 'border-indigo-500/60 bg-indigo-500/30 text-indigo-300'
                  : 'border-slate-500/20 bg-white/5 text-slate-500'
              }`}
              whileHover={{ scale: 1.08, translateY: -2 }}
              transition={isPending ? { duration: 2, repeat: Infinity } : customerSpring.snappy}
              animate={isPending ? { opacity: [0.8, 1, 0.8] } : {}}
            >
              <span className="text-[10px] font-bold">M{mNum}</span>
              <span className="text-[8px] font-bold mt-0.5">
                {isPaid ? '✓ PAID' : isPending ? '→ READY' : '₹2.5K'}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Timeline Info */}
      <motion.div
        className="flex justify-between items-center text-[11px] text-slate-400 bg-white/5 rounded-xl p-3 border border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span>Total Duration: 16 months</span>
        <span>Total Bonus: ₹40,000</span>
        <span>Per Month: ₹2,500</span>
      </motion.div>
    </motion.div>
  );
}

// ── Wallet Balance Card ───────────────────────────────────────────────────────
function WalletBalanceCard({ bonus, onRequestWithdrawal, isRequesting }) {
  if (!bonus || bonus.status === 'PENDING') return null;

  const totalWithdrawn = bonus.totalWithdrawn ?? 0;
  const bonusAmount = bonus.bonusAmount ?? 40000;
  const remainingBalance = bonusAmount - totalWithdrawn;
  const totalMonths = bonus.totalMonths ?? 16;
  const paidMonths = bonus.stats?.paidMonths ?? 0;
  const progressPct = Math.round((paidMonths / totalMonths) * 100);

  const pendingWithdrawal = bonus.withdrawals?.find((w) => w.status === 'PENDING');
  const approvedWithdrawal = bonus.withdrawals?.find((w) => w.status === 'APPROVED');

  return (
    <motion.div
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%)',
        border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={customerSpring.smooth}
    >
      <div className="mb-4 flex items-start gap-3">
        <motion.div
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/80 text-white shadow-lg border border-emerald-400/30"
          whileHover={{ scale: 1.1, rotate: 10 }}
          transition={customerSpring.snappy}
        >
          <Wallet className="h-5 w-5" />
        </motion.div>
        <div className="flex-1">
          <p style={{ color: 'var(--customer-text)' }} className="text-sm font-bold">
            Your Referral Wallet
          </p>
          <p style={{ color: 'var(--customer-text-secondary)' }} className="text-xs mt-0.5">
            Monthly payouts directly to your bank account
          </p>
        </div>
        <StatusBadge status={bonus.status} />
      </div>

      {/* Stats Grid - Improved Layout */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: 'Total Bonus', value: formatINR(bonusAmount), color: '#a5b4fc', icon: Target },
          { label: 'Paid So Far', value: formatINR(totalWithdrawn), color: '#34d399', icon: CheckCircle2 },
          { label: 'Remaining', value: formatINR(Math.max(0, remainingBalance)), color: '#f59e0b', icon: Zap },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div
            key={label}
            className="bg-gradient-to-br from-white/5 to-white/2 rounded-2xl p-3 text-center border border-white/10 hover:border-white/20 transition"
            whileHover={{ translateY: -4, backgroundColor: 'rgba(255,255,255,0.1)' }}
            transition={customerSpring.smooth}
            style={{ willChange: 'transform' }}
          >
            <div className="flex justify-center mb-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Icon className="h-3.5 w-3.5" style={{ color }} />
              </div>
            </div>
            <p style={{ color: 'var(--customer-text-secondary)' }} className="text-[10px] font-bold mb-1 pointer-events-none">
              {label}
            </p>
            <p style={{ color, opacity: 1 }} className="text-lg font-black pointer-events-none">
              {value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar with Animation */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: 'var(--customer-text-secondary)' }} className="text-xs font-semibold pointer-events-none">
            Progress: {paidMonths}/{totalMonths} months received
          </span>
          <span style={{ color: '#34d399', opacity: 1 }} className="text-xs font-bold pointer-events-none">
            {progressPct}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-white/5 to-white/2 overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-lg"
            style={{ willChange: 'width' }}
          />
        </div>
      </div>

      {/* Action Button / Status Messages */}
      <AnimatePresence mode="wait">
        {pendingWithdrawal && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-2xl p-4 mb-3 space-y-3"
          >
            <div className="flex items-start justify-between pointer-events-none">
              <div>
                <p style={{ color: 'var(--customer-text)', opacity: 1 }} className="text-sm font-bold">
                  Month {pendingWithdrawal.month} Withdrawal Ready
                </p>
                <p style={{ color: 'var(--customer-text-secondary)', opacity: 1 }} className="text-xs mt-1">
                  {formatINR(pendingWithdrawal.amount)} available for withdrawal
                </p>
              </div>
              <motion.span
                className="rounded-full bg-amber-500/30 px-2 py-1 text-[10px] font-bold text-amber-300 border border-amber-400/40"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✓ READY
              </motion.span>
            </div>
            <motion.button
              onClick={onRequestWithdrawal}
              disabled={isRequesting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-3 px-4 shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={isRequesting ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isRequesting ? Infinity : 0 }}
              >
                <ArrowDownToLine className="h-4 w-4" />
              </motion.div>
              {isRequesting ? 'Processing Request...' : `Withdraw ₹${pendingWithdrawal.amount.toLocaleString('en-IN')}`}
            </motion.button>
          </motion.div>
        )}

        {approvedWithdrawal && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-2xl bg-blue-500/15 border border-blue-500/40 p-4 pointer-events-none"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BanknoteIcon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-blue-300 opacity-100">Month {approvedWithdrawal.month} — Processing</p>
              <p className="text-xs text-blue-300/80 mt-1 opacity-100">
                ₹{approvedWithdrawal.amount.toLocaleString('en-IN')} is being transferred to your bank account
              </p>
            </div>
          </motion.div>
        )}

        {bonus.nextWithdrawalDue && bonus.status === 'ACTIVE' && !pendingWithdrawal && !approvedWithdrawal && (
          <motion.div
            key="next"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 rounded-xl p-3 border border-white/10 pointer-events-none"
          >
            <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
            <span style={{ opacity: 1 }}>Next payout on {formatDate(bonus.nextWithdrawalDue)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Withdrawal History ────────────────────────────────────────────────────────
function WithdrawalHistory({ withdrawals }) {
  if (!withdrawals?.length) return null;

  return (
    <motion.div
      style={{
        background: 'var(--customer-glass)',
        border: '1px solid var(--customer-glass-border)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
      }}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={customerSpring.smooth}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/40 to-pink-500/40 text-purple-400 border border-purple-400/30"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={customerSpring.snappy}
          >
            <TrendingUp className="h-5 w-5" />
          </motion.div>
          <div>
            <p style={{ color: 'var(--customer-text)' }} className="text-sm font-bold">
              Transaction History
            </p>
            <p style={{ color: 'var(--customer-text-secondary)' }} className="text-xs">
              All your withdrawal records
            </p>
          </div>
        </div>
        <motion.span
          className="rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 px-3 py-1.5 text-xs font-bold text-purple-300"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {withdrawals.length} Transactions
        </motion.span>
      </div>

      <div className="space-y-2">
        {withdrawals.map((w, idx) => (
          <motion.div
            key={w.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/2 border border-white/10 hover:border-white/20 transition group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, ...customerSpring.smooth }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 group-hover:scale-110 transition"
                whileHover={{ rotate: 10 }}
              >
                <IndianRupee className="h-4 w-4" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p style={{ color: 'var(--customer-text)' }} className="font-bold text-sm">
                  Month {w.month} Withdrawal
                </p>
                <p style={{ color: 'var(--customer-text-secondary)' }} className="text-[11px] mt-1">
                  {w.withdrawalRef} · {formatDate(w.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <motion.p
                className="text-sm font-black text-emerald-400"
                whileHover={{ scale: 1.1 }}
              >
                +{formatINR(w.amount)}
              </motion.p>
              <StatusBadge status={w.status} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function CustomerReferralPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['referral', 'my-bonus'],
    queryFn: () => referralService.getMyBonus(),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => referralService.requestWithdrawal(),
    onSuccess: (res) => {
      toast.success(res?.message || 'Withdrawal request sent! Admin will process it soon.');
      qc.invalidateQueries({ queryKey: ['referral', 'my-bonus'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not send withdrawal request.');
    },
  });

  const referralCode = data?.referralCode;
  const bonus = data?.bonus;
  const withdrawals = bonus?.withdrawals ?? [];

  return (
    <MotionPage className="relative min-h-screen">
      <CustomerHomeBackground />
      <CustomerFloatingNav />

      <div className="relative z-10 mx-auto w-full max-w-lg px-3 pt-[3.75rem] pb-8 sm:max-w-2xl lg:max-w-3xl lg:pt-20">
        <motion.div
          variants={customerStagger.container}
          initial="hidden"
          animate="show"
          className="space-y-5"
        >
          {/* Header with Premium Design */}
          <motion.div variants={customerStagger.item} className="pt-2">
            <motion.div
              className="flex items-center gap-3 mb-3"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg border border-indigo-400/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Gift className="h-6 w-6" />
              </motion.div>
              <div>
                <h1 style={{ color: 'var(--customer-text)' }} className="text-2xl sm:text-3xl font-black">
                  Referral Rewards
                </h1>
                <p style={{ color: 'var(--customer-text-secondary)' }} className="text-[11px] sm:text-xs mt-0.5 font-medium">
                  Earn up to ₹40,000 by referring friends
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl px-3 py-2 border border-indigo-400/20 w-fit"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <p style={{ color: 'var(--customer-text-secondary)' }} className="text-xs font-medium">
                Refer 2 friends → Get ₹2,500/month for 16 months
              </p>
            </motion.div>
          </motion.div>

          {/* Shimmer Skeleton Loading */}
          {isLoading && (
            <motion.div variants={customerStagger.item}>
              <SkeletonCard count={2} />
            </motion.div>
          )}

          {isError && (
            <motion.div variants={customerStagger.item}>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                Could not load referral data. Please refresh or try again.
              </div>
            </motion.div>
          )}

          {!isLoading && (
            <>
              {/* 3D Holographic Card */}
              <motion.div variants={customerStagger.item}>
                <HolographicPrivilegeCard referralCode={referralCode} bonus={bonus} />
              </motion.div>

              {/* Referral Tree Visualizer */}
              <motion.div variants={customerStagger.item}>
                <ReferralTreeVisualizer bonus={bonus} />
              </motion.div>

              {/* 16-Month Timeline Track */}
              {bonus?.status !== 'PENDING' && (
                <motion.div variants={customerStagger.item}>
                  <PayoutRoadmapTimeline bonus={bonus} />
                </motion.div>
              )}

              {/* Wallet Balance Card */}
              {bonus?.status !== 'PENDING' && (
                <motion.div variants={customerStagger.item}>
                  <WalletBalanceCard
                    bonus={bonus}
                    onRequestWithdrawal={() => withdrawMutation.mutate()}
                    isRequesting={withdrawMutation.isPending}
                  />
                </motion.div>
              )}

              {/* Withdrawal History */}
              {withdrawals.length > 0 && (
                <motion.div variants={customerStagger.item}>
                  <WithdrawalHistory withdrawals={withdrawals} />
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </MotionPage>
  );
}
