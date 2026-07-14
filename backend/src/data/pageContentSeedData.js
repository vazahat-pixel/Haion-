/**
 * Static seed data mirrored from frontend pageContentFallback.js
 */

export const ABOUT_FALLBACK = {
  cards: [
    { title: 'At HAION EV', image: '/family_album_left.webp', alt: 'Assembly Line', body: 'We believe the future of transportation should be smart, affordable, and sustainable.' },
    { title: 'Our Journey', image: '/family_album_center.webp', alt: 'Our Journey', body: 'Every successful journey begins with a challenge, and ours was no different.' },
    { title: 'Our Vision', image: '/family_album_right.webp', alt: 'Green Vision', body: 'To make electric mobility and smart technology accessible, reliable, and affordable.' },
  ],
  leadership: {
    badge: '[ TEAM & LEADERSHIP ]',
    title: 'Meet Our Leadership',
    members: [
      { name: 'Deepak Sharma', role: 'Managing Director', initials: 'DS' },
      { name: 'Dixit Kumar', role: 'Finance Chief Executive', initials: 'DK' },
      { name: 'Hitesh Sharma', role: 'Founder', initials: 'HS' },
      { name: 'Rakesh Ravat', role: 'Founder', initials: 'RR' },
      { name: 'Amit Sharma', role: 'Founder', initials: 'AS' },
    ],
  },
  journey: {
    title: 'The Journey of Amit Sharma – From Struggle to Innovation',
    paragraphs: [
      'Every successful entrepreneur has a story of sacrifice, determination, and relentless hard work.',
      'In 2009, Amit Sharma started his entrepreneurial journey with a small audio cassette manufacturing business.',
      "Today, Amit Sharma's story stands as a reminder that success is not defined by where you start.",
    ],
  },
  founder: {
    badge: '[ FOUNDER MESSAGE ]',
    title: 'Founder Message',
    quote: 'There were days when I had very little, but I never stopped dreaming.',
    name: 'Amit Sharma',
    role: 'Founder',
    initials: 'AM',
    tagline: 'HAION EV | Lithium Battery Manufacturing | Digital Mobility & Technology Ventures',
  },
  careers: {
    badge: '[ CAREERS AT HAION ]',
    title: 'Join the Green Mobility Revolution',
    body: 'We are always looking for passionate, driven individuals to help us build a smarter and cleaner tomorrow.',
    ctaLabel: 'Work With Us',
  },
  tagline: 'HAION EV – Driving the Future, Powered by Innovation.',
  filmStrip: ['HAION EV HISTORY', 'SCENE 01 / TAKE 01', 'DIRECTOR: AMIT SHARMA'],
};

export const GALLERY_FALLBACK = [
  { id: 1, category: 'Showroom', src: '/storeban.webp', title: 'Flagship Entrance', desc: 'Grand entrance of our New Delhi flagship store.' },
  { id: 2, category: 'EV Scooters', src: '/x1bg2.webp', title: 'X1', desc: 'Smart EV Scooter for Urban Commuting.' },
];

export const GALLERY_SECTION_FALLBACK = {
  badge: '[ PHOTO GALLERY ]',
  title: 'Interactive Experience Gallery',
  filters: ['All', 'Showroom', 'EV Scooters'],
};

export const PARTNERS_FALLBACK = [
  { name: 'Apple' }, { name: 'Samsung' }, { name: 'Sony' }, { name: 'HP' }, { name: 'Dell' },
];

export const DOWNLOAD_CTA_FALLBACK = {
  badge: 'Get The Mobile Application',
  title: 'Unlock the Pinnacle of Electronics Shopping',
  subtitle: 'Join over 50,000 active members saving weekly on factory-direct gear.',
  benefits: ['Secure biometric 1-tap checkout', 'Real-time hyper-local shipment maps'],
};

export const OFFERS_SECTION_FALLBACK = {
  badge: 'Exclusive App Deals',
  title: 'Limited-Time Offers',
  subtitle: 'Unlock these premium deals exclusively on the Haion mobile application.',
};

export const OFFERS_FALLBACK = [
  { title: 'Mega Electronics Carnival', subtitle: 'Up to 50% Off on Premium Computing', tag: 'Festival Offer', badge: 'Limited Time', gradient: 'from-indigo-900/60 via-purple-900/40 to-[#030303]', actionText: 'Claim on App', timeRemaining: 'Ends in: 18h 42m' },
];

export const SCROLL_SEQUENCE_FALLBACK = {
  totalFrames: 150,
  framePathTemplate: '/sequence/ezgif-frame-{n}.webp',
  loadingText: 'Loading cinematic experience...',
  overlays: [
    { start: 0.05, end: 0.35, title: 'Cinematic Engineering', highlight: 'Uncompromising Design', desc: 'Every component sculpted for aerodynamics.' },
  ],
};

export const BRANDS_SECTION_FALLBACK = { label: 'Partnered with Global Giants' };

export const STORE_EXTRA_FALLBACK = {
  layoutsTitle: 'Explore Our Store Layouts & Experience Zones',
  images: [
    { src: '/store1.webp', title: 'Premium Retail Experience', location: 'Storefront Showcase', desc: 'State-of-the-art showrooms.' },
  ],
  highlights: [
    { iconName: 'award', title: 'Interactive Test Drives', desc: 'Experience EV scooters on local tracks.' },
  ],
};

export const APPLIANCES_SECTIONS_FALLBACK = {
  tv: { title: 'Smart LED TVs Series', subtitle: 'Whole New Range of LED TV' },
  refrigerator: { title: 'Smart Refrigerators', subtitle: 'Convertible Multi-Zone Cooling' },
  mixer: { title: 'Mixer Grinders', subtitle: 'High-Torque Kitchen Power' },
  ac: { title: 'Smart Air Conditioners', subtitle: '5-Star Inverter Cooling' },
  washing: { title: 'Washing Machines', subtitle: 'Smart Care Laundry' },
};
