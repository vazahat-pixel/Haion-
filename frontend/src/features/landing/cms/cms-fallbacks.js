import {
  statsData,
  featuresData,
  categoriesData,
  appExperienceScreens,
  stepsData,
  testimonialsData,
  faqsData,
} from '../data/mockData';
import { DEFAULT_STORE_CONFIG } from '../data/storeConfig';

/** Static fallbacks when API returns empty — keeps site working offline */
export const CMS_FALLBACKS = {
  'hero-slides': [
    {
      tag: 'Introducing Haion BaaS',
      title: "It's easy on a Haion.",
      price: '₹ 75,999*',
      subtitle: 'With Battery as a Service, buy Haion starting at ₹ 75,999*',
      accentColor: 'from-zinc-950 to-amber-500',
      glowColor: 'rgba(99, 102, 241, 0.15)',
      bgImage: '/haban.webp',
      details: [
        { label: 'Rough roads', val: 'Tackled smoothly' },
        { label: 'Parked vehicle movement alerts', val: 'Active notifications' },
        { label: 'Google maps on dashboard', val: 'Live navigation' },
      ],
    },
  ],
  statistics: statsData,
  features: featuresData,
  categories: categoriesData,
  'app-experience-steps': appExperienceScreens.slice(0, 4),
  'advantage-cards': [
    { title: 'Nationwide Charging Grids', desc: 'Access over 5,900+ high-speed EV charging stations across the country.', image: '/sc012.webp' },
    { title: '3-Year Battery Warranty', desc: 'Ride with ultimate confidence knowing your battery is covered.', image: '/sc011.webp' },
    { title: 'Smart Buyback Options', desc: 'Upgrade effortlessly to newer models with assured buyback value.', image: '/sc013.webp' },
  ],
  'why-choose-items': [
    { icon: 'zap', title: 'Eco-Friendly Mobility', desc: 'Our electric vehicles run on next-gen clean-energy batteries with Zero Emission standards.' },
    { icon: 'cpu', title: 'Advanced Smart IoT', desc: 'Seamlessly connect and control all EV parameters and home appliances from the Haion app.' },
    { icon: 'dollar', title: 'Factory-Direct Pricing', desc: 'We ship directly from our factories, passing the savings to you.' },
    { icon: 'life-buoy', title: '24/7 Premium Support', desc: 'Rapid assistance and 1-year direct manufacturer warranty on every purchase.' },
  ],
  'how-it-steps': stepsData,
  testimonials: testimonialsData,
  faqs: faqsData,
  products: [],
  services: [],
  'pricing-plans': [],
  'team-members': [],
  partners: [],
  'portfolio-items': [],
  'gallery-items': [],
  'blog-posts': [],
};

export const CMS_STORE_FALLBACK = DEFAULT_STORE_CONFIG;
