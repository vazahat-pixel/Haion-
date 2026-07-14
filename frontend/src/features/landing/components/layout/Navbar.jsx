import React, { useState, useEffect, useMemo } from 'react';
import { FiMenu, FiX, FiDownload, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useCMSSettings } from '../../cms/CMSContext';
import { pickCms } from '../../cms/cms-defaults';

const DEFAULT_NAV_LINKS = [
  { label: 'Home', url: 'home', order: 0, isVisible: true },
  { label: 'Store', url: 'store', order: 1, isVisible: true },
  { label: 'About Us', url: 'about', order: 2, isVisible: true },
  { label: 'Home Appliances', url: 'appliances', order: 4, isVisible: true },
  { label: 'Inverter', url: 'inverter', order: 5, isVisible: true },
];

const serviceOptions = [
  { label: 'Scooter', id: 'scooter' },
  { label: 'Lithium Battery', id: 'battery' },
  { label: 'Charger', id: 'charger' },
];

const DEFAULT_EV_DROPDOWN = { label: 'EV', items: serviceOptions };
const DEFAULT_SAFEGUARD = { label: 'Safeguard (New Innovation)', url: 'service-safeguard', isVisible: true };

function normalizeNavUrl(url = '') {
  return String(url).replace(/^#/, '').toLowerCase();
}

export default function Navbar({
  onAboutUsClick,
  onHomeAppliancesClick,
  onHomeClick,
  onNavLinkClick,
  onStoreClick,
  onCareersClick,
  cartCount = 0,
  onCartClick,
  onTrackClick,
  onProfileClick,
  onInverterClick,
}) {
  const settings = useCMSSettings();
  const logoUrl = pickCms('/haionlogo-removebg-preview.webp', settings.logo?.url);
  const logoAlt = pickCms('Haion Logo', settings.logo?.alt);
  const ctaLabel = pickCms('Download App', settings.navbar?.ctaButton?.label);
  const careersLabel = pickCms('Work With Us', settings.navbar?.careersButton?.label);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [hasOrders, setHasOrders] = useState(false);

  const navLinks = useMemo(() => {
    const raw = settings.navbar?.links?.length ? settings.navbar.links : DEFAULT_NAV_LINKS;
    return [...raw]
      .filter((l) => l.isVisible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [settings.navbar?.links]);

  const resolveNavClick = (url) => {
    const key = normalizeNavUrl(url);
    if (key === 'home' || key === '') return onHomeClick?.();
    if (key === 'store' || key === 'store-view') return onStoreClick?.();
    if (key === 'about' || key === 'about-us') return onAboutUsClick?.();
    if (key === 'appliances' || key === 'appliances-view') return onHomeAppliancesClick?.();
    if (key === 'inverter' || key === 'inverter-view') return onInverterClick?.();
    if (key.startsWith('service-')) return onNavLinkClick?.(`#${key}`);
    if (url?.startsWith('#')) return onNavLinkClick?.(url);
    return onNavLinkClick?.(`#${key}`);
  };

  const evConfig = settings.navbar?.evDropdown ?? DEFAULT_EV_DROPDOWN;
  const evServiceOptions = evConfig.items?.length ? evConfig.items : serviceOptions;
  const evLabel = evConfig.label || 'EV';
  const safeguardConfig = settings.navbar?.safeguardLink ?? DEFAULT_SAFEGUARD;
  const showEvDropdown = navLinks.some((l) => normalizeNavUrl(l.url) === 'ev-dropdown' || l.type === 'dropdown') || !settings.navbar?.links?.length;
  const safeguardLink = navLinks.find((l) => normalizeNavUrl(l.url) === 'service-safeguard');
  const primaryLinks = navLinks.filter((l) => {
    const key = normalizeNavUrl(l.url);
    return key !== 'ev-dropdown' && l.type !== 'dropdown' && key !== 'service-safeguard';
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkOrders = () => {
      const orders = JSON.parse(localStorage.getItem('haion_orders') || '[]');
      setHasOrders(orders.length > 0);
    };
    checkOrders();
    const interval = setInterval(checkOrders, 2000);
    window.addEventListener('storage', checkOrders);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkOrders);
    };
  }, []);

  const linkClass =
    'text-[13px] font-semibold text-zinc-650 hover:text-amber-500 transition-colors duration-300 py-1';
  const mobileLinkClass =
    'font-display text-xl font-semibold text-zinc-800 hover:text-amber-500 transition-colors duration-300';

  const renderNavLink = (link, className, onAfterClick) => (
    <a
      key={`${link.label}-${link.url}`}
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onAfterClick?.();
        resolveNavClick(link.url);
      }}
      className={className}
    >
      {link.label}
    </a>
  );

  const evDropdownDesktop = (
    <div
      className="relative py-1 cursor-pointer"
      onMouseEnter={() => setActiveDropdown(true)}
      onMouseLeave={() => setActiveDropdown(false)}
    >
      <div className="flex items-center gap-1 text-[13px] font-semibold text-zinc-650 hover:text-amber-500 transition-colors duration-300">
        {evLabel}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div
        className={`absolute left-0 mt-2 w-64 bg-white border border-zinc-100 rounded-2xl shadow-xl py-3 transition-all duration-300 origin-top-left ${
          activeDropdown ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'
        }`}
      >
        {evServiceOptions.map((opt) => (
          <a
            key={opt.id}
            href={`#service-${opt.id}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveDropdown(false);
              onNavLinkClick(`#service-${opt.id}`);
            }}
            className="block px-5 py-2.5 text-sm font-medium text-zinc-700 hover:text-amber-500 hover:bg-zinc-50 transition-colors duration-200"
          >
            {opt.label}
          </a>
        ))}
      </div>
    </div>
  );

  const safeguardDesktop = safeguardLink ? (
    renderNavLink(safeguardLink, linkClass)
  ) : safeguardConfig.isVisible !== false ? (
    <a
      href={`#service-${safeguardConfig.url?.replace('service-', '') || 'safeguard'}`}
      onClick={(e) => {
        e.preventDefault();
        onNavLinkClick(`#service-${safeguardConfig.url?.replace('service-', '') || 'safeguard'}`);
      }}
      className={linkClass}
    >
      {safeguardConfig.label}
    </a>
  ) : null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-black/5 py-2.5 shadow-sm">
        <div className="max-w-[95%] mx-auto px-4 flex justify-between items-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onHomeClick();
            }}
            className="flex items-center gap-2 group"
          >
            <img
              src={logoUrl}
              alt={logoAlt}
              className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          <div className="hidden md:flex items-center gap-5 lg:gap-6 xl:gap-8">
            {primaryLinks.flatMap((link) => {
              const key = normalizeNavUrl(link.url);
              const items = [renderNavLink(link, linkClass)];
              if (key === 'about' || key === 'about-us') {
                if (showEvDropdown || !settings.navbar?.links?.length) items.push(evDropdownDesktop);
                items.push(safeguardDesktop);
              }
              return items;
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onProfileClick}
              className="relative p-2.5 rounded-full border border-zinc-200 text-zinc-800 hover:text-amber-500 hover:border-amber-500/50 hover:bg-zinc-50 transition-all duration-300 cursor-pointer flex items-center justify-center"
              aria-label="User Profile"
            >
              <FiUser size={18} />
            </button>
            <button
              onClick={onCartClick}
              className="relative p-2.5 rounded-full border border-zinc-200 text-zinc-800 hover:text-amber-500 hover:border-amber-500/50 hover:bg-zinc-50 transition-all duration-300 cursor-pointer"
              aria-label="Open Cart"
            >
              <FiShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={onCareersClick}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-zinc-950 hover:bg-zinc-900 text-white px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
            >
              {careersLabel}
            </button>
            <a
              href="#download"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-zinc-950 to-amber-500 text-white px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:scale-[1.03]"
            >
              <FiDownload className="text-sm" />
              {ctaLabel}
            </a>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={onCartClick}
              className="relative text-zinc-900 hover:text-amber-500 transition-colors p-1"
              aria-label="Open Cart"
            >
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-900 hover:text-amber-500 transition-colors p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-2xl transition-transform duration-500 md:hidden flex flex-col justify-center items-center gap-6 overflow-y-auto pt-20 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {primaryLinks.flatMap((link) => {
          const key = normalizeNavUrl(link.url);
          const items = [renderNavLink(link, mobileLinkClass, () => setIsOpen(false))];
          if (key === 'about' || key === 'about-us') {
            items.push(
              <div key="ev-mobile" className="w-12 h-[1px] bg-zinc-200 my-1" />,
              <div key="ev-group" className="flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">EV</span>
                {evServiceOptions.map((opt) => (
                  <a
                    key={opt.id}
                    href={`#service-${opt.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                      onNavLinkClick(`#service-${opt.id}`);
                    }}
                    className="text-lg font-semibold text-zinc-800 hover:text-amber-500 transition-colors"
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            );
            if (safeguardLink) {
              items.push(renderNavLink(safeguardLink, mobileLinkClass, () => setIsOpen(false)));
            }
          }
          return items;
        })}

        <div
          onClick={() => {
            setIsOpen(false);
            onProfileClick();
          }}
          className="w-11/12 max-w-sm bg-zinc-50 border border-zinc-150 rounded-2xl p-4 flex flex-col gap-3 mt-2 cursor-pointer hover:bg-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-zinc-950 flex items-center justify-center text-white text-xs font-bold">
              GU
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-zinc-800">Guest Customer</p>
              <p className="text-[10px] text-zinc-400 font-medium">View Profile & Orders →</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button
            onClick={() => {
              setIsOpen(false);
              onCareersClick();
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase bg-zinc-950 hover:bg-zinc-900 text-white px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer"
          >
            {careersLabel}
          </button>
          <a
            href="#download"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wider uppercase bg-gradient-to-r from-zinc-950 to-amber-500 text-white px-6 py-3 rounded-full hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-300"
          >
            <FiDownload />
            {ctaLabel}
          </a>
        </div>
      </div>
    </>
  );
}
