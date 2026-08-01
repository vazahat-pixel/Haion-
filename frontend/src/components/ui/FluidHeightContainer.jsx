import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function FluidHeightContainer({ children, className = '' }) {
  const containerRef = useRef(null);
  const [height, setHeight] = useState('auto');

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`overflow-hidden ${className}`}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}
