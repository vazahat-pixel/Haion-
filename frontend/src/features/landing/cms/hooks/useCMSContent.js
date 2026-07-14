import { FiShield, FiZap, FiBattery, FiCpu, FiTruck, FiAward } from 'react-icons/fi';
import { useCMS, useCMSSettings } from '../CMSContext';
import { useCMSPageBundle } from './useCMSPageBundle';
import { pickCms } from '../cms-defaults';
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
  APPLIANCES_SECTIONS_FALLBACK,
} from '../../data/pageContentFallback';
import {
  servicesContent as servicesContentFallback,
  serviceProducts as serviceProductsFallback,
  serviceSectionTitles as serviceSectionTitlesFallback,
  scooterGalleryImages as scooterGalleryFallback,
  scooter360Images as scooter360Fallback,
  safeguardFeatureCards as safeguardFeatureCardsFallback,
  safeguardUserBenefits as safeguardUserBenefitsFallback,
  safeguardSectionTitles as safeguardSectionTitlesFallback,
} from '../../data/servicesDetailFallback';

const SERVICE_ICONS = {
  shield: FiShield,
  zap: FiZap,
  battery: FiBattery,
  cpu: FiCpu,
  truck: FiTruck,
};

const HIGHLIGHT_ICONS = {
  award: FiAward,
  cpu: FiCpu,
  shield: FiShield,
};

function mergeSection(fallback, section) {
  return { ...fallback, ...(section ?? {}) };
}

function withServiceIcons(contentMap) {
  const out = {};
  for (const [key, val] of Object.entries(contentMap ?? {})) {
    out[key] = {
      ...val,
      icon: SERVICE_ICONS[val.iconName] || SERVICE_ICONS.shield,
    };
  }
  return out;
}

export function useCMSAbout() {
  const { getSection, apiOnline } = useCMSPageBundle('about');
  const { getCollection } = useCMS();
  const teamFromCollection = getCollection('team-members').map((m) => ({
    name: m.name,
    role: m.role,
    initials: m.initials,
  }));

  return {
    hero: mergeSection(ABOUT_FALLBACK.hero, getSection('about-hero')),
    cards: apiOnline
      ? getSection('about-cards').cards?.length
        ? getSection('about-cards').cards
        : ABOUT_FALLBACK.cards
      : ABOUT_FALLBACK.cards,
    leadership: {
      ...ABOUT_FALLBACK.leadership,
      ...getSection('about-leadership'),
      members: teamFromCollection.length
        ? teamFromCollection
        : getSection('about-leadership').members?.length
          ? getSection('about-leadership').members
          : ABOUT_FALLBACK.leadership.members,
    },
    journey: mergeSection(ABOUT_FALLBACK.journey, getSection('about-journey')),
    founder: mergeSection(ABOUT_FALLBACK.founder, getSection('about-founder')),
    careers: mergeSection(ABOUT_FALLBACK.careers, getSection('about-careers')),
    tagline: pickCms(ABOUT_FALLBACK.tagline, getSection('about-tagline').text),
    filmStrip: getSection('about-tagline').filmStrip?.length
      ? getSection('about-tagline').filmStrip
      : ABOUT_FALLBACK.filmStrip,
    bgImages: { ...ABOUT_FALLBACK.bgImages, ...getSection('about-hero').bgImages },
  };
}

export function useCMSServicesData() {
  const { getCollection, apiOnline } = useCMS();
  const items = getCollection('services');

  if (!apiOnline || !items.length) {
    return {
      servicesContent: withServiceIcons(servicesContentFallback),
      serviceProducts: serviceProductsFallback,
      serviceSectionTitles: serviceSectionTitlesFallback,
      scooterGalleryImages: scooterGalleryFallback,
      scooter360Images: scooter360Fallback,
      safeguardFeatureCards: safeguardFeatureCardsFallback,
      safeguardUserBenefits: safeguardUserBenefitsFallback,
      safeguardSectionTitles: safeguardSectionTitlesFallback,
    };
  }

  const servicesContent = {};
  const serviceProducts = { ...serviceProductsFallback };
  const serviceSectionTitles = { ...serviceSectionTitlesFallback };
  let scooterGalleryImages = scooterGalleryFallback;
  let scooter360Images = scooter360Fallback;
  let safeguardFeatureCards = safeguardFeatureCardsFallback;
  let safeguardUserBenefits = safeguardUserBenefitsFallback;
  let safeguardSectionTitles = safeguardSectionTitlesFallback;

  for (const item of items) {
    const id = item.id || item.serviceId;
    if (!id) continue;
    servicesContent[id] = {
      ...(servicesContentFallback[id] ?? {}),
      ...item,
      iconName: item.iconName || servicesContentFallback[id]?.iconName,
      icon: SERVICE_ICONS[item.iconName || servicesContentFallback[id]?.iconName] || FiShield,
    };
    if (item.products?.length) serviceProducts[id] = item.products;
    if (item.sectionTitles) serviceSectionTitles[id] = item.sectionTitles;
    if (item.galleryImages?.length) scooterGalleryImages = item.galleryImages;
    if (item.scooter360Images?.length) scooter360Images = item.scooter360Images;
    if (item.safeguardFeatureCards?.length) safeguardFeatureCards = item.safeguardFeatureCards;
    if (item.safeguardUserBenefits?.length) safeguardUserBenefits = item.safeguardUserBenefits;
    if (item.safeguardSectionTitles) safeguardSectionTitles = { ...safeguardSectionTitles, ...item.safeguardSectionTitles };
  }

  return {
    servicesContent: withServiceIcons({ ...servicesContentFallback, ...servicesContent }),
    serviceProducts,
    serviceSectionTitles,
    scooterGalleryImages,
    scooter360Images,
    safeguardFeatureCards,
    safeguardUserBenefits,
    safeguardSectionTitles,
  };
}

export function useCMSGallery() {
  const { getCollection, apiOnline } = useCMS();
  const { getSection } = useCMSPageBundle('store');
  const items = getCollection('gallery-items');
  const section = getSection('store-gallery');
  return {
    items: apiOnline && items.length ? items : GALLERY_FALLBACK,
    section: mergeSection(GALLERY_SECTION_FALLBACK, section),
  };
}

export function useCMSPartners() {
  const { getCollection, apiOnline } = useCMS();
  const { getSection } = useCMSPageBundle('home');
  const items = getCollection('partners');
  const section = getSection('brands');
  return {
    brands: apiOnline && items.length ? items.map((p) => p.name || p.label) : PARTNERS_FALLBACK.map((p) => p.name),
    section: mergeSection(BRANDS_SECTION_FALLBACK, section),
  };
}

export function useCMSDownloadCta() {
  const { getSection } = useCMSPageBundle('home');
  const settings = useCMSSettings();
  const section = getSection('download-cta');
  return {
    ...mergeSection(DOWNLOAD_CTA_FALLBACK, section),
    iosUrl: settings.appLinks?.iosUrl || '#download',
    androidUrl: settings.appLinks?.androidUrl || '#download',
  };
}

export function useCMSOffers() {
  const { getCollection, apiOnline } = useCMS();
  const { getSection } = useCMSPageBundle('home');
  const items = getCollection('pricing-plans');
  const section = getSection('offers');
  return {
    offers: apiOnline && items.length ? items : OFFERS_FALLBACK,
    section: mergeSection(OFFERS_SECTION_FALLBACK, section),
  };
}

export function useCMSScrollSequence() {
  const { getSection } = useCMSPageBundle('home');
  return mergeSection(SCROLL_SEQUENCE_FALLBACK, getSection('scroll-sequence'));
}

export function useCMSStoreExtras(config) {
  const { getSection } = useCMSPageBundle('store');
  const hero = getSection('store-hero');
  const extra = getSection('store-extras');
  const merged = mergeSection(STORE_EXTRA_FALLBACK, extra);
  return {
    heroBadge: pickCms(STORE_EXTRA_FALLBACK.heroBadge, hero.badge),
    layoutsTitle: pickCms(STORE_EXTRA_FALLBACK.layoutsTitle, merged.layoutsTitle),
    images: merged.images?.length ? merged.images : config?.showroomInfo?.images?.length ? config.showroomInfo.images.map((i) => ({ src: i.src, title: i.title, location: i.location, desc: i.title })) : STORE_EXTRA_FALLBACK.images,
    highlights: merged.highlights?.length ? merged.highlights.map((h) => ({ ...h, icon: HIGHLIGHT_ICONS[h.iconName] || FiAward })) : STORE_EXTRA_FALLBACK.highlights.map((h) => ({ ...h, icon: HIGHLIGHT_ICONS[h.iconName] })),
    showroomFeaturesHeading: pickCms(STORE_EXTRA_FALLBACK.showroomFeaturesHeading, config?.showroomInfo?.featuresHeading),
  };
}

export function useCMSAppliancesSections() {
  const { getSection } = useCMSPageBundle('appliances');
  const sections = getSection('appliances-sections');
  return mergeSection(APPLIANCES_SECTIONS_FALLBACK, sections);
}
