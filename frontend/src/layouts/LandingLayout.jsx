import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';

const POPPINS_HREF =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
const LANDING_CSS_HREF = '/landing/landing.css';

function isLandingAsset(link) {
  return (
    link.dataset.landingStyles === 'true' ||
    link.dataset.landingFont === 'true' ||
    link.href.includes('fonts.googleapis.com')
  );
}

function setErpStylesEnabled(enabled) {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (isLandingAsset(link)) return;
    link.disabled = !enabled;
  });

  document.querySelectorAll('style[data-vite-dev-id]').forEach((style) => {
    if (style.dataset.landingStyle === 'true') return;
    style.media = enabled ? 'all' : 'not all';
  });
}

export default function LandingLayout() {
  useEffect(() => {
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.documentElement.className = 'light scroll-smooth';
    document.body.className = 'bg-[#f8f9fa] text-zinc-900 antialiased overflow-x-hidden landing-active';

    setErpStylesEnabled(false);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = POPPINS_HREF;
    fontLink.dataset.landingFont = 'true';
    document.head.appendChild(fontLink);

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = LANDING_CSS_HREF;
    styleLink.dataset.landingStyles = 'true';
    document.head.appendChild(styleLink);

    return () => {
      document.head.querySelector('link[data-landing-font="true"]')?.remove();
      document.head.querySelector('link[data-landing-styles="true"]')?.remove();

      setErpStylesEnabled(true);

      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  return (
    <div className="landing-root min-h-screen" data-landing-panel style={{ minHeight: '100vh' }}>
      <Outlet />
    </div>
  );
}
