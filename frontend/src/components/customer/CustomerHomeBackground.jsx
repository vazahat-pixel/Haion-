import { motion, useScroll, useTransform } from 'framer-motion';

export function CustomerHomeBackground() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 40]);

  return (
    <div className="customer-home-bg pointer-events-none fixed inset-0" aria-hidden>
      <motion.div
        style={{ y: y1 }}
        className="customer-aurora-orb customer-aurora-orb-1"
      />
      <div className="customer-aurora-orb customer-aurora-orb-2" />
    </div>
  );
}
