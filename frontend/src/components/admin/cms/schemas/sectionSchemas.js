/** Shared field groups reused across section schemas */

export const sectionHeadingFields = [
  { key: 'badge', type: 'text', label: 'Badge Text' },
  { key: 'title', type: 'text', label: 'Title' },
  { key: 'subtitle', type: 'richtext', label: 'Subtitle / Description' },
];

export const ctaFields = [
  { key: 'primaryCtaLabel', type: 'text', label: 'Primary Button Text' },
  { key: 'primaryCtaUrl', type: 'text', label: 'Primary Button URL', placeholder: '#download' },
  { key: 'secondaryCtaLabel', type: 'text', label: 'Secondary Button Text' },
  { key: 'secondaryCtaUrl', type: 'text', label: 'Secondary Button URL', placeholder: '#download' },
];

const detailItemFields = [
  { key: 'label', type: 'text', label: 'Label' },
  { key: 'val', type: 'text', label: 'Value' },
];

const featureItemFields = [
  { key: 'id', type: 'text', label: 'ID' },
  { key: 'title', type: 'text', label: 'Title' },
  { key: 'description', type: 'richtext', label: 'Description' },
];

const warrantyCardFields = [
  { key: 'id', type: 'text', label: 'ID' },
  { key: 'title', type: 'text', label: 'Component' },
  { key: 'duration', type: 'text', label: 'Duration' },
  { key: 'coverage', type: 'text', label: 'Coverage' },
];

const dealerPlanFields = [
  { key: 'id', type: 'text', label: 'ID' },
  { key: 'level', type: 'text', label: 'Level' },
  { key: 'investment', type: 'text', label: 'Investment' },
  { key: 'requirement', type: 'text', label: 'Requirement' },
];

const showroomImageFields = [
  { key: 'id', type: 'text', label: 'ID' },
  { key: 'src', type: 'imageurl', label: 'Image' },
  { key: 'title', type: 'text', label: 'Title' },
  { key: 'location', type: 'text', label: 'Location' },
];

const aboutCardFields = [
  { key: 'title', type: 'text', label: 'Card Title' },
  { key: 'image', type: 'imageurl', label: 'Image' },
  { key: 'alt', type: 'text', label: 'Image Alt Text' },
  { key: 'body', type: 'richtext', label: 'Body Text' },
];

const storeHighlightFields = [
  { key: 'icon', type: 'text', label: 'Icon Name', helpText: 'Lucide icon name e.g. map-pin' },
  { key: 'title', type: 'text', label: 'Title' },
  { key: 'desc', type: 'textarea', label: 'Description' },
];

const storeImageFields = [
  { key: 'src', type: 'imageurl', label: 'Image' },
  { key: 'title', type: 'text', label: 'Title' },
  { key: 'location', type: 'text', label: 'Location' },
  { key: 'desc', type: 'textarea', label: 'Description' },
];

/** Section key → field schema map */
export const SECTION_SCHEMAS = {
  hero: [
    ...ctaFields,
    { key: 'activeDotColor', type: 'color', label: 'Active Slide Dot Color' },
    {
      key: '_info',
      type: 'info',
      label: 'Hero Slides',
      helpText: 'Hero carousel slides are managed under Collections → Hero Slides.',
    },
  ],

  'trust-stats': [
    {
      key: '_info',
      type: 'info',
      label: 'Statistics',
      helpText: 'Statistics are managed under Collections → Statistics. Use this section to show/hide the block on the homepage.',
    },
  ],

  features: [...sectionHeadingFields],
  categories: [...sectionHeadingFields],

  'who-we-are': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'paragraph1', type: 'richtext', label: 'Paragraph 1' },
    { key: 'paragraph2', type: 'richtext', label: 'Paragraph 2' },
    { key: 'image', type: 'image', label: 'Section Image' },
  ],

  'app-experience': [
    ...sectionHeadingFields,
    { key: 'centerTitle', type: 'text', label: 'Center Circle Title' },
    { key: 'centerBody', type: 'richtext', label: 'Center Circle Description' },
  ],

  'haion-advantage': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'titleLine1', type: 'text', label: 'Title Line 1' },
    { key: 'titleLine2', type: 'text', label: 'Title Line 2' },
  ],

  'products-tabs': [
    { key: 'tabEv', type: 'text', label: 'EV Tab Label' },
    { key: 'tabAppliances', type: 'text', label: 'Appliances Tab Label' },
    { key: 'specialPriceLabel', type: 'text', label: 'Special Price Label' },
    { key: 'viewDetailsLabel', type: 'text', label: 'View Details Button Text' },
  ],

  'why-choose-haion': [...sectionHeadingFields],
  'how-it-works': [...sectionHeadingFields],
  testimonials: [...sectionHeadingFields],
  faq: [...sectionHeadingFields],

  contact: [
    ...sectionHeadingFields,
    { key: 'infoHeading', type: 'text', label: 'Info Box Heading' },
    { key: 'infoBody', type: 'richtext', label: 'Info Box Body' },
    { key: 'emailLabel', type: 'text', label: 'Email Label' },
    { key: 'email', type: 'text', label: 'Email Address' },
    { key: 'phoneLabel', type: 'text', label: 'Phone Label' },
    { key: 'phone', type: 'text', label: 'Phone Number' },
    { key: 'hqLabel', type: 'text', label: 'HQ Label' },
    { key: 'address', type: 'textarea', label: 'Address' },
    { key: 'responseTime', type: 'text', label: 'Response Time Badge' },
    { key: 'formHeading', type: 'text', label: 'Form Heading' },
    { key: 'formNameLabel', type: 'text', label: 'Name Field Label' },
    { key: 'formNamePlaceholder', type: 'text', label: 'Name Placeholder' },
    { key: 'formEmailLabel', type: 'text', label: 'Email Field Label' },
    { key: 'formEmailPlaceholder', type: 'text', label: 'Email Placeholder' },
    { key: 'formMessageLabel', type: 'text', label: 'Message Field Label' },
    { key: 'formMessagePlaceholder', type: 'text', label: 'Message Placeholder' },
    { key: 'submitLabel', type: 'text', label: 'Submit Button Text' },
    { key: 'submittingLabel', type: 'text', label: 'Submitting Text' },
    { key: 'successMessage', type: 'text', label: 'Success Message' },
  ],

  brands: [
    ...sectionHeadingFields,
    { key: 'speed', type: 'number', label: 'Marquee Speed (seconds)' },
  ],

  'download-cta': [
    ...sectionHeadingFields,
    { key: 'benefits', type: 'stringlist', label: 'Benefits List', placeholder: 'Enter benefit' },
    { key: 'appStoreUrl', type: 'text', label: 'App Store URL' },
    { key: 'playStoreUrl', type: 'text', label: 'Play Store URL' },
  ],

  offers: [...sectionHeadingFields],
  'scroll-sequence': [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
    { key: 'frames', type: 'stringlist', label: 'Animation Frame Images', placeholder: '/frame.webp' },
  ],

  'store-hero': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'heroTitle', type: 'text', label: 'Hero Title' },
    { key: 'heroSubtitle', type: 'richtext', label: 'Hero Subtitle' },
  ],

  'store-config': [
    {
      key: 'brandContent',
      type: 'group',
      label: 'Brand Section',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'description', type: 'richtext', label: 'Description' },
        {
          key: 'features',
          type: 'repeater',
          label: 'Brand Features',
          fields: featureItemFields,
          defaultItem: { id: '', title: '', description: '' },
        },
      ],
    },
    {
      key: 'productRange',
      type: 'group',
      label: 'Product Range',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'description', type: 'richtext', label: 'Description' },
      ],
    },
    {
      key: 'warrantyInfo',
      type: 'group',
      label: 'Warranty Information',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'description', type: 'richtext', label: 'Description' },
        {
          key: 'cards',
          type: 'repeater',
          label: 'Warranty Cards',
          fields: warrantyCardFields,
          defaultItem: { id: '', title: '', duration: '', coverage: '' },
        },
      ],
    },
    {
      key: 'warrantyTerms',
      type: 'group',
      label: 'Warranty Terms',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'covers', type: 'stringlist', label: 'What Warranty Covers' },
        { key: 'exclusions', type: 'stringlist', label: 'Exclusions' },
        { key: 'note', type: 'textarea', label: 'Note' },
      ],
    },
    {
      key: 'showroomInfo',
      type: 'group',
      label: 'Showroom Network',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'description', type: 'richtext', label: 'Description' },
        { key: 'features', type: 'stringlist', label: 'Feature Highlights' },
        {
          key: 'images',
          type: 'repeater',
          label: 'Showroom Images',
          fields: showroomImageFields,
          defaultItem: { id: '', src: '', title: '', location: '' },
        },
      ],
    },
    {
      key: 'dealerInfo',
      type: 'group',
      label: 'Dealer Program',
      fields: [
        { key: 'heading', type: 'text', label: 'Heading' },
        { key: 'description', type: 'richtext', label: 'Description' },
        {
          key: 'plans',
          type: 'repeater',
          label: 'Dealer Plans',
          fields: dealerPlanFields,
          defaultItem: { id: '', level: '', investment: '', requirement: '' },
        },
        { key: 'benefits', type: 'stringlist', label: 'Dealer Benefits' },
      ],
    },
    {
      key: 'banners',
      type: 'group',
      label: 'Banners',
      fields: [
        { key: 'heroTitle', type: 'text', label: 'Hero Title' },
        { key: 'heroSubtitle', type: 'richtext', label: 'Hero Subtitle' },
      ],
    },
  ],

  'store-extras': [
    {
      key: 'storeHighlights',
      type: 'repeater',
      label: 'Store Highlights',
      fields: storeHighlightFields,
      defaultItem: { icon: 'map-pin', title: '', desc: '' },
    },
    {
      key: 'storeImages',
      type: 'repeater',
      label: 'Store Images',
      fields: storeImageFields,
      defaultItem: { src: '', title: '', location: '', desc: '' },
    },
    {
      key: 'storeLocations',
      type: 'repeater',
      label: 'Store Locations',
      fields: [
        { key: 'city', type: 'text', label: 'City' },
        { key: 'address', type: 'textarea', label: 'Address' },
        { key: 'phone', type: 'text', label: 'Phone' },
        { key: 'timings', type: 'text', label: 'Timings' },
      ],
      defaultItem: { city: '', address: '', phone: '', timings: '' },
    },
  ],

  'store-gallery': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'filters', type: 'stringlist', label: 'Gallery Filters', placeholder: 'Filter name' },
  ],

  'about-hero': [...sectionHeadingFields],

  'about-cards': [
    {
      key: 'cards',
      type: 'repeater',
      label: 'Story Cards',
      fields: aboutCardFields,
      defaultItem: { title: '', image: '', alt: '', body: '' },
    },
  ],

  'about-leadership': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    {
      key: '_info',
      type: 'info',
      label: 'Team Members',
      helpText: 'Team members are managed under Collections → Team Members.',
    },
  ],

  'about-journey': [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'paragraphs', type: 'stringlist', label: 'Story Paragraphs', placeholder: 'Enter paragraph' },
  ],

  'about-founder': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'quote', type: 'richtext', label: 'Quote' },
    { key: 'name', type: 'text', label: 'Founder Name' },
    { key: 'role', type: 'text', label: 'Role' },
    { key: 'initials', type: 'text', label: 'Initials' },
    { key: 'tagline', type: 'text', label: 'Tagline' },
  ],

  'about-careers': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'body', type: 'richtext', label: 'Description' },
    { key: 'ctaLabel', type: 'text', label: 'Button Text' },
  ],

  'about-tagline': [
    { key: 'text', type: 'text', label: 'Tagline Text' },
    { key: 'filmStrip', type: 'stringlist', label: 'Film Strip Ticker Items' },
  ],

  'appliances-hero': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'subtitle', type: 'richtext', label: 'Subtitle' },
    { key: 'gridTitle', type: 'text', label: 'Product Grid Title' },
  ],

  'appliances-sections': [
    { key: 'tv.title', type: 'text', label: 'TV Section Title' },
    { key: 'refrigerator.title', type: 'text', label: 'Refrigerator Section Title' },
    { key: 'mixer.title', type: 'text', label: 'Mixer Section Title' },
    { key: 'ac.title', type: 'text', label: 'AC Section Title' },
    { key: 'specialPriceLabel', type: 'text', label: 'Special Price Label' },
    { key: 'viewDetailsLabel', type: 'text', label: 'View Details Button Text' },
    {
      key: 'pricingTables.tv',
      type: 'group',
      label: 'LED TV Pricing Table',
      fields: [
        { key: 'title', type: 'text', label: 'Table Title' },
        { key: 'subtitle', type: 'textarea', label: 'Table Subtitle' },
        {
          key: 'rows',
          type: 'repeater',
          label: 'Pricing Rows',
          fields: [
            { key: 'model', type: 'text', label: 'Model' },
            { key: 'price', type: 'text', label: 'Price' },
            { key: 'mrp', type: 'text', label: 'MRP' },
            { key: 'desc', type: 'textarea', label: 'Description' },
          ],
          defaultItem: { model: '', price: '', mrp: '', desc: '' },
        },
      ],
    },
    {
      key: 'pricingTables.mixer',
      type: 'group',
      label: 'Mixer / Juicer Pricing Table',
      fields: [
        { key: 'title', type: 'text', label: 'Table Title' },
        { key: 'subtitle', type: 'textarea', label: 'Table Subtitle' },
        {
          key: 'rows',
          type: 'repeater',
          label: 'Pricing Rows',
          fields: [
            { key: 'model', type: 'text', label: 'Model' },
            { key: 'price', type: 'text', label: 'Price' },
            { key: 'mrp', type: 'text', label: 'MRP' },
            { key: 'desc', type: 'textarea', label: 'Description' },
          ],
          defaultItem: { model: '', price: '', mrp: '', desc: '' },
        },
      ],
    },
    {
      key: 'pricingTables.ac',
      type: 'group',
      label: 'Air Conditioner Pricing Table',
      fields: [
        { key: 'title', type: 'text', label: 'Table Title' },
        { key: 'subtitle', type: 'textarea', label: 'Table Subtitle' },
        {
          key: 'rows',
          type: 'repeater',
          label: 'Pricing Rows',
          fields: [
            { key: 'model', type: 'text', label: 'Model' },
            { key: 'price', type: 'text', label: 'Price' },
            { key: 'mrp', type: 'text', label: 'MRP' },
            { key: 'desc', type: 'textarea', label: 'Description' },
          ],
          defaultItem: { model: '', price: '', mrp: '', desc: '' },
        },
      ],
    },
    {
      key: 'iot',
      type: 'group',
      label: 'IoT Features Block',
      fields: [
        { key: 'title', type: 'text', label: 'Block Title' },
        { key: 'subtitle', type: 'textarea', label: 'Block Subtitle' },
        {
          key: 'features',
          type: 'repeater',
          label: 'Feature Cards',
          fields: [
            { key: 'title', type: 'text', label: 'Title' },
            { key: 'desc', type: 'textarea', label: 'Description' },
          ],
          defaultItem: { title: '', desc: '' },
        },
      ],
    },
  ],

  'inverter-hero': [
    { key: 'badge', type: 'text', label: 'Badge Text' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'subtitle', type: 'richtext', label: 'Subtitle' },
    { key: 'gridTitle', type: 'text', label: 'Product Grid Title' },
  ],
};

export function getSectionSchema(sectionKey) {
  return SECTION_SCHEMAS[sectionKey] ?? null;
}
