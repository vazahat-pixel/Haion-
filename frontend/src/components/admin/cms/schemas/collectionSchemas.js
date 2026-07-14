const subProductFields = [
  { key: 'name', type: 'text', label: 'Product Name' },
  { key: 'tag', type: 'text', label: 'Tag' },
  { key: 'price', type: 'text', label: 'Price' },
  { key: 'rating', type: 'text', label: 'Rating' },
];

const specFields = [
  { key: 'label', type: 'text', label: 'Spec Label' },
  { key: 'val', type: 'text', label: 'Spec Value' },
];

/** Collection type → field schema map */
export const COLLECTION_SCHEMAS = {
  'hero-slides': [
    { key: 'tag', type: 'text', label: 'Tag / Badge' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'price', type: 'text', label: 'Price / Highlight' },
    { key: 'subtitle', type: 'richtext', label: 'Subtitle' },
    { key: 'accentColor', type: 'text', label: 'Accent Gradient Classes', placeholder: 'from-zinc-950 to-amber-500' },
    { key: 'glowColor', type: 'text', label: 'Glow Color (rgba)', placeholder: 'rgba(99, 102, 241, 0.15)' },
    { key: 'bgImage', type: 'imageurl', label: 'Background Image' },
    {
      key: 'details',
      type: 'repeater',
      label: 'Feature Ticker Items',
      fields: specFields,
      defaultItem: { label: '', val: '' },
    },
  ],

  statistics: [
    { key: 'value', type: 'number', label: 'Value' },
    { key: 'suffix', type: 'text', label: 'Suffix', placeholder: 'K+, M+, ★' },
    { key: 'label', type: 'text', label: 'Label' },
    { key: 'description', type: 'textarea', label: 'Description' },
  ],

  features: [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'description', type: 'richtext', label: 'Description' },
    {
      key: 'iconName',
      type: 'select',
      label: 'Icon',
      options: [
        { value: 'shield', label: 'Shield' },
        { value: 'tag', label: 'Tag' },
        { value: 'truck', label: 'Truck' },
        { value: 'lock', label: 'Lock' },
        { value: 'chat', label: 'Chat' },
        { value: 'zap', label: 'Zap' },
        { value: 'cpu', label: 'CPU' },
        { value: 'dollar', label: 'Dollar' },
        { value: 'life-buoy', label: 'Life Buoy' },
      ],
    },
  ],

  categories: [
    { key: 'id', type: 'text', label: 'Category ID' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'emoji', type: 'text', label: 'Emoji' },
    { key: 'description', type: 'textarea', label: 'Short Description' },
    { key: 'count', type: 'text', label: 'Count Badge' },
    { key: 'gradient', type: 'text', label: 'Gradient Classes' },
    { key: 'color', type: 'color', label: 'Theme Color' },
    { key: 'subtitle', type: 'text', label: 'Subtitle' },
    { key: 'longDescription', type: 'richtext', label: 'Long Description' },
    { key: 'features', type: 'stringlist', label: 'Features' },
    {
      key: 'subProducts',
      type: 'repeater',
      label: 'Sub Products',
      fields: subProductFields,
      defaultItem: { name: '', tag: '', price: '', rating: '' },
    },
    { key: 'image', type: 'imageurl', label: 'Category Image' },
  ],

  'app-experience-steps': [
    { key: 'id', type: 'text', label: 'Step ID' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'description', type: 'richtext', label: 'Description' },
    { key: 'badge', type: 'text', label: 'Badge' },
  ],

  'advantage-cards': [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'desc', type: 'richtext', label: 'Description' },
    { key: 'image', type: 'imageurl', label: 'Card Image' },
  ],

  products: [
    { key: 'id', type: 'text', label: 'Product ID / Slug' },
    { key: 'name', type: 'text', label: 'Product Name' },
    { key: 'subtitle', type: 'textarea', label: 'Short Description' },
    { key: 'price', type: 'text', label: 'Price' },
    { key: 'salePrice', type: 'text', label: 'Sale Price' },
    { key: 'tag', type: 'text', label: 'Tag / Badge' },
    {
      key: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { value: 'evs', label: 'Electric Vehicles' },
        { value: 'appliances', label: 'Home Appliances' },
        { value: 'inverters', label: 'Inverters' },
      ],
    },
    { key: 'brand', type: 'text', label: 'Brand' },
    { key: 'sku', type: 'text', label: 'SKU' },
    { key: 'barcode', type: 'text', label: 'Barcode' },
    { key: 'stock', type: 'number', label: 'Stock Quantity' },
    { key: 'discount', type: 'text', label: 'Discount' },
    { key: 'image', type: 'imageurl', label: 'Thumbnail Image' },
    { key: 'images', type: 'stringlist', label: 'Gallery Images', placeholder: '/product.webp' },
    { key: 'colors', type: 'stringlist', label: 'Available Colors' },
    { key: 'specs', type: 'keyvalue', label: 'Specifications' },
    { key: 'features', type: 'stringlist', label: 'Key Features' },
    { key: 'highlights', type: 'stringlist', label: 'Highlights' },
    { key: 'warranty', type: 'text', label: 'Warranty' },
    { key: 'link', type: 'text', label: 'Product Link' },
    { key: 'seoTitle', type: 'text', label: 'SEO Title' },
    { key: 'seoDescription', type: 'textarea', label: 'SEO Description' },
    { key: 'metaKeywords', type: 'tags', label: 'Meta Keywords' },
    { key: 'featured', type: 'switch', label: 'Featured Product' },
    { key: 'trending', type: 'switch', label: 'Trending' },
    { key: 'bestSeller', type: 'switch', label: 'Best Seller' },
    { key: 'newArrival', type: 'switch', label: 'New Arrival' },
    { key: 'status', type: 'select', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }] },
  ],

  'why-choose-items': [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'desc', type: 'richtext', label: 'Description' },
    {
      key: 'icon',
      type: 'select',
      label: 'Icon',
      options: [
        { value: 'zap', label: 'Zap' },
        { value: 'cpu', label: 'CPU' },
        { value: 'dollar', label: 'Dollar' },
        { value: 'life-buoy', label: 'Life Buoy' },
      ],
    },
  ],

  'how-it-steps': [
    { key: 'step', type: 'text', label: 'Step Number' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'description', type: 'richtext', label: 'Description' },
  ],

  testimonials: [
    { key: 'quote', type: 'richtext', label: 'Quote' },
    { key: 'rating', type: 'number', label: 'Rating (1-5)' },
    { key: 'name', type: 'text', label: 'Customer Name' },
    { key: 'role', type: 'text', label: 'Role / Title' },
    { key: 'avatar', type: 'text', label: 'Avatar Emoji' },
  ],

  faqs: [
    { key: 'question', type: 'text', label: 'Question' },
    { key: 'answer', type: 'richtext', label: 'Answer' },
  ],

  services: [
    { key: 'id', type: 'text', label: 'Service ID' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'subtitle', type: 'text', label: 'Subtitle' },
    { key: 'description', type: 'richtext', label: 'Description' },
    {
      key: 'iconName',
      type: 'select',
      label: 'Icon',
      options: [
        { value: 'shield', label: 'Shield' },
        { value: 'zap', label: 'Zap' },
        { value: 'battery', label: 'Battery' },
        { value: 'cpu', label: 'CPU / Charger' },
        { value: 'truck', label: 'Truck' },
      ],
    },
  ],

  'pricing-plans': [
    { key: 'title', type: 'text', label: 'Offer Title' },
    { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
    { key: 'tag', type: 'text', label: 'Tag' },
    { key: 'badge', type: 'text', label: 'Badge' },
    { key: 'gradient', type: 'text', label: 'Gradient Classes' },
    { key: 'actionText', type: 'text', label: 'Action Button Text' },
    { key: 'timeRemaining', type: 'text', label: 'Time Remaining Text' },
  ],

  'team-members': [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'role', type: 'text', label: 'Role' },
    { key: 'initials', type: 'text', label: 'Initials' },
    { key: 'image', type: 'imageurl', label: 'Photo' },
    { key: 'bio', type: 'richtext', label: 'Bio' },
  ],

  partners: [
    { key: 'name', type: 'text', label: 'Partner Name' },
    { key: 'label', type: 'text', label: 'Display Label' },
    { key: 'logo', type: 'imageurl', label: 'Logo' },
    { key: 'url', type: 'text', label: 'Website URL' },
  ],

  'portfolio-items': [
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'description', type: 'richtext', label: 'Description' },
    { key: 'image', type: 'imageurl', label: 'Image' },
    { key: 'category', type: 'text', label: 'Category' },
    { key: 'url', type: 'text', label: 'Project URL' },
  ],

  'gallery-items': [
    { key: 'id', type: 'number', label: 'ID' },
    { key: 'category', type: 'text', label: 'Category' },
    { key: 'src', type: 'imageurl', label: 'Image' },
    { key: 'title', type: 'text', label: 'Title' },
    { key: 'desc', type: 'richtext', label: 'Description' },
  ],

  'blog-posts': [
    { key: 'title', type: 'text', label: 'Post Title' },
    { key: 'slug', type: 'text', label: 'URL Slug' },
    { key: 'excerpt', type: 'textarea', label: 'Excerpt' },
    { key: 'content', type: 'richtext', label: 'Content' },
    { key: 'coverImage', type: 'imageurl', label: 'Cover Image' },
    { key: 'author', type: 'text', label: 'Author' },
    { key: 'publishedAt', type: 'text', label: 'Publish Date' },
    { key: 'tags', type: 'tags', label: 'Tags' },
    { key: 'seoTitle', type: 'text', label: 'SEO Title' },
    { key: 'seoDescription', type: 'textarea', label: 'SEO Description' },
  ],
};

export function getCollectionSchema(collection) {
  return COLLECTION_SCHEMAS[collection] ?? null;
}

export const COLLECTION_LABELS = {
  'hero-slides': 'Hero Slides',
  statistics: 'Statistics',
  features: 'Features',
  categories: 'Categories',
  'app-experience-steps': 'App Experience Steps',
  'advantage-cards': 'Advantage Cards',
  products: 'Products',
  'why-choose-items': 'Why Choose Items',
  'how-it-steps': 'How It Works Steps',
  testimonials: 'Testimonials',
  faqs: 'FAQs',
  services: 'Services',
  'pricing-plans': 'Pricing / Offers',
  'team-members': 'Team Members',
  partners: 'Partners / Brands',
  'portfolio-items': 'Portfolio Items',
  'gallery-items': 'Gallery Items',
  'blog-posts': 'Blog Posts',
};
