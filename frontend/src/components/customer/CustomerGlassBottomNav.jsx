import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { customerSpring, navIndicator } from '@/animations/customer.motion';
import { CustomerProfileDock } from '@/components/customer/CustomerProfileDock';

function GlassNavItem({ to, label, icon: Icon, end, layoutId }) {
  const location = useLocation();
  const isActive = end
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <NavLink to={to} end={end} className="relative flex flex-1 justify-center">
      <motion.div
        className="relative flex flex-col items-center gap-1 px-2 py-2"
        whileHover={!isActive ? { y: -2, scale: 1.04 } : { y: -1 }}
        whileTap={{ scale: 0.9 }}
        transition={customerSpring.snappy}
      >
        {isActive && (
          <>
            <motion.div
              layoutId={layoutId}
              transition={navIndicator.transition}
              className="customer-glass-nav__pill absolute inset-0 rounded-2xl"
            />
            <motion.span
              layoutId={`${layoutId}-dot`}
              className="customer-glass-nav__dot absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
              transition={navIndicator.transition}
            />
          </>
        )}
        <motion.div
          animate={{
            scale: isActive ? 1.12 : 1,
            y: isActive ? -1 : 0,
          }}
          transition={customerSpring.bouncy}
          className="relative z-10"
        >
          <Icon
            className={cn(
              'h-[19px] w-[19px] transition-colors duration-200',
              isActive ? 'text-[var(--customer-primary)]' : 'text-[var(--customer-text-muted)]'
            )}
            strokeWidth={isActive ? 2.5 : 1.75}
          />
        </motion.div>
        <motion.span
          animate={{
            opacity: isActive ? 1 : 0.72,
            fontWeight: isActive ? 600 : 500,
          }}
          className={cn(
            'relative z-10 text-[9px] tracking-tight transition-colors duration-200',
            isActive ? 'text-[var(--customer-primary)]' : 'text-[var(--customer-text-secondary)]'
          )}
        >
          {label}
        </motion.span>
      </motion.div>
    </NavLink>
  );
}

export function CustomerGlassBottomNav({ links, profile, guest = false, layoutId = 'customer-nav-pill' }) {
  return (
    <motion.nav
      initial={{ y: 100, opacity: 0, filter: 'blur(8px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ ...customerSpring.smooth, delay: 0.1 }}
      className="customer-glass-nav pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(0.65rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Main navigation"
    >
      {/* gradient fade — content fades before nav zone */}
      <div className="customer-glass-nav__fade" aria-hidden />

      <div className="customer-glass-nav__dock pointer-events-auto relative z-10 mx-auto flex max-w-md items-stretch gap-0.5">
        <div className="customer-glass-nav__frost" aria-hidden />
        <div className="customer-glass-nav__shine pointer-events-none" aria-hidden />

        <ul className="relative z-10 flex flex-1 items-stretch px-1 py-1">
          {links.map((link, i) => (
            <motion.li
              key={link.to}
              className="flex flex-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...customerSpring.smooth, delay: 0.15 + i * 0.05 }}
            >
              <GlassNavItem {...link} layoutId={layoutId} />
            </motion.li>
          ))}
        </ul>

        <div className="customer-glass-nav__divider relative z-10 my-2 w-px shrink-0" />

        <motion.div
          className="relative z-10 flex shrink-0 items-center pr-1.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...customerSpring.smooth, delay: 0.4 }}
        >
          <CustomerProfileDock profile={profile} guest={guest} />
        </motion.div>
      </div>
    </motion.nav>
  );
}
