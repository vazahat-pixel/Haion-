/** Customer app — spring-based motion language */
export const customerSpring = {
  snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 },
  smooth: { type: 'spring', stiffness: 280, damping: 28, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 180, damping: 24, mass: 1 },
  bouncy: { type: 'spring', stiffness: 500, damping: 22, mass: 0.7 },
};

export const customerStagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { ...customerSpring.smooth },
    },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: customerSpring.smooth },
  },
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -3, transition: customerSpring.snappy },
  tap: { scale: 0.985, transition: { duration: 0.1 } },
};

export const navIndicator = {
  layoutId: 'customer-nav-pill',
  transition: customerSpring.bouncy,
};
