/**
 * CMS seed — mirrors all current landing website content (no lorem ipsum).
 * Used on first boot when CMS collections are empty.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsSeed = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'products.seed.json'), 'utf8')
);

const heroSlides = [
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
      { label: 'One press reverse', val: 'Reverse gear active' },
      { label: 'Brake without braking on slopes', val: 'Slope hold control' },
      { label: 'Share your live location', val: 'Continuous share' },
      { label: 'Stay connected with smart helmets', val: 'Bluetooth intercom' },
    ],
  },
  {
    tag: 'Haion Smart AC',
    title: 'Haion Smart AC. Silent cooling, maximum comfort.',
    price: 'Starting at ₹ 27,999*',
    subtitle: 'Experience 5-star energy efficient cooling with voice control and smart AI mode.',
    accentColor: 'from-blue-500 to-indigo-600',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    bgImage: '/haion_ac_banner.webp',
    details: [
      { label: '5-Star Energy Rating', val: 'High savings' },
      { label: 'Smart WiFi & Voice Control', val: 'Alexa & Google Assistant' },
      { label: 'Dual Inverter Compressor', val: 'Silent operation' },
      { label: 'PM 2.5 Air Filter', val: 'Pure air' },
    ],
  },
  {
    tag: 'Meet Haion',
    title: 'Meet Haion.',
    price: 'Loved by 3,0,000+ families',
    subtitle: 'A spacious electric scooter custom built for comfortable family rides.',
    accentColor: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.15)',
    bgImage: '/haban2.webp',
    details: [
      { label: 'Scooter of the year', val: 'Award winning' },
      { label: 'Now with touchscreen dashboard', val: 'Interactive display' },
      { label: 'New terracotta red colours', val: 'Vibrant designs' },
      { label: '70 km - 200 km range', val: 'Long battery life' },
      { label: 'HaionStack 7 updates', val: 'Smart software features' },
      { label: 'Most awarded scooter of the year', val: 'Top rated' },
      { label: 'Now with touchscreen dashboard', val: 'Dynamic control' },
    ],
  },
  {
    tag: 'Haion NeoFrost Fridge',
    title: 'Haion NeoFrost. Freshness that lasts.',
    price: 'Starting at ₹ 34,999*',
    subtitle: 'Convertible multi-zone cooling with smart sensor technology and premium glass finish.',
    accentColor: 'from-teal-500 to-emerald-600',
    glowColor: 'rgba(20, 184, 166, 0.15)',
    bgImage: '/haion_fridge_banner.webp',
    details: [
      { label: 'Convertible Triple Zone', val: 'Adjustable spacing' },
      { label: 'AI Intelli-Sense cooling', val: 'Smart adaptation' },
      { label: 'Premium glass-door finish', val: 'Elegant look' },
      { label: '10-Year compressor warranty', val: 'Durable performance' },
    ],
  },
  {
    tag: 'Infinite Cruise',
    title: 'Infinite Cruise. Infinitely better 450X',
    price: 'Cruise control. Reimagined for cities.',
    subtitle: 'Sleek and sporty performance with instant throttle response.',
    accentColor: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    bgImage: '/haban3.webp',
    details: [
      { label: 'HaionStack 7 updates', val: 'Smart software updates' },
      { label: '100 km/h top speed', val: 'Hyperfast sport mode' },
      { label: '0-40 km/h in 2.9 sec', val: 'Instant acceleration' },
      { label: 'Bold & beautiful design', val: 'Aesthetic styling' },
      { label: 'Infinite cruise', val: 'Auto speed lock' },
      { label: 'HaionStack 7 updates', val: 'Connected features' },
      { label: '100 km/h top speed', val: 'Highway ready' },
    ],
  },
  {
    tag: 'Haion Cinematic LED TV',
    title: 'Haion Cinematic LED. Colors come alive.',
    price: 'Starting at ₹ 42,999*',
    subtitle: '4K Ultra HD QLED display with Dolby Vision, Atmos, and hands-free Google Assistant.',
    accentColor: 'from-rose-500 to-red-600',
    glowColor: 'rgba(244, 63, 94, 0.15)',
    bgImage: '/haion_led_banner.webp',
    details: [
      { label: '4K QLED Dolby Vision', val: 'True colors' },
      { label: '120Hz Refresh Rate', val: 'Ultra smooth action' },
      { label: 'Dolby Atmos sound system', val: 'Theater experience' },
      { label: 'Google TV platform', val: 'All smart apps' },
    ],
  },
  {
    tag: 'Haion Junior Helmets',
    title: 'Haion Junior Helmets',
    price: 'Bestest friend for every ride',
    subtitle: 'Keep your little ones completely safe with cute, animal-themed smart helmets.',
    accentColor: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    bgImage: '/haban4.webp',
    details: [
      { label: 'Safety rated', val: 'Certified protection' },
      { label: 'Bluetooth enabled', val: 'Voice calls available' },
      { label: 'Interactive animal shapes', val: 'Bee, Unicorn, Galaxy' },
      { label: 'Lightweight build', val: 'Kid-friendly comfort' },
      { label: 'Intercom communication', val: 'Pillion link active' },
      { label: 'Reflective elements', val: 'High night visibility' },
      { label: 'Stay connected with smart helmets', val: 'Haion link' },
    ],
  },
  {
    tag: 'Haion HyperCharge',
    title: 'Haion HyperCharge. Charge in minutes.',
    price: 'Included with every vehicle',
    subtitle: 'Smart home charging with auto-cut-off, surge protection, and mobile app sync.',
    accentColor: 'from-amber-400 to-yellow-500',
    glowColor: 'rgba(234, 179, 8, 0.15)',
    bgImage: '/haion_charger_banner.webp',
    details: [
      { label: 'Smart App integration', val: 'Remote monitor' },
      { label: 'Overvoltage protection', val: 'Secure charging' },
      { label: 'Compact weather-proof design', val: 'IP66 rated' },
      { label: 'Fast charging technology', val: 'Rapid charge' },
    ],
  },
  {
    tag: 'Haion SmartGrind',
    title: 'Haion SmartGrind. Effortless blending.',
    price: 'Starting at ₹ 4,999*',
    subtitle: 'High-torque copper motor with hands-free grinding and smart speed control.',
    accentColor: 'from-orange-500 to-amber-600',
    glowColor: 'rgba(249, 115, 22, 0.15)',
    bgImage: '/haion_mixer_grinder_banner.webp',
    details: [
      { label: '1000W High Torque Motor', val: 'Powerful grinding' },
      { label: 'Stainless Steel Jars', val: 'Durable design' },
      { label: 'Hands-free lid lock', val: 'Extra safety' },
      { label: 'Variable speed control', val: 'Perfect textures' },
    ],
  },
  {
    tag: 'Haion AquaDrive',
    title: 'Haion AquaDrive. Gentle on clothes.',
    price: 'Starting at ₹ 24,999*',
    subtitle: 'Direct drive motor with steam wash hygiene and smart smartphone diagnostics.',
    accentColor: 'from-sky-500 to-blue-600',
    glowColor: 'rgba(14, 165, 233, 0.15)',
    bgImage: '/haion_washing_machine_banner.webp',
    details: [
      { label: 'Direct Drive Technology', val: 'Super quiet' },
      { label: '99.9% Hygienic Steam Clean', val: 'Bacteria removal' },
      { label: 'Smart diagnosis via app', val: 'Instant support' },
      { label: '10-Year motor warranty', val: 'Reliable build' },
    ],
  },
];

function mapCollection(collection, items, orderStart = 0) {
  return items.map((data, i) => ({
    collection,
    order: orderStart + i,
    isVisible: true,
    data,
  }));
}

export function getCmsSeedPayload() {
  const settings = {
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
    socialLinks: [
      { platform: 'facebook', url: '#', icon: 'facebook', isVisible: true, order: 0 },
      { platform: 'twitter', url: '#', icon: 'twitter', isVisible: true, order: 1 },
      { platform: 'instagram', url: '#', icon: 'instagram', isVisible: true, order: 2 },
      { platform: 'youtube', url: '#', icon: 'youtube', isVisible: true, order: 3 },
    ],
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
    navbar: {
      links: [
        { label: 'Home', url: '#', order: 0, isVisible: true },
        { label: 'Store', url: 'store', order: 1, isVisible: true },
        { label: 'About Us', url: 'about', order: 2, isVisible: true },
        { label: 'Home Appliances', url: 'appliances', order: 3, isVisible: true },
        { label: 'Inverter', url: 'inverter', order: 4, isVisible: true },
      ],
      evDropdown: {
        label: 'EV',
        items: [
          { label: 'Scooter', id: 'scooter' },
          { label: 'Lithium Battery', id: 'battery' },
          { label: 'Charger', id: 'charger' },
        ],
      },
      safeguardLink: { label: 'Safeguard (New Innovation)', url: 'service-safeguard', isVisible: true },
      ctaButton: { label: 'Download App', url: '#download', isVisible: true },
      careersButton: { label: 'Work With Us', isVisible: true },
      isSticky: true,
      showLogo: true,
    },
    footer: {
      copyrightText: 'Copyright © 2009 - 2025 Haion. All Rights Reserved.',
      columns: [
        {
          heading: 'Quick Links',
          links: [
            { label: 'About us', url: 'about' },
            { label: 'Careers', url: 'careers' },
            { label: 'FAQ', url: '#faq' },
            { label: 'Blog', url: '#' },
            { label: 'Contact us', url: '#contact' },
          ],
        },
        {
          heading: 'Our Service',
          links: [
            { label: 'Home Appliances', url: 'appliances' },
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
      ],
      bottomLinks: [],
      showSocialLinks: true,
    },
    seo: {
      metaTitle: 'Haion — Premium Electronics E-Commerce Mobile App',
      metaDescription:
        'Experience the future of electronics shopping. High-end smartphones, premium audio, next-gen wearables, and smart home appliances on the modern Haion Mobile App.',
      metaKeywords: ['Haion', 'EV', 'electronics', 'appliances', 'e-commerce'],
      ogImage: { url: '/haban.webp', alt: 'Haion', publicId: '' },
    },
    maintenanceMode: {
      isEnabled: false,
      message: 'We are currently performing scheduled maintenance. Please check back soon.',
    },
    analytics: {
      googleAnalyticsId: '',
      hotjarId: '',
    },
    appLinks: {
      iosUrl: '#download',
      androidUrl: '#download',
    },
    checkout: {
      merchantName: 'HAION EV & Appliances',
      orderIdPrefix: 'HAION-',
      orderStatus: 'In Transit',
      codLabel: 'Cash on Delivery',
      onlineLabel: 'Pay Online',
      secureCheckoutLabel: 'Secure Checkout',
      orderDetailsTitle: 'Order Details',
      totalPayableLabel: 'Total Payable',
      trackingIdLabel: 'Your Tracking ID',
      trackShipmentLabel: 'Track Shipment Status →',
      closeWindowLabel: 'Close Window',
      confirmOrderLabel: 'Confirm Order',
      makePaymentLabel: 'Make Payment with',
      paymentMethodLabel: 'Payment Method',
      selectPaymentAppLabel: 'Select Payment App',
      awaitingAuthLabel: 'Awaiting authorization...',
      orderPlacedTitle: 'Order Placed Successfully!',
      paymentVerifiedTitle: 'Payment Verified & Order Placed!',
      paymentApps: [
        { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
        { id: 'gpay', label: 'Google Pay', icon: '🔵' },
        { id: 'paytm', label: 'Paytm', icon: '🌐' },
        { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳' },
      ],
      nameLabel: 'Full Name',
      phoneLabel: 'Mobile Number',
      addressLabel: 'Shipping Address',
      namePlaceholder: 'Enter your name',
      phonePlaceholder: '10-digit number',
      addressPlaceholder: 'Enter full address',
      placeOrderLabel: 'Place Order',
      processingLabel: 'Processing payment...',
      successTitle: 'Order Placed Successfully!',
      successBody: 'Your order has been confirmed. You can track it anytime from your profile.',
      trackLabel: 'Track Order',
      continueLabel: 'Continue Shopping',
    },
    cart: {
      title: 'Your Cart',
      emptyTitle: 'Your cart is empty',
      emptyBody: 'Browse our premium collection and add items to your cart.',
      checkoutLabel: 'Proceed to Checkout',
    },
    leadPopup: {
      enabled: true,
      delayMs: 2500,
      title: 'Book Your Haion EV Test Ride',
      subtitle: 'Share your details and our team will reach out within minutes.',
    },
    profile: {
      guestName: 'Guest Customer',
      guestPhone: '+91 98765 43210',
      guestEmail: 'haion.user@guest.com',
      memberTier: 'Gold Member',
    },
    orderTracking: {
      estimatedDelivery: '2-3 Business Days',
      steps: [
        { key: 'placed', label: 'Order Placed' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
      ],
    },
    careers: {
      applicationFee: '₹500',
      paymentNote: 'Application processing fee (non-refundable)',
    },
  };

  const sections = [
    {
      page: 'home',
      sectionKey: 'hero',
      sectionLabel: 'Hero Carousel',
      order: 0,
      isVisible: true,
      content: {
        primaryCtaLabel: 'Request a call back',
        primaryCtaUrl: '#download',
        secondaryCtaLabel: 'Book a testride',
        secondaryCtaUrl: '#download',
        activeDotColor: '#facc15',
      },
    },
    {
      page: 'home',
      sectionKey: 'trust-stats',
      sectionLabel: 'Trust Statistics',
      order: 1,
      isVisible: true,
      content: {},
    },
    {
      page: 'home',
      sectionKey: 'features',
      sectionLabel: 'Features',
      order: 2,
      isVisible: true,
      content: {
        badge: 'Why Choose Us',
        title: 'Designed for Elite Shoppers',
        subtitle:
          'Every aspect of the Haion Mobile App is engineered to deliver a premium, frictionless shopping experience for electronics enthusiasts.',
      },
    },
    {
      page: 'home',
      sectionKey: 'categories',
      sectionLabel: 'Categories',
      order: 3,
      isVisible: true,
      content: {
        badge: 'Product Categories',
        title: 'Browse by Category',
        subtitle: 'Explore our premium collection of smart home appliances and electric mobility solutions.',
      },
    },
    {
      page: 'home',
      sectionKey: 'who-we-are',
      sectionLabel: 'Who We Are',
      order: 4,
      isVisible: true,
      content: {
        badge: 'Our Heritage',
        title: 'Who We Are',
        paragraph1:
          'Established in 2009, Haion has grown into a trusted name in electric mobility and smart home appliances — delivering quality products backed by innovation and customer-first engineering.',
        paragraph2:
          'Every product undergoes rigorous quality testing before reaching your home, ensuring reliability, safety, and long-term performance you can count on.',
        image: { url: '/haio.webp', alt: 'Haion Corporate Office & Manufacturing Factory' },
      },
    },
    {
      page: 'home',
      sectionKey: 'app-experience',
      sectionLabel: 'App Experience',
      order: 5,
      isVisible: true,
      content: {
        badge: 'App Ecosystem',
        title: 'Designed for Collectors',
        subtitle: 'Explore the intuitive features that make Haion the ultimate electronics shopping companion.',
        centerTitle: 'HAION APP',
        centerBody:
          'Every aspect of the Haion Mobile App is engineered to deliver a premium, frictionless shopping experience.',
      },
    },
    {
      page: 'home',
      sectionKey: 'haion-advantage',
      sectionLabel: 'Haion Advantage',
      order: 6,
      isVisible: true,
      content: {
        badge: 'Haion Advantage',
        titleLine1: 'Effortless riding.',
        titleLine2: 'Worry-free ownership.',
      },
    },
    {
      page: 'home',
      sectionKey: 'products-tabs',
      sectionLabel: 'Products Tabs',
      order: 7,
      isVisible: true,
      content: {
        tabEv: 'Electric Vehicles (EVs)',
        tabAppliances: 'Home Appliances',
        specialPriceLabel: 'Special Price',
        viewDetailsLabel: 'View Details',
      },
    },
    {
      page: 'home',
      sectionKey: 'why-choose-haion',
      sectionLabel: 'Why Choose Haion',
      order: 8,
      isVisible: true,
      content: {
        badge: 'The Haion Advantage',
        title: 'Why Choose Haion?',
        subtitle:
          'Engineered for Indian roads and homes — our EVs and appliances combine cutting-edge technology with dependable after-sales support.',
      },
    },
    {
      page: 'home',
      sectionKey: 'how-it-works',
      sectionLabel: 'How It Works',
      order: 9,
      isVisible: true,
      content: {
        badge: 'Onboarding Flow',
        title: 'How It Works',
        subtitle: 'Start browsing the absolute pinnacle of consumer electronics in just four simple steps.',
      },
    },
    {
      page: 'home',
      sectionKey: 'testimonials',
      sectionLabel: 'Testimonials',
      order: 10,
      isVisible: true,
      content: {
        badge: 'Reviews & Testimonials',
        title: 'What Our Users Say',
        subtitle: 'Hear from tech enthusiasts who made Haion their go-to electronics destination.',
      },
    },
    {
      page: 'home',
      sectionKey: 'faq',
      sectionLabel: 'FAQ',
      order: 11,
      isVisible: true,
      content: {
        badge: 'Frequently Asked Questions',
        title: 'Got Questions?',
        subtitle: 'Everything you need to know about purchasing, shipping, and warranties on Haion.',
      },
    },
    {
      page: 'home',
      sectionKey: 'contact',
      sectionLabel: 'Contact',
      order: 12,
      isVisible: true,
      content: {
        badge: 'Get In Touch',
        title: "We'd Love to Chat",
        subtitle: 'Have questions about partnerships, bulk orders, or product support? Reach out anytime.',
        infoHeading: 'Contact Information',
        infoBody: 'Our team is available to help you with product inquiries, dealer partnerships, and after-sales support.',
        emailLabel: 'Email',
        email: 'ev@haion.co.in',
        phoneLabel: 'Phone',
        phone: '02269622645',
        hqLabel: 'Headquarters',
        address: 'D-46, SECTOR-10, Noida, Uttar Pradesh 201301',
        responseTime: '< 5 minutes',
        formHeading: 'Send a Message',
        formNameLabel: 'Your Name',
        formNamePlaceholder: 'John Doe',
        formEmailLabel: 'Email Address',
        formEmailPlaceholder: 'john@example.com',
        formMessageLabel: 'Message',
        formMessagePlaceholder: 'How can we help you?',
        submitLabel: 'Send Message',
        submittingLabel: 'Sending message...',
        successMessage: 'Thank you! Your message has been sent successfully.',
      },
    },
    {
      page: 'store',
      sectionKey: 'store-hero',
      sectionLabel: 'Store Hero',
      order: 0,
      isVisible: true,
      content: {
        badge: 'Experience Centers',
        heroTitle: 'Visit Our Stores',
        heroSubtitle:
          'Step into the world of Haion. Experience first-class tech solutions, witness connected smart homes in action, and take your favorite EV scooter out for a ride.',
      },
    },
    {
      page: 'store',
      sectionKey: 'store-config',
      sectionLabel: 'Store Page Content',
      order: 1,
      isVisible: true,
      content: {
        brandContent: {
          heading: 'Powering the Future of Electric Mobility',
          description:
            'Explore our range of advanced electric scooters designed for efficiency, reliability, performance, and everyday convenience.',
          features: [
            { id: 'f1', title: 'Advanced Lithium Battery Technology', description: 'High-density cells with intelligent BMS for maximum safety and life.' },
            { id: 'f2', title: 'Reliable Performance', description: 'High-torque motors providing smooth acceleration and effortless climbing.' },
            { id: 'f3', title: 'Low Maintenance', description: 'Engineered with durable components that require minimal upkeep.' },
            { id: 'f4', title: 'Eco-Friendly Transportation', description: 'Zero emissions for cleaner cities.' },
            { id: 'f5', title: 'Wide Service Network', description: 'Authorized touchpoints always within reach.' },
            { id: 'f6', title: 'Modern Design', description: 'Futuristic aesthetics combined with ergonomic comfort.' },
          ],
        },
        productRange: {
          heading: 'Our Electric Scooter Range',
          description: 'Discover multiple scooter models designed to meet different riding needs.',
        },
        warrantyInfo: {
          heading: 'Warranty Protection',
          description: 'Every vehicle is backed by a customer-focused warranty program.',
          cards: [
            { id: 'w1', title: 'Battery', duration: 'Up to 3 Years Warranty', coverage: 'Repair or Replacement Coverage' },
            { id: 'w2', title: 'Motor', duration: '1 Year Warranty', coverage: 'Repair or Replacement Coverage' },
            { id: 'w3', title: 'Controller', duration: '1 Year Warranty', coverage: 'Repair or Replacement Coverage' },
            { id: 'w4', title: 'Charger', duration: '1 Year Warranty', coverage: 'Repair or Replacement Coverage' },
          ],
        },
        warrantyTerms: {
          heading: 'Warranty Terms & Conditions',
          covers: ['Warranty covers manufacturing defects only.'],
          exclusions: ['Physical damage', 'Accident damage', 'Overloading damage', 'Improper usage', 'Unauthorized modifications'],
          note: 'Company warranty policies may change with prior notice.',
        },
        showroomInfo: {
          heading: 'Our Showroom & Service Presence',
          description: 'Quality sales and service through authorized showrooms and trained support teams.',
          features: ['Authorized Showrooms', 'Trained Technicians', 'Genuine Spare Parts', 'Customer Support', 'Service Assistance'],
          images: [
            { id: 'img1', src: '/store1.webp', title: 'Haion Flagship Store', location: 'Delhi NCR' },
            { id: 'img2', src: '/store2.webp', title: 'Haion Hub', location: 'Bengaluru' },
            { id: 'img3', src: '/store3.webp', title: 'Haion Studio', location: 'Mumbai' },
          ],
        },
        dealerInfo: {
          heading: 'Become a Dealer',
          description: 'Join our growing electric mobility network and build a successful business.',
          plans: [
            { id: 'p1', level: 'District Level', investment: 'Investment Starting Around ₹26 Lakhs', requirement: 'Large Showroom Requirement' },
            { id: 'p2', level: 'Tehsil Level', investment: 'Investment Starting Around ₹13 Lakhs', requirement: 'Medium Showroom Requirement' },
            { id: 'p3', level: 'Rural Level', investment: 'Investment Starting Around ₹6.25 Lakhs', requirement: 'Compact Showroom Requirement' },
          ],
          benefits: ['Brand Support', 'Training Programs', 'Product Assistance', 'Marketing Support', 'Service Guidance'],
        },
        banners: {
          heroTitle: 'Visit Our Stores',
          heroSubtitle:
            'Step into the world of Haion. Experience first-class tech solutions, witness connected smart homes in action, and take your favorite EV scooter out for a ride.',
        },
      },
    },
    {
      page: 'about',
      sectionKey: 'about-hero',
      sectionLabel: 'About Hero',
      order: 0,
      isVisible: true,
      content: {
        badge: 'About Haion EV',
        title: 'Our Mission & Story',
        subtitle: 'Discover the journey behind Haion — from a cassette repair shop to a full mobility ecosystem.',
      },
    },
    {
      page: 'appliances',
      sectionKey: 'appliances-hero',
      sectionLabel: 'Appliances Hero',
      order: 0,
      isVisible: true,
      content: {
        badge: 'IoT Household',
        title: 'Haion Home Appliances',
        subtitle: 'Smart refrigerators, TVs, air conditioners, and kitchen appliances engineered for modern Indian homes.',
        gridTitle: 'Premium Home Appliances',
      },
    },
    {
      page: 'inverter',
      sectionKey: 'inverter-hero',
      sectionLabel: 'Inverter Hero',
      order: 0,
      isVisible: true,
      content: {
        badge: 'Smart Power Backup',
        title: 'Haion Smart Inverters',
        subtitle: 'Powering your home seamlessly with premium sine wave and hybrid solar inverters.',
        gridTitle: 'Premium Inverter Series',
      },
    },
  ];

  const statistics = [
    { value: 50, suffix: 'K+', label: 'Active Customers', description: 'Trusting our platform daily' },
    { value: 1, suffix: 'M+', label: 'Orders Placed', description: 'Seamlessly shipped & delivered' },
    { value: 500, suffix: '+', label: 'Cities Covered', description: 'Superfast delivery network' },
    { value: 4.8, suffix: '★', label: 'App Rating', description: 'Based on 100K+ reviews' },
  ];

  const features = [
    { title: '100% Genuine Electronics', description: 'Sourced directly from official brand manufacturers with direct warranty protection.', iconName: 'shield' },
    { title: 'Unmatched Direct Pricing', description: 'We bypass middlemen to bring you top-tier products at direct factory-to-consumer prices.', iconName: 'tag' },
    { title: 'Hyperfast Express Delivery', description: 'Get your items delivered within 2 hours in supported metro cities, or 24 hours nationwide.', iconName: 'truck' },
    { title: 'Military-Grade Security', description: 'Every purchase is protected with multi-layered encryption and flexible payment methods.', iconName: 'lock' },
    { title: '1-Year Brand Warranty', description: 'Every household appliance comes with an official 1-year manufacturer warranty and free home maintenance.', iconName: 'shield' },
    { title: 'Elite 24/7 Expert Support', description: 'Not bots. Chat instantly with real electronics experts who can guide your setup.', iconName: 'chat' },
  ];

  const categories = [
    { id: 'ac', title: 'Air Conditioners', emoji: '❄️', description: 'Energy-efficient smart inverter cooling', count: '5-Star Rated', gradient: 'from-blue-600/30 to-indigo-600/30', color: '#3b82f6', subtitle: 'Smart Cooling Solutions', longDescription: "Keep your home perfectly cool and comfortable with Haion's range of smart inverter split air conditioners.", features: ['5-Star Inverter Tech', '100% Copper Condenser', 'Smart App Schedules'], subProducts: [{ name: 'Haion AeroBreeze 1.5T', tag: '5-Star AC', price: '₹36,999', rating: '4.8' }] },
    { id: 'tv', title: 'Smart LED TVs', emoji: '📺', description: 'Cinematic 4K UHD & QLED displays', count: 'Premium Quality', gradient: 'from-purple-600/30 to-pink-600/30', color: '#a855f7', subtitle: 'Immersive Visuals', longDescription: "Reimagine your home entertainment with Haion's ultra-thin bezel-less smart TVs.", features: ['Dolby Vision Support', '120Hz Refresh Rate', 'Google TV OS Integrated'], subProducts: [{ name: 'Haion CinemaMax 55', tag: '4K UHD TV', price: '₹38,999', rating: '4.8' }] },
    { id: 'washing', title: 'Washing Machines', emoji: '🧺', description: 'Fully automatic front & top load washers', count: 'Ultra-Clean Tech', gradient: 'from-amber-500/30 to-orange-600/30', color: '#f59e0b', subtitle: 'Smart Care Laundry', longDescription: "Gentle on clothes, tough on stains.", features: ['Inverter Direct Drive', 'Hygiene Steam Wash', 'Smart Diagnosis Support'], subProducts: [{ name: 'Haion HydroClean Pro 7kg', tag: 'Best Seller', price: '₹24,999', rating: '4.8' }] },
    { id: 'refrigerator', title: 'Refrigerators', emoji: '❄️', description: 'IoT double-door & multi-door smart refrigerators', count: 'Next-Gen Cooling', gradient: 'from-amber-600/30 to-yellow-600/30', color: '#d97706', subtitle: 'Smart Freshness Technology', longDescription: "Keep your food fresh longer with Haion's IoT-enabled smart refrigerators.", features: ['Digital Inverter Tech', 'Triple Cooling System', 'Wi-Fi Smart Control'], subProducts: [{ name: 'Haion SmartChill Pro 450L', tag: 'Best Seller', price: '₹54,999', rating: '4.8' }] },
    { id: 'mixer', title: 'Mixer Grinders', emoji: '🌪️', description: 'Heavy duty high-torque blenders & grinders', count: 'Kitchen Companion', gradient: 'from-cyan-500/30 to-blue-500/30', color: '#06b6d4', subtitle: 'Precision Food Prep', longDescription: 'Tackle daily grinding, blending, and food preparation in seconds.', features: ['1000W High-Torque Motor', 'Leak-Proof SS Jars', 'Smart Speed Sensors'], subProducts: [{ name: 'Haion PowerBlend X1', tag: 'Heavy Duty', price: '₹8,999', rating: '4.8' }] },
  ];

  const appExperienceSteps = [
    { id: 'search', title: 'AI-Powered Smart Search', description: 'Take a photo of any gadget or describe your need. Our neural search engines match and recommend the exact models suited for you in milliseconds.', badge: 'Discovery' },
    { id: 'wishlist', title: 'Collaborative Wishlists', description: 'Compare products side-by-side with full spec sheets. Share your list with friends and let them vote or add suggestions in real-time.', badge: 'Curation' },
    { id: 'cart', title: 'Instant Cart & Dynamic Bundling', description: 'Add accessories dynamically. The app automatically calculates bundle discounts, saving you an average of 15% on complementary items.', badge: 'Saving' },
    { id: 'checkout', title: 'Biometric 1-Click Checkout', description: 'Double tap to authenticate via FaceID or TouchID. Integrated with Apple Pay, Google Pay, credit cards, and flexible interest-free split payments.', badge: 'Security' },
  ];

  const advantageCards = [
    { title: 'Smart Connected Ride', desc: 'Real-time GPS, anti-theft alerts, and ride analytics — all from your smartphone.', image: '/sc012.webp' },
    { title: 'Battery as a Service', desc: 'Subscribe to battery plans and never worry about degradation or replacement costs.', image: '/sc011.webp' },
    { title: 'Nationwide Service', desc: '500+ authorized service centers with genuine parts and trained technicians.', image: '/sc013.webp' },
  ];

  const whyChooseItems = [
    { title: 'High-Performance Engineering', desc: 'Every Haion product is built with premium components tested for Indian conditions.', icon: 'zap' },
    { title: 'Smart IoT Integration', desc: 'Control, monitor, and schedule your appliances and EV from a single unified app.', icon: 'cpu' },
    { title: 'Direct-to-Consumer Pricing', desc: 'No middlemen. Factory-direct pricing with transparent warranty and support.', icon: 'dollar' },
    { title: 'Dedicated After-Sales Support', desc: '24/7 expert support, nationwide service network, and hassle-free warranty claims.', icon: 'life-buoy' },
  ];

  const howItSteps = [
    { step: '01', title: 'Download the App', description: "Scan our secure QR code or find 'Haion' on the App Store or Google Play Store." },
    { step: '02', title: 'Discover Premium Gear', description: 'Browse 3D immersive views, compare specs, and consult our interactive shopping agent.' },
    { step: '03', title: 'One-Tap Secure Checkout', description: 'Place your order securely using FaceID/TouchID or multi-split premium credit plans.' },
    { step: '04', title: 'Track & Receive Today', description: 'Watch your express courier move in real-time. Delivery arrives at your desk in hours.' },
  ];

  const testimonials = [
    { quote: 'Haion completely changed how I buy gadgets. Ordering a MacBook at 1 PM and having it on my desk by 3:15 PM was mind-blowing.', rating: 5, name: 'Sarah Jenkins', role: 'Lead Designer at Stripe', avatar: '👩‍💻' },
    { quote: 'I was skeptical about the pricing initially, but everything is 100% official and serial numbers register directly with Apple/Sony.', rating: 5, name: 'David Chen', role: 'Tech YouTuber & Creator', avatar: '🎥' },
    { quote: 'The visual design of their app is a masterpiece. Dynamic bundling saved me $120 on my camera combo.', rating: 5, name: 'Elena Rostova', role: 'Fullstack Developer', avatar: '💻' },
    { quote: 'Setting up my smart AC and television via the Haion app was incredibly seamless.', rating: 5, name: 'Marcus Vance', role: 'Hardware Engineer', avatar: '⚙️' },
  ];

  const faqs = [
    { question: 'Are all electronics on Haion genuine?', answer: 'Absolutely. We hold direct partnership agreements with global tech companies like Apple, Sony, and Samsung. Every product is brand new, factory sealed, and includes a full official manufacturer warranty valid worldwide.' },
    { question: 'How does 2-hour express delivery work?', answer: 'For major metropolitan areas, we operate local micro-fulfillment hubs. If your address falls within our delivery radius, the option will appear at checkout.' },
    { question: 'What payment options do you support?', answer: 'We support Apple Pay, Google Pay, all major international credit/debit cards, and premium split-payment services with 0% interest options.' },
    { question: 'How do I claim a discount code displayed on the web?', answer: 'Simply tap any of the promotional cards. The app will launch automatically with the discount code pre-copied to your clipboard.' },
  ];

  const collections = [
    ...mapCollection('hero-slides', heroSlides),
    ...mapCollection('statistics', statistics),
    ...mapCollection('features', features),
    ...mapCollection('categories', categories),
    ...mapCollection('app-experience-steps', appExperienceSteps),
    ...mapCollection('advantage-cards', advantageCards),
    ...mapCollection('why-choose-items', whyChooseItems),
    ...mapCollection('how-it-steps', howItSteps),
    ...mapCollection('testimonials', testimonials),
    ...mapCollection('faqs', faqs),
    ...productsSeed,
  ];

  return { settings, sections, collections };
}
