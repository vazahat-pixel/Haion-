import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

const POPPINS_HREF =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap';
const LANDING_CSS_HREF = '/landing/landing.css';

function isLandingAsset(link) {
  return (
    link.dataset.landingStyles === 'true' ||
    link.dataset.landingFont === 'true' ||
    (link.href && link.href.includes('fonts.googleapis.com'))
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
  const [isCssReady, setIsCssReady] = useState(() => {
    return !!document.querySelector('link[data-landing-styles="true"]');
  });

  useEffect(() => {
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.documentElement.className = 'dark scroll-smooth';
    document.body.className = 'bg-[#030303] text-gray-200 antialiased overflow-x-hidden landing-active';

    setErpStylesEnabled(false);

    let fontLink = document.head.querySelector('link[data-landing-font="true"]');
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = POPPINS_HREF;
      fontLink.dataset.landingFont = 'true';
      document.head.appendChild(fontLink);
    }

    let styleLink = document.head.querySelector('link[data-landing-styles="true"]');
    if (!styleLink) {
      styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = LANDING_CSS_HREF;
      styleLink.dataset.landingStyles = 'true';
      styleLink.onload = () => setIsCssReady(true);
      document.head.appendChild(styleLink);
    } else {
      setIsCssReady(true);
    }

    return () => {
      document.head.querySelector('link[data-landing-font="true"]')?.remove();
      document.head.querySelector('link[data-landing-styles="true"]')?.remove();

      setErpStylesEnabled(true);

      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  return (
    <div
      className="landing-root min-h-screen bg-[#030303]"
      data-landing-panel
      style={{
        minHeight: '100vh',
        backgroundColor: '#030303',
        opacity: isCssReady ? 1 : 0,
        transition: 'opacity 0.1s ease-in'
      }}
    >
      <Outlet />
    </div>
  );
}
