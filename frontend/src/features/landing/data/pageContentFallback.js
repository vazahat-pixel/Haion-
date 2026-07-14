import { brandsData, offersData } from './mockData';

export const ABOUT_FALLBACK = {
  hero: {
    badge: 'About Haion EV',
    title: 'Our Mission & Story',
    subtitle:
      'Every aspect of the Haion Mobile App is crafted to provide a premium, transparent, and completely effortless shopping experience.',
  },
  cards: [
    {
      title: 'At HAION EV',
      image: '/family_album_left.webp',
      alt: 'Assembly Line',
      body: 'We believe the future of transportation should be smart, affordable, and sustainable. Founded by passionate entrepreneurs with a vision to transform mobility, HAION EV was established to create high-quality electric two-wheelers and advanced lithium battery solutions that meet the needs of modern India.',
    },
    {
      title: 'Our Journey',
      image: '/family_album_center.webp',
      alt: 'Our Journey',
      body: 'Every successful journey begins with a challenge, and ours was no different. Years ago, our founder Amit Sharma started with a simple question: "What if I could create opportunities not only for myself, but for others as well?" Overcoming struggles, HAION EV was built on resilience, trust, and a desire to make quality mobility accessible.',
    },
    {
      title: 'Our Vision',
      image: '/family_album_right.webp',
      alt: 'Green Vision',
      body: 'To make electric mobility and smart technology accessible, reliable, and affordable. We are committed to engineering dependable lithium battery systems and EV solutions that empower individuals, create jobs for talented youth, and build a sustainable future powered by clean energy.',
    },
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
      'Every successful entrepreneur has a story of sacrifice, determination, and relentless hard work. The story of Amit Sharma is not just about building businesses—it is about turning challenges into opportunities.',
      'In 2009, Amit Sharma started his entrepreneurial journey with a small audio cassette manufacturing business.',
      'Many nights were spent working late, planning the next step, and wondering how to keep the business moving forward.',
      'As technology changed and the cassette industry declined, Amit faced a critical choice: quit or evolve. He chose to evolve.',
      'In 2012, he entered the television manufacturing industry.',
      'His determination led him into the home appliance manufacturing sector in 2016.',
      'Then came a bigger dream.',
      'In 2022, inspired by the future of clean transportation, Amit entered the electric vehicle industry and laid the foundation for HAION EV.',
      'To strengthen the vision, he expanded into lithium battery manufacturing in 2024.',
      'By 2026, the journey expanded further into online food delivery and digital taxi services.',
      'Looking back, the journey from a small cassette manufacturing setup to multiple industries was never easy.',
      "Today, Amit Sharma's story stands as a reminder that success is not defined by where you start, but by your willingness to keep moving forward despite adversity.",
    ],
    highlightParagraph: 'Then came a bigger dream.',
  },
  founder: {
    badge: '[ FOUNDER MESSAGE ]',
    title: 'Founder Message',
    quote:
      'There were days when I had very little, but I never stopped dreaming. Every setback taught me a lesson, every failure made me stronger, and every challenge pushed me closer to my vision.',
    name: 'Amit Sharma',
    role: 'Founder',
    initials: 'AM',
    tagline: 'HAION EV | Lithium Battery Manufacturing | Digital Mobility & Technology Ventures ⚡🚀',
  },
  careers: {
    badge: '[ CAREERS AT HAION ]',
    title: 'Join the Green Mobility Revolution',
    body: 'We are always looking for passionate, driven individuals to help us build a smarter and cleaner tomorrow. Explore technical, sales, and manufacturing roles.',
    ctaLabel: 'Work With Us',
  },
  tagline: 'HAION EV – Driving the Future, Powered by Innovation. ⚡🛵🔋',
  filmStrip: ['HAION EV HISTORY', 'SCENE 01 / TAKE 01', 'DIRECTOR: AMIT SHARMA'],
  bgImages: { scooter: '/haion_scooter_hero.webp', battery: '/haion-battery.webp' },
};

export const GALLERY_FALLBACK = [
  { id: 1, category: 'Showroom', src: '/storeban.webp', title: 'Flagship Entrance', desc: 'Grand entrance of our New Delhi flagship store featuring modern lighting.' },
  { id: 2, category: 'EV Scooters', src: '/x1bg2.webp', title: 'X1', desc: 'Smart, Eco-Friendly EV Scooter for Urban Commuting.' },
  { id: 4, category: 'EV Scooters', src: '/x1plusbg.webp', title: 'X1Plus', desc: 'Your Everyday Green Ride – EV Scooter.' },
  { id: 5, category: 'EV Scooters', src: '/x2f1.webp', title: 'X2', desc: 'Reimagine Urban Travel with Our EV Scooter.' },
  { id: 7, category: 'Showroom', src: '/haionban2.webp', title: 'Bengaluru Experience Zone', desc: 'Experience our high-tech electric vehicles and interactive zones.' },
  { id: 8, category: 'Showroom', src: '/store1.webp', title: 'Experience Lounge', desc: 'Premium customer lounge featuring our complete smart appliance ecosystem.' },
];

export const GALLERY_SECTION_FALLBACK = {
  badge: '[ PHOTO GALLERY ]',
  title: 'Interactive Experience Gallery',
  filters: ['All', 'Showroom', 'EV Scooters'],
};

export const PARTNERS_FALLBACK = brandsData.map((name, i) => ({ id: `p${i}`, name }));

export const DOWNLOAD_CTA_FALLBACK = {
  badge: 'Get The Mobile Application',
  title: 'Unlock the Pinnacle of Electronics Shopping',
  titleLine2: 'Electronics Shopping',
  subtitle:
    'Join over 50,000 active members saving weekly on factory-direct audio monitors, smartphone flagships, computing gear, and IoT wearables.',
  benefits: [
    'Secure biometric 1-tap checkout',
    'Real-time hyper-local shipment maps',
    'App-exclusive bundle offers up to 20% off',
    'Direct expert advice chat in-app 24/7',
  ],
  iosLabel: 'App Store',
  androidLabel: 'Google Play',
  phoneTitle: 'Haion App',
  phoneSubtitle: 'Your premium electronics companion',
};

export const OFFERS_SECTION_FALLBACK = {
  badge: 'Exclusive App Deals',
  title: 'Limited-Time Offers',
  subtitle: 'Unlock these premium deals exclusively on the Haion mobile application.',
};

export const OFFERS_FALLBACK = offersData;

export const SCROLL_SEQUENCE_FALLBACK = {
  totalFrames: 150,
  framePathTemplate: '/sequence/ezgif-frame-{n}.webp',
  loadingText: 'Loading cinematic experience...',
  overlays: [
    { start: 0.05, end: 0.35, title: 'Cinematic Engineering', highlight: 'Uncompromising Design', desc: 'Every component sculpted for aerodynamics and premium aesthetics.' },
    { start: 0.4, end: 0.7, title: 'Intelligent Space', highlight: 'Seamless Integration', desc: 'Watch as components elegantly slide and fit into place under the hood.' },
    { start: 0.75, end: 0.95, title: '56L Smart Boot Space', highlight: 'Haion EV Storage', desc: 'Massive storage compartment, designed to carry all your big little things.' },
  ],
};

export const BRANDS_SECTION_FALLBACK = { label: 'Partnered with Global Giants' };

export const STORE_EXTRA_FALLBACK = {
  heroBadge: 'Experience Centers',
  layoutsTitle: 'Explore Our Store Layouts & Experience Zones',
  images: [
    { src: '/store1.webp', title: 'Premium Retail Experience', location: 'Storefront Showcase', desc: 'Our state-of-the-art showrooms are designed to give customers a hands-on look at our vehicles and premium diagnostic spaces.' },
    { src: '/store2.webp', title: 'EV Scooter Lineup Display', location: 'Product Showcase', desc: 'We showcase all current EV scooter models side by side, allowing customers to easily inspect, compare, and test ride them.' },
    { src: '/store3.webp', title: 'Interactive Smart Tech Zones', location: 'Experience Center', desc: 'Explore connected IoT systems, live diagnostics, and smart ecosystems built to complement our modern electric vehicle lineup.' },
  ],
  highlights: [
    { iconName: 'award', title: 'Interactive Test Drives', desc: 'Book a slot or walk in to experience the high-torque, smooth acceleration of our EV scooters on local tracks.' },
    { iconName: 'cpu', title: 'Live IoT Smart Demos', desc: 'Get hands-on experience of our smart TVs, refrigerators, air conditioners, and robotic vacuums connected live.' },
    { iconName: 'shield', title: 'Spot Battery Diagnostics', desc: 'Bring in your battery pack or charger for a live BMS diagnostic checkup by our certified technicians in under 15 minutes.' },
  ],
  showroomFeaturesHeading: 'Why Visit Our Authorized Center?',
};

export const APPLIANCES_SECTIONS_FALLBACK = {
  tv: { title: 'Smart LED TVs Series', subtitle: 'Whole New Range of LED TV' },
  refrigerator: { title: 'Smart Refrigerators', subtitle: 'Convertible Multi-Zone Cooling' },
  mixer: { title: 'Mixer Grinders', subtitle: 'High-Torque Kitchen Power' },
  ac: { title: 'Smart Air Conditioners', subtitle: '5-Star Inverter Cooling' },
  washing: { title: 'Washing Machines', subtitle: 'Smart Care Laundry' },
  iot: {
    title: 'Unified IoT App Experience',
    subtitle: 'Control every appliance from one dashboard',
    features: [
      { title: 'Unified IoT App', desc: 'Monitor water levels, schedules, battery health, and operations inside a single mobile application dashboard.' },
      { title: 'Smart Scheduling', desc: 'Set vacuum cleanups or air purify routines automatically when you leave the house or via calendar integrations.' },
      { title: 'Direct Brand Support', desc: '1-year manufacturing warranty with free in-home maintenance checkups and spare replacement support.' },
    ],
  },
  specialPriceLabel: 'Special Price',
  viewDetailsLabel: 'View Details',
  pricingTables: {
    tv: {
      title: 'Whole New Range of LED TV',
      subtitle: 'Compare models, prices, and detailed specifications across our entire range of LED TVs.',
      rows: [
        { model: 'LED-AH24', price: '₹ 5,400', mrp: '₹ 9,999', desc: 'Speaker 20 W Connectivity (AV IN, HDMI, USB, VGA, Earphone)' },
        { model: 'LED-AH40Normal', price: '₹ 10,000', mrp: '₹ 17,999', desc: '(AOSP), Normal, Speaker 20W, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-32PROSmart', price: '₹ 8,000', mrp: '₹ 15,000', desc: 'Android (AOSP), 1.25/4GB , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-32SIRIS LED TV', price: '₹ 8,400', mrp: '₹ 9,999', desc: 'Android IRIS , Speaker 20W, Connectivity ( AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
        { model: 'LED-AH32SOTIS LED TV', price: '₹ 9,999', mrp: '₹ 16,999', desc: 'Android (OTIS), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
        { model: 'LED-AH32BLSmart', price: '₹ 10,999', mrp: '₹ 17,999', desc: 'Android (AOSP), Bezel Less, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Command Tv through Mobile Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45)) Voice Remote, In-built' },
        { model: 'LED-AH40Smart', price: '₹ 13,999', mrp: '₹ 21,000', desc: 'Android (AOSP), BT, 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-AH43SBSmart', price: '₹ 17,999', mrp: '₹ 27,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Sound Bar In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-AH43BLSmart', price: '₹ 19,999', mrp: '₹ 28,000', desc: 'Bezel less, Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, Voice Remote, BT In-built, Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-AH43WEB', price: '₹ 24,999', mrp: '₹ 34,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
        { model: 'LED-AH50Smart', price: '₹ 25,999', mrp: '₹ 42,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-AH50WEB', price: '₹ 29,999', mrp: '₹ 49,000', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
        { model: 'LED-AN55Smart', price: '₹ 31,999', mrp: '₹ 50,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
        { model: 'LED-AH55WEB', price: '₹ 38,999', mrp: '₹ 55,999', desc: 'HDR10 ,4K, Dolby Audio, Bezel less, WebOS, Magic Remotely ThinQ/Alexa, Screen-Sharing, HDMI ARC, BT In-built Connectivity (HDMI, USB, Optical, LAN(RJ45))' },
        { model: 'LED-AN65Smart', price: '₹ 49,999', mrp: '₹ 75,000', desc: 'Android (AOSP), 1+8 GB, Speaker 20W, Screen-Sharing, HDMI ARC, In-built Connectivity (AV IN, HDMI, USB, Earphone, LAN(RJ45))' },
      ],
    },
    mixer: {
      title: 'Mixer Grinder, Juicer & Induction',
      subtitle: 'Explore our complete range of high-performance mixer grinders, juicers, hand blenders, and induction cookers.',
      rows: [
        { model: 'AN Electric Chopper / 1311', price: '₹ 780', mrp: '₹ 1,999', desc: 'Chopper' },
        { model: 'AN Hand Blender / 502', price: '₹ 880', mrp: '₹ 2,499', desc: 'Stainless Steel Stem & 3 Multifunctional SS Blades' },
        { model: 'AN MINI POPULAR 450 (Copper)', price: '₹ 1,150', mrp: '₹ 3,999', desc: '2 Poly JAR' },
        { model: 'AN MINI DIAMOND 450 (Copper)', price: '₹ 1,100', mrp: '₹ 4,299', desc: '2 JARS' },
        { model: 'AN Real JMG 450W (Copper)', price: '₹ 2,300', mrp: '₹ 4,999', desc: '1.5 Ltr Liquidizer & 200ml SS 3 Jar' },
        { model: 'AN Marvel JMG 550W (Copper)', price: '₹ 2,650', mrp: '₹ 5,999', desc: '1.5 Ltr Ploy-Carbonate Jar & 500ml SS 3 Jar' },
        { model: 'AN MINI DIAMOND 500 (Copper)', price: '₹ 1,500', mrp: '₹ 4,499', desc: '3 JARS' },
        { model: 'AN Vista 550W (Copper)', price: '₹ 1,800', mrp: '₹ 4,299', desc: '3 JARS' },
        { model: 'AN Gold Star 750W (Copper)', price: '₹ 2,400', mrp: '₹ 5,199', desc: '3 JARS' },
        { model: 'AN Mega Star 1HP (Copper)', price: '₹ 2,650', mrp: '₹ 4,999', desc: '3 JARS' },
        { model: 'AN W671100', price: '₹ 2,100', mrp: '₹ 4,499', desc: 'Induction Cooker' },
      ],
    },
    ac: {
      title: 'Air Conditioner Range',
      subtitle: 'Compare models, prices, and energy efficiency ratings for our Air Conditioners.',
      rows: [
        { model: 'Ac-ATSAC183101TV', price: '₹ 29,999', mrp: '₹ 45,000', desc: 'AC Split 3 Star 1.5 Ton (Inverter) / 3 STAR / 3.92*' },
      ],
    },
  },
};

export const CAREERS_FORM_FALLBACK = {
  companyName: 'Power Safe Industries',
  headerTitle: 'POWER SAFE INDUSTRIES',
  headerSubtitle: 'PAN India Recruitment 2026',
  applicationFee: '₹99',
  paymentNote: 'Application processing fee (non-refundable)',
  states: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  ],
  positions: ['Sales Executive', 'Service Technician', 'Assembly Operator', 'Quality Inspector', 'Store Manager'],
  workAreas: ['Field Sales', 'Showroom', 'Manufacturing', 'Service Center', 'Warehouse'],
  qualifications: ['10th Pass', '12th Pass', 'ITI', 'Diploma', 'Graduate', 'Post Graduate'],
  experienceOptions: ['Fresher', '0-1 Years', '1-3 Years', '3-5 Years', '5+ Years'],
  successTitle: 'Application Submitted Successfully!',
  successBody: 'Thank you for applying to Power Safe Industries. Our HR team will review your application and contact you shortly.',
};

export const LEAD_POPUP_FALLBACK = {
  steps: {
    detailsTitle: 'Book Your Test Ride',
    detailsSubtitle: 'Enter your details to schedule a free Haion EV experience.',
    otpTitle: 'Verify Your Number',
    otpSubtitle: 'Enter the 4-digit OTP sent to your mobile.',
    surveyTitle: 'Help Us Personalize',
    surveySubtitle: 'Tell us when you plan to buy and what you need help with.',
    scheduleTitle: 'Pick a Visit Date',
    scheduleSubtitle: 'Choose a convenient slot at Haion Experience Center.',
    confirmTitle: 'You Are All Set!',
    confirmSubtitle: 'Our team will call you shortly to confirm your visit.',
  },
  fields: {
    namePlaceholder: 'Full Name',
    phonePlaceholder: 'Mobile Number',
    pinPlaceholder: 'PIN Code',
    modelLabel: 'Select EV Model',
  },
  models: ['X1', 'X1Plus', 'X2', 'X2Plus', 'X3', 'X3Plus', 'X4', 'X4Plus', 'S Pro', 'OX Plus', 'H Pro', 'I Pro'],
  timelineOptions: ['Within 1 week', 'Within 1 month', 'Within 3 months', 'Just exploring'],
  helpOptions: ['Test ride booking', 'Pricing & EMI', 'Battery & range', 'Dealer location'],
  visitTime: '9:30 AM - 8:30 PM',
  visitLocation: 'Haion Experience Center',
  privacyText: 'By continuing, you agree to our privacy policy and consent to be contacted by Haion.',
};

export const PROFILE_UI_FALLBACK = {
  clubLabel: 'HAION CLUB',
  pageTitle: 'My Profile',
  backLabel: 'Back to Home',
  emailLabel: 'Email Address',
  phoneLabel: 'Phone Number',
  addressLabel: 'Default Shipping Address',
  noAddress: 'No saved shipping address yet.',
  ordersTitle: 'Your Orders',
  noOrders: 'No orders yet. Shop our collection to get started.',
  trackingTitle: 'Live Order Tracking',
};

export const TRACKING_UI_FALLBACK = {
  modalBadge: 'Real-Time Tracking',
  modalTitle: 'Track Your Haion Order',
  searchPlaceholder: 'Enter Order ID (e.g. HAION-123456)',
  searchLabel: 'Track Order',
  notFoundError: 'Order ID not found. Use a format like: HAION-123456',
  emptyError: 'Please enter a valid Order ID',
  estimatedLabel: 'Estimated Delivery',
  steps: [
    { label: 'Order Confirmed', desc: 'Order received and being processed' },
    { label: 'Payment Verified', desc: 'Secure payment authorization confirmed' },
    { label: 'Dispatched & In Transit', desc: 'Shipped via Haion logistics fleet' },
    { label: 'Out for Delivery', desc: 'Delivery partner delivering to your door' },
  ],
};

export const CART_EXTRA_FALLBACK = {
  continueShopping: 'Continue Shopping',
  subtotalLabel: 'Subtotal',
  taxNote: 'Tax and shipping cost computed at checkout. Secure simulated order placement.',
  colorLabel: 'Color:',
};

export const PRODUCT_LABELS_FALLBACK = {
  addToCart: 'Add To Cart',
  buyNow: 'Buy Now',
  goBack: 'Go Back',
  supportResponse: 'Typical response within 5 minutes',
};
