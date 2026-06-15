import { gsap } from 'gsap';

gsap.defaults({ ease: 'power2.out', duration: 0.25 });

export const animateCounter = (element, from, to, duration = 1.2) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { innerText: from },
    {
      innerText: to,
      duration,
      snap: { innerText: 1 },
      ease: 'power2.out',
      onUpdate: function () {
        element.innerText = Math.round(this.targets()[0].innerText).toLocaleString('en-IN');
      },
    }
  );
};
