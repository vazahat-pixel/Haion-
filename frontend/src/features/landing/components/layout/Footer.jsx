import React from 'react';
import { FiTwitter, FiInstagram, FiArrowUp, FiFacebook, FiYoutube } from 'react-icons/fi';
import { useCMSSettings } from '../../cms/CMSContext';
import { pickCms } from '../../cms/cms-defaults';

const socialIconMap = {
  facebook: FiFacebook,
  twitter: FiTwitter,
  instagram: FiInstagram,
  youtube: FiYoutube,
};

const DEFAULT_COLUMNS = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'About us', url: '#about-us' },
      { label: 'Careers', url: 'careers' },
      { label: 'FAQ', url: '#faq' },
      { label: 'Blog', url: '#' },
      { label: 'Contact us', url: '#contact' },
    ],
  },
  {
    heading: 'Our Service',
    links: [
      { label: 'Home Appliances', url: '#appliances-view' },
      { label: 'Electric Vechicle', url: '#service-scooter' },
      { label: 'Safegaurd (New innovation)', url: '#service-safeguard' },
    ],
  },
  {
    heading: 'Reach Us',
    links: [
      { label: 'Gujarat, India', url: '#' },
      { label: '02269622645', url: 'tel:02269622645' },
      { label: 'info@haion.co.in', url: 'mailto:info@haion.co.in' },
    ],
  },
];

export default function Footer({ onCareersClick }) {
  const settings = useCMSSettings();
  const logoUrl = pickCms('/haionlogo-removebg-preview.webp', settings.logo?.url);
  const logoAlt = pickCms('Haion Logo', settings.logo?.alt);
  const tagline = pickCms(
    'Haion also focuses on the underlying electronic components and integrated systems that power modern technology.',
    settings.tagline
  );
  const copyrightText = pickCms('Copyright © 2009 - 2025 Haion. All Rights Reserved.', settings.footer?.copyrightText);
  const columns = settings.footer?.columns?.length ? settings.footer.columns : DEFAULT_COLUMNS;
  const socialLinks = (settings.socialLinks ?? []).filter((s) => s.isVisible !== false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (e, url) => {
    if (url === 'careers' && onCareersClick) {
      e.preventDefault();
      onCareersClick();
    }
  };

  return (
    <footer className="relative bg-white border-t border-black/5 pt-20 pb-10 overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-650/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 text-center md:text-left flex flex-col items-center md:items-start">
            <a href="#" className="flex items-center justify-center md:justify-start gap-2 mb-6 group inline-block">
              <img
                src={logoUrl}
                alt={logoAlt}
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </a>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-sm font-light text-center md:text-left">
              {tagline}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading} className="lg:col-span-2 text-center md:text-left">
              <h4 className="font-display font-bold text-zinc-950 mb-6 text-sm uppercase tracking-wider font-semibold">
                {col.heading}
              </h4>
              <ul className="space-y-4">
                {col.links?.map((link) => (
                  <li key={link.label}>
                    {link.url === 'careers' ? (
                      <button
                        onClick={(e) => handleLinkClick(e, link.url)}
                        className="text-zinc-500 hover:text-amber-500 text-sm transition-colors font-medium cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.url || '#'}
                        onClick={(e) => handleLinkClick(e, link.url)}
                        className="text-zinc-500 hover:text-amber-500 text-sm transition-colors font-medium"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-black/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-500 text-xs font-semibold text-center md:text-left">{copyrightText}</p>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {settings.footer?.showSocialLinks !== false && socialLinks.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Social Media</span>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social) => {
                    const Icon = socialIconMap[social.icon || social.platform] || FiFacebook;
                    return (
                      <a
                        key={social.platform}
                        href={social.url || '#'}
                        className="w-8 h-8 rounded-full bg-zinc-900/5 flex items-center justify-center text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors border border-black/5"
                      >
                        <Icon size={16} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={scrollToTop}
              className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-650 hover:text-amber-500 transition-colors"
            >
              Back to Top
              <div className="w-8 h-8 rounded-full bg-zinc-900/5 group-hover:bg-amber-500/10 border border-black/5 group-hover:border-amber-500/20 flex items-center justify-center transition-all">
                <FiArrowUp className="group-hover:-translate-y-0.5 transition-transform text-zinc-700" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
