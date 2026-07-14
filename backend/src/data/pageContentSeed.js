/**
 * Additional CMS seeds for About, Store, Home orphan sections, Services, Gallery, Partners.
 */
import {
  ABOUT_FALLBACK,
  GALLERY_FALLBACK,
  GALLERY_SECTION_FALLBACK,
  PARTNERS_FALLBACK,
  DOWNLOAD_CTA_FALLBACK,
  OFFERS_FALLBACK,
  OFFERS_SECTION_FALLBACK,
  SCROLL_SEQUENCE_FALLBACK,
  BRANDS_SECTION_FALLBACK,
  STORE_EXTRA_FALLBACK,
} from './pageContentSeedData.js';
import { getAppliancesSectionsContent } from './appliancesPricingSeed.js';

function mapCollection(collection, items) {
  return items.map((data, order) => ({
    collection,
    order,
    isVisible: true,
    data,
  }));
}

export function getPageContentSections() {
  return [
    {
      page: 'about',
      sectionKey: 'about-cards',
      sectionLabel: 'About Story Cards',
      order: 1,
      isVisible: true,
      content: { cards: ABOUT_FALLBACK.cards },
    },
    {
      page: 'about',
      sectionKey: 'about-leadership',
      sectionLabel: 'Leadership Team',
      order: 2,
      isVisible: true,
      content: ABOUT_FALLBACK.leadership,
    },
    {
      page: 'about',
      sectionKey: 'about-journey',
      sectionLabel: 'Founder Journey',
      order: 3,
      isVisible: true,
      content: ABOUT_FALLBACK.journey,
    },
    {
      page: 'about',
      sectionKey: 'about-founder',
      sectionLabel: 'Founder Message',
      order: 4,
      isVisible: true,
      content: ABOUT_FALLBACK.founder,
    },
    {
      page: 'about',
      sectionKey: 'about-careers',
      sectionLabel: 'Careers CTA',
      order: 5,
      isVisible: true,
      content: ABOUT_FALLBACK.careers,
    },
    {
      page: 'about',
      sectionKey: 'about-tagline',
      sectionLabel: 'Brand Tagline',
      order: 6,
      isVisible: true,
      content: { text: ABOUT_FALLBACK.tagline, filmStrip: ABOUT_FALLBACK.filmStrip },
    },
    {
      page: 'store',
      sectionKey: 'store-extras',
      sectionLabel: 'Store Extra Content',
      order: 2,
      isVisible: true,
      content: STORE_EXTRA_FALLBACK,
    },
    {
      page: 'store',
      sectionKey: 'store-gallery',
      sectionLabel: 'Gallery Section',
      order: 3,
      isVisible: true,
      content: GALLERY_SECTION_FALLBACK,
    },
    {
      page: 'appliances',
      sectionKey: 'appliances-sections',
      sectionLabel: 'Appliance Category Headings',
      order: 1,
      isVisible: true,
      content: getAppliancesSectionsContent(),
    },
    {
      page: 'home',
      sectionKey: 'brands',
      sectionLabel: 'Brands Marquee',
      order: 13,
      isVisible: true,
      content: BRANDS_SECTION_FALLBACK,
    },
    {
      page: 'home',
      sectionKey: 'download-cta',
      sectionLabel: 'Download App CTA',
      order: 14,
      isVisible: true,
      content: DOWNLOAD_CTA_FALLBACK,
    },
    {
      page: 'home',
      sectionKey: 'offers',
      sectionLabel: 'Offers Section',
      order: 15,
      isVisible: true,
      content: OFFERS_SECTION_FALLBACK,
    },
    {
      page: 'home',
      sectionKey: 'scroll-sequence',
      sectionLabel: 'Scroll Sequence',
      order: 16,
      isVisible: true,
      content: SCROLL_SEQUENCE_FALLBACK,
    },
  ];
}

export function getPageContentCollections() {
  const teamMembers = ABOUT_FALLBACK.leadership.members.map((m) => ({ ...m }));
  const partners = PARTNERS_FALLBACK.map((p) => ({ name: p.name, label: p.name }));
  const gallery = GALLERY_FALLBACK;
  const offers = OFFERS_FALLBACK;
  const services = [
    { id: 'safeguard', iconName: 'shield', title: 'Safeguard (New Innovation)', subtitle: 'Intellectually designed protective systems.', description: 'Patent-pending Safeguard technology for EV protection.' },
    { id: 'scooter', iconName: 'zap', title: 'Electric Scooters', subtitle: 'Next-generation urban commuting.', description: 'Haion electric scooters combine aerodynamics and digital consoles.' },
    { id: 'battery', iconName: 'battery', title: 'Lithium-Ion Battery Packs', subtitle: 'Smart batteries with integrated BMS.', description: 'Premium Grade-A cells with custom metal casing.' },
    { id: 'charger', iconName: 'cpu', title: 'Smart EV Chargers', subtitle: 'Intelligent fast chargers with auto cut-off.', description: 'Real-time charge level detection and safe power cut-off.' },
    { id: 'rickshaw', iconName: 'truck', title: 'Heavy-Duty E-Rickshaw Vehicles', subtitle: 'Robust passenger transport for Indian roads.', description: 'Reinforced steel chassis and high-efficiency gearboxes.' },
  ];

  return [
    ...mapCollection('team-members', teamMembers),
    ...mapCollection('partners', partners),
    ...mapCollection('gallery-items', gallery),
    ...mapCollection('pricing-plans', offers),
    ...mapCollection('services', services),
  ];
}
