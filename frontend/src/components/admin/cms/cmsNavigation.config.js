import {
  Settings, Home, Store, Users, Refrigerator, Zap, Layers,
  Image, MessageSquare, ShoppingBag, HelpCircle, Star, Layout,
  Globe, BarChart3, Sparkles, Phone, Download, Tag, Shield,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const CMS_PAGE_GROUPS = [
  {
    id: 'global',
    title: 'Global Website Settings',
    description: 'Logo, contact info, theme colors, SEO, checkout & commerce',
    items: [
      {
        label: 'Website Settings',
        description: 'Company info, navbar, footer, theme, SEO, checkout, lead popup',
        href: ROUTES.ADMIN_CMS_SETTINGS,
        icon: Settings,
        color: 'bg-violet-500/10 text-violet-600',
      },
    ],
  },
  {
    id: 'pages',
    title: 'Page Content — Section by Section',
    description: 'Edit every visible section on each page of your website',
    items: [
      {
        label: 'Home Page',
        description: 'Hero, Features, Categories, Testimonials, FAQ, Contact & more',
        href: ROUTES.ADMIN_CMS_PAGES_HOME,
        icon: Home,
        color: 'bg-amber-500/10 text-amber-600',
        page: 'home',
        sectionCount: 17,
      },
      {
        label: 'Store Page',
        description: 'Store hero, warranty, showroom, dealer program, gallery',
        href: ROUTES.ADMIN_CMS_PAGES_STORE,
        icon: Store,
        color: 'bg-blue-500/10 text-blue-600',
        page: 'store',
        sectionCount: 4,
      },
      {
        label: 'About Us Page',
        description: 'Story cards, leadership, founder journey, careers CTA',
        href: ROUTES.ADMIN_CMS_PAGES_ABOUT,
        icon: Users,
        color: 'bg-emerald-500/10 text-emerald-600',
        page: 'about',
        sectionCount: 7,
      },
      {
        label: 'Home Appliances',
        description: 'Hero, product sections, pricing tables, IoT features',
        href: ROUTES.ADMIN_CMS_PAGES_APPLIANCES,
        icon: Refrigerator,
        color: 'bg-cyan-500/10 text-cyan-600',
        page: 'appliances',
        sectionCount: 2,
      },
      {
        label: 'Inverter Page',
        description: 'Hero banner and inverter product grid headings',
        href: ROUTES.ADMIN_CMS_PAGES_INVERTER,
        icon: Zap,
        color: 'bg-orange-500/10 text-orange-600',
        page: 'inverter',
        sectionCount: 1,
      },
    ],
  },
  {
    id: 'collections',
    title: 'Content Collections',
    description: 'Repeatable items — products, FAQs, testimonials, hero slides, services',
    items: [
      {
        label: 'All Collections',
        description: 'Hero slides, products, FAQs, services, team, gallery & more',
        href: ROUTES.ADMIN_CMS_COLLECTIONS,
        icon: Layers,
        color: 'bg-indigo-500/10 text-indigo-600',
      },
    ],
  },
];

export const CMS_COLLECTION_GROUPS = [
  {
    title: 'Home Page Content',
    description: 'Items displayed on the main landing page',
    collections: [
      { key: 'hero-slides', label: 'Hero Carousel Slides', icon: Image, description: 'Main banner slides with images, titles & CTAs' },
      { key: 'statistics', label: 'Trust Statistics', icon: BarChart3, description: 'Customer count, orders, cities, app rating' },
      { key: 'features', label: 'Feature Cards', icon: Sparkles, description: 'Why choose us feature highlights' },
      { key: 'categories', label: 'Product Categories', icon: Layout, description: 'Category cards with images and sub-products' },
      { key: 'app-experience-steps', label: 'App Experience Steps', icon: Phone, description: 'Mobile app feature walkthrough steps' },
      { key: 'advantage-cards', label: 'Haion Advantage Cards', icon: Star, description: 'Advantage section image cards' },
      { key: 'why-choose-items', label: 'Why Choose Haion Items', icon: Shield, description: 'Reason cards with icons' },
      { key: 'how-it-steps', label: 'How It Works Steps', icon: Layers, description: 'Onboarding flow steps' },
      { key: 'testimonials', label: 'Customer Testimonials', icon: MessageSquare, description: 'Reviews and ratings from customers' },
      { key: 'faqs', label: 'Frequently Asked Questions', icon: HelpCircle, description: 'FAQ accordion items' },
      { key: 'partners', label: 'Brand Partners', icon: Tag, description: 'Partner brand logos / names marquee' },
      { key: 'pricing-plans', label: 'Offers & Deals', icon: Tag, description: 'Limited-time offer cards' },
    ],
  },
  {
    title: 'Products & Services',
    description: 'Catalog items shown across the website',
    collections: [
      { key: 'products', label: 'All Products', icon: ShoppingBag, description: 'EV scooters, appliances, inverters — full catalog' },
      { key: 'services', label: 'EV Services', icon: Zap, description: 'Scooter, battery, charger, safeguard service pages' },
    ],
  },
  {
    title: 'About & Store',
    description: 'Team, gallery and store content',
    collections: [
      { key: 'team-members', label: 'Leadership Team', icon: Users, description: 'Team member names, roles, photos' },
      { key: 'gallery-items', label: 'Photo Gallery', icon: Image, description: 'Store and product gallery images' },
      { key: 'blog-posts', label: 'Blog Posts', icon: MessageSquare, description: 'Blog articles and news' },
      { key: 'portfolio-items', label: 'Portfolio Items', icon: Layout, description: 'Project showcase items' },
    ],
  },
];

/** Metadata for section keys — used in page manager UI */
export const SECTION_META = {
  hero: { icon: Image, collection: 'hero-slides', hint: 'Slides managed in Collections → Hero Slides' },
  'trust-stats': { icon: BarChart3, collection: 'statistics', hint: 'Stats managed in Collections → Statistics' },
  features: { icon: Sparkles, collection: 'features', hint: 'Cards in Collections → Features' },
  categories: { icon: Layout, collection: 'categories', hint: 'Categories in Collections → Categories' },
  'who-we-are': { icon: Users, hint: 'Edit company story text and image' },
  'app-experience': { icon: Phone, collection: 'app-experience-steps', hint: 'Steps in Collections → App Experience' },
  'haion-advantage': { icon: Star, collection: 'advantage-cards', hint: 'Cards in Collections → Advantage Cards' },
  'products-tabs': { icon: ShoppingBag, collection: 'products', hint: 'Products in Collections → All Products' },
  'why-choose-haion': { icon: Shield, collection: 'why-choose-items', hint: 'Items in Collections → Why Choose Items' },
  'how-it-works': { icon: Layers, collection: 'how-it-steps', hint: 'Steps in Collections → How It Works' },
  testimonials: { icon: MessageSquare, collection: 'testimonials', hint: 'Reviews in Collections → Testimonials' },
  faq: { icon: HelpCircle, collection: 'faqs', hint: 'Questions in Collections → FAQs' },
  contact: { icon: Phone, hint: 'Contact form labels and info' },
  brands: { icon: Tag, collection: 'partners', hint: 'Brands in Collections → Partners' },
  'download-cta': { icon: Download, hint: 'App download section copy' },
  offers: { icon: Tag, collection: 'pricing-plans', hint: 'Offers in Collections → Offers & Deals' },
  'scroll-sequence': { icon: Image, hint: 'Cinematic scroll animation overlays' },
  'store-hero': { icon: Store, hint: 'Store page hero banner' },
  'store-config': { icon: Store, hint: 'Warranty, showroom, dealer program content' },
  'store-extras': { icon: Store, hint: 'Store highlights and extra images' },
  'store-gallery': { icon: Image, collection: 'gallery-items', hint: 'Gallery in Collections → Photo Gallery' },
  'about-hero': { icon: Users, hint: 'About page hero banner' },
  'about-cards': { icon: Users, hint: 'Story cards with images' },
  'about-leadership': { icon: Users, collection: 'team-members', hint: 'Team in Collections → Leadership Team' },
  'about-journey': { icon: Users, hint: 'Founder journey paragraphs' },
  'about-founder': { icon: Users, hint: 'Founder message and quote' },
  'about-careers': { icon: Users, hint: 'Careers call-to-action' },
  'about-tagline': { icon: Users, hint: 'Brand tagline and film strip' },
  'appliances-hero': { icon: Refrigerator, hint: 'Appliances page hero banner' },
  'appliances-sections': { icon: Refrigerator, collection: 'products', hint: 'Section titles, pricing tables, IoT block' },
  'inverter-hero': { icon: Zap, collection: 'products', hint: 'Inverter page hero and grid title' },
};

export function getSectionPreview(content = {}) {
  if (!content || typeof content !== 'object') return 'No content yet';
  const keys = ['title', 'heroTitle', 'badge', 'name', 'heading', 'tagline'];
  for (const k of keys) {
    if (content[k]) return String(content[k]).slice(0, 80);
  }
  if (content.paragraph1) return String(content.paragraph1).slice(0, 80);
  if (content.cards?.length) return `${content.cards.length} card(s)`;
  if (content.pricingTables) return 'Pricing tables configured';
  return Object.keys(content).length ? `${Object.keys(content).length} field(s) configured` : 'Empty — click Edit to add content';
}
