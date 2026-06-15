export const pageEnter = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -2 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
};

export const cardGrid = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
  },
};

export const modalEnter = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.1 } },
};

export const drawerEnter = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  exit: { x: '100%', transition: { duration: 0.2 } },
};

export const tableRow = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

export const tableBody = {
  animate: { transition: { staggerChildren: 0.025, delayChildren: 0.04 } },
};

export const bulkToolbar = {
  initial: { y: 80, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { y: 80, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};
