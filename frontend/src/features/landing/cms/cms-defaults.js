/**
 * Fallback defaults for every CMS field — landing never breaks if API is down.
 * Values mirror backend seed (cmsSeedData.js).
 */
export const CMS_DEFAULTS = {
  settings: {
    siteName: 'Haion',
    tagline: 'Premium Electronics E-Commerce Mobile App',
    logo: { url: '/haionlogo-removebg-preview.webp', alt: 'Haion Logo', publicId: '' },
    favicon: { url: '/favicon.svg', publicId: '' },
    contact: {
      email: 'ev@haion.co.in',
      phone: '02269622645',
      whatsapp: '',
      address: 'D-46, SECTOR-10, Noida, Uttar Pradesh 201301',
      mapEmbedUrl: '',
    },
    theme: {
      primaryColor: '#e88d01',
      secondaryColor: '#ab7e2c',
      accentColor: '#ffd233',
      backgroundColor: '#030303',
      textColor: '#e4e4e7',
      fontFamily: 'Poppins',
      headingFontFamily: 'Poppins',
      baseFontSize: '16px',
      borderRadius: 'lg',
      buttonStyle: 'filled',
    },
    maintenanceMode: { isEnabled: false, message: 'We are currently performing scheduled maintenance.' },
    seo: {
      metaTitle: 'Haion — Premium Electronics E-Commerce Mobile App',
      metaDescription:
        'Experience the future of electronics shopping. High-end smartphones, premium audio, next-gen wearables, and smart home appliances on the modern Haion Mobile App.',
      metaKeywords: ['Haion', 'EV', 'electronics'],
    },
  },
  sections: {
    home: {
      hero: {
        primaryCtaLabel: 'Request a call back',
        primaryCtaUrl: '#download',
        secondaryCtaLabel: 'Book a testride',
        secondaryCtaUrl: '#download',
        activeDotColor: '#facc15',
      },
      features: {
        badge: 'Why Choose Us',
        title: 'Designed for Elite Shoppers',
        subtitle:
          'Every aspect of the Haion Mobile App is engineered to deliver a premium, frictionless shopping experience for electronics enthusiasts.',
      },
      contact: {
        badge: 'Get In Touch',
        title: "We'd Love to Chat",
        subtitle: 'Have questions about partnerships, bulk orders, or product support? Reach out anytime.',
        email: 'ev@haion.co.in',
        phone: '02269622645',
        address: 'D-46, SECTOR-10, Noida, Uttar Pradesh 201301',
        submitLabel: 'Send Message',
      },
    },
  },
  collections: {
    'hero-slides': [],
    statistics: [],
    features: [],
    categories: [],
    testimonials: [],
    faqs: [],
  },
};

export function pickCms(defaults, value) {
  if (value === undefined || value === null) return defaults;
  if (typeof value === 'string' && value.trim() === '') return defaults;
  return value;
}

export function getSectionContent(sections, page, sectionKey, field, fallback) {
  const section = sections?.find?.((s) => s.page === page && s.sectionKey === sectionKey);
  const val = section?.content?.[field];
  return pickCms(fallback, val);
}

export function getCollectionData(items) {
  return (items ?? [])
    .filter((i) => i.isVisible !== false)
    .map((i) => {
      const raw = i.data ?? i;
      if (raw?.data && typeof raw.data === 'object' && !raw.title && !raw.name && !raw.question) {
        return raw.data;
      }
      return raw;
    });
}
