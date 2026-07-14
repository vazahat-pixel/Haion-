import React from 'react';
import { motion } from 'framer-motion';

export const ScrollReveal = ({ children, delay = 0, duration = 0.6, y = 30, x = 0, scale = 1 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const GlassCard = ({ children, className = "", onClick, hoverEffect = true }) => {
  return (
    <div
      onClick={onClick}
      className={`glassmorphism rounded-2xl p-6 relative overflow-hidden transition-all duration-500 group ${
        hoverEffect ? 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/35 hover:-translate-y-1' : ''
      } ${className}`}
    >
      {/* Subtle top glare highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
};

export const SectionHeading = ({ title, subtitle, badge }) => {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16 px-4">
      {badge && (
        <span className="inline-block text-xs font-semibold tracking-widest text-amber-500 uppercase bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 mb-4 animate-pulse-slow">
          {badge}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient mb-4 font-display">
        {title}
      </h2>
      <p className="text-zinc-650 text-lg md:text-xl font-light">
        {subtitle}
      </p>
    </div>
  );
};

export const AnimatedCounter = ({ value, suffix = "", duration = 2 }) => {
  const [count, setCount] = React.useState(0);
  const nodeRef = React.useRef(null);
  const [hasStarted, setHasStarted] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!hasStarted) return;

    let start = 0;
    const end = parseFloat(value);
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = 40;
    const steps = totalMiliseconds / incrementTime;
    const increment = (end - start) / steps;

    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [hasStarted, value, duration]);

  // Format integer or float
  const displayVal = Number.isInteger(value) ? Math.floor(count) : count.toFixed(1);

  return (
    <span ref={nodeRef} className="font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-purple-600">
      {displayVal}{suffix}
    </span>
  );
};

export const FloatingElement = ({ children, delay = 0, duration = 6, yOffset = 15 }) => {
  return (
    <motion.div
      animate={{ y: [0, -yOffset, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
};

export const PhoneMockup = ({ children, className = "" }) => {
  return (
    <div className={`relative w-[300px] h-[600px] bg-black rounded-[48px] border-[10px] border-zinc-800 shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col ${className}`}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-6 bg-black rounded-b-3xl z-50 flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-zinc-800 rounded-full mr-2" />
        <div className="w-10 h-1 bg-zinc-800 rounded-full" />
      </div>
      
      {/* Speaker and Camera reflections */}
      <div className="absolute top-[3px] right-[40px] w-2 h-2 bg-zinc-900 rounded-full opacity-60 z-50" />

      {/* Screen container */}
      <div className="flex-1 relative bg-[#07070a] text-white overflow-hidden p-6 pt-10 flex flex-col font-sans select-none">
        {/* Signal, Time, Battery */}
        <div className="absolute top-2 left-6 right-6 flex justify-between items-center text-[10px] font-medium text-zinc-400 z-40">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>5G</span>
            <div className="w-5 h-2.5 border border-zinc-500 rounded-sm p-[1px] flex items-center">
              <div className="w-full h-full bg-zinc-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 flex flex-col h-full mt-2">
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-zinc-600 rounded-full z-50" />
      </div>
    </div>
  );
};

export { default as CartDrawer } from './CartDrawer';

