import { motion } from 'framer-motion';
import { pageEnter } from '@/animations/motion.config';

export function MotionPage({ children, className }) {
  return (
    <motion.div
      initial={pageEnter.initial}
      animate={pageEnter.animate}
      exit={pageEnter.exit}
      transition={pageEnter.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
