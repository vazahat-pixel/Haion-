import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, LogOut, ChevronUp, User, Shield, Headphones,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { customerSpring } from '@/animations/customer.motion';
import { cn } from '@/utils/cn';

const QUICK_LINKS = [
  { to: '/customer/notifications', icon: Bell, label: 'Notifications' },
  { to: '/customer/warranty', icon: Shield, label: 'Warranty' },
  { to: '/customer/service-requests', icon: Headphones, label: 'Service' },
];

export function CustomerProfileDock({ profile, guest = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const name = profile?.name || user?.name || 'Customer';
  const email = profile?.email || user?.email;
  const code = profile?.code;
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    if (!guest) await logout();
    navigate(guest ? '/customer/access' : '/auth/login');
  };

  return (
    <div ref={ref} className="relative flex shrink-0">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(4px)' }}
            transition={customerSpring.smooth}
            className="customer-profile-sheet absolute bottom-full right-0 mb-3 w-64 overflow-hidden rounded-2xl p-1 shadow-2xl"
          >
            <div className="rounded-xl bg-[var(--customer-primary-soft)] p-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--customer-primary)] text-sm font-semibold text-white shadow-md">
                    {initial}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--customer-text)]">{name}</p>
                  {code && <p className="font-mono text-[10px] text-[var(--customer-text-muted)]">{code}</p>}
                  {email && <p className="truncate text-[11px] text-[var(--customer-text-secondary)]">{email}</p>}
                </div>
              </div>
            </div>

            <div className="p-1">
              {QUICK_LINKS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--customer-text-secondary)] transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-[var(--customer-text)]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {guest ? (
                <Link
                  to="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--customer-primary)] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <User className="h-4 w-4" />
                  Sign in for full access
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={customerSpring.snappy}
        aria-expanded={open}
        aria-label="Profile menu"
        className={cn(
          'relative flex flex-col items-center gap-0.5 px-1 py-1.5',
          open && 'text-[var(--customer-primary)]'
        )}
      >
        <div className="relative">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 transition-all',
              open ? 'ring-[var(--customer-primary)]' : 'ring-transparent'
            )}
            style={{ background: 'linear-gradient(135deg, var(--customer-primary), #2d2d2d)' }}
          >
            {initial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-[var(--customer-text-muted)]">
          Profile
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={customerSpring.snappy}>
            <ChevronUp className="h-2.5 w-2.5" />
          </motion.span>
        </span>
      </motion.button>
    </div>
  );
}
