const evX1 = '/x1bg2.webp';

export const servicesContent = {
  safeguard: {
    id: 'safeguard',
    iconName: 'shield',
    title: 'Safeguard (New Innovation)',
    subtitle: 'Intellectually designed protective systems shielding your electric vehicles and batteries from power surges and thermal overloads.',
    description: 'Our patent-pending Safeguard technology provides continuous monitoring of battery voltages and motor currents. By integrating real-time telemetry with our smart BMS, it automatically isolates critical components during power anomalies, preventing short circuits and thermal runaway.',
    specs: [
      { label: 'Surge Protection', val: 'Up to 10kV dynamic voltage protection' },
      { label: 'Thermal Cut-off', val: 'Instant isolation trigger at 65°C' },
      { label: 'BMS Integration', val: 'Continuous sync with Haion Mobile App' },
      { label: 'Auto-Recovery', val: 'Self-diagnosing automatic system reset' }
    ]
  },
  scooter: {
    id: 'scooter',
    iconName: 'zap',
    title: 'Electric Scooters',
    subtitle: 'Experience the next-generation of urban commuting. Powered by clean battery packs and high-torque BLDC hub motors.',
    description: 'Haion electric scooters combine aerodynamics, digital consoles, and robust chassis engineering to deliver a smooth, quiet, and eco-friendly ride. Configured with front disc brakes, central locking, and GPS tracking, urban transit is safer and smarter than ever.',
    specs: [
      { label: 'Max Speed', val: 'Up to 65 KM/H (in Sport Mode)' },
      { label: 'IDC Range', val: '70 KM - 200 KM' },
      { label: 'Warranty', val: '3 Years Warranty' },
      { label: 'Suspension', val: 'Telescopic front and double-spring rear' }
    ]
  },
  battery: {
    id: 'battery',
    iconName: 'battery',
    title: 'Lithium-Ion Battery Packs',
    subtitle: 'State-of-the-art smart batteries with integrated BMS (Battery Management System), cell balancing, and high energy density.',
    description: 'Our battery packs are engineered with premium Grade-A cells and custom metal casing to ensure structural durability. The built-in cell-balancing hardware maximizes both range and lifecycle, making them reliable powerhouses for long daily commutes.',
    specs: [
      { label: 'Chemistry', val: 'Advanced Lithium Iron Phosphate (LFP) / NMC' },
      { label: 'Cycles', val: '3000+ charging cycles at 80% capacity' },
      { label: 'Protection', val: 'IP67 dust and water resistance' },
      { label: 'Charging', val: 'Fast-charging support (0 to 80% in 1.5 hours)' }
    ]
  },
  charger: {
    id: 'charger',
    iconName: 'cpu',
    title: 'Smart EV Chargers',
    subtitle: 'Intelligent fast chargers configured with automatic power-cut mechanisms to secure battery lifespans.',
    description: 'Haion smart chargers detect the battery charge levels in real-time. Once the pack reaches 100% capacity, the charger safely cuts off power to avoid overcharging, swelling, and heating, thereby extending the long-term battery health.',
    specs: [
      { label: 'Input Range', val: '180V to 260V AC wide input support' },
      { label: 'Auto Cut-off', val: 'Intelligent power disconnection' },
      { label: 'Cooling', val: 'Silent active fan cooling mechanism' },
      { label: 'Indicators', val: 'LED charge status and fault indicators' }
    ]
  },
  rickshaw: {
    id: 'rickshaw',
    iconName: 'truck',
    title: 'Heavy-Duty E-Rickshaw Vehicles',
    subtitle: 'Engineered for robust passenger transport, loading capacity, and high-efficiency performance on Indian roads.',
    description: 'Designed to handle rugged street conditions, our E-Rickshaws feature reinforced steel chassis, dual-leaf spring suspensions, and high-efficiency gearboxes. They provide clean, profitable livelihood solutions for transit operators nationwide.',
    specs: [
      { label: 'Motor Power', val: '1200W high-torque brushless gear motor' },
      { label: 'Loading Weight', val: 'Up to 500 K.G. passenger/cargo capacity' },
      { label: 'Range', val: 'Up to 150 KM with dual battery setup' },
      { label: 'Braking', val: 'Mechanical drum brakes with parking lock' }
    ]
  }
};

export const serviceProducts = {
  scooter: [
    {
      id: 'x1',
      name: 'X1',
      subtitle: 'Smart, Eco-Friendly EV Scooter for Urban Commuting',
      image: evX1,
      tag: 'Sale',
      price: '₹70,000'
    },
    {
      id: 'x1plus',
      name: 'X1Plus',
      subtitle: 'Your Everyday Green Ride – EV Scooter',
      image: '/x1plusbg.webp',
      tag: 'Sale',
      price: '₹78,000'
    },
    {
      id: 'x2',
      name: 'X2',
      subtitle: 'Reimagine Urban Travel with Our EV Scooter',
      image: '/x2f1.webp',
      tag: 'Sale',
      price: '₹72,000'
    },
    {
      id: 'x2plus',
      name: 'X2Plus',
      subtitle: 'High-Performance Smart EV Scooter',
      image: '/x2plusbg.webp',
      tag: 'New',
      price: '₹80,000'
    },
    {
      id: 'x3',
      name: 'X3',
      subtitle: 'Adventure Ready Premium EV Scooter',
      image: '/x3bg1.webp',
      tag: 'New',
      price: '₹85,000'
    },
    {
      id: 'x4plus',
      name: 'X4Plus',
      subtitle: 'Ultra Range Smart EV Scooter',
      image: '/x4plusbg.webp',
      tag: 'New',
      price: '₹90,000'
    },
    {
      id: 'spro',
      name: 'S Pro',
      subtitle: 'Elegant High-Speed Smart EV Scooter',
      image: '/sprobg.webp',
      tag: 'Premium',
      price: '₹1,15,000'
    },
    {
      id: 'oxplus',
      name: 'OX Plus',
      subtitle: 'Ultimate Power & Intelligent EV Scooter',
      image: '/oxplus2.webp',
      tag: 'Elite',
      price: '₹90,000'
    },
    {
      id: 'hpro',
      name: 'H pro',
      subtitle: 'Premium Smart Commuter Scooter',
      image: '/Hprobg.webp',
      tag: 'New',
      price: '₹1,24,999'
    },
    {
      id: 'ipro',
      name: 'I pro',
      subtitle: 'Intelligent Green Mobility Scooter',
      image: '/iprobg.webp',
      tag: 'New',
      price: '₹1,29,999'
    },
    {
      id: 'x4',
      name: 'X4',
      subtitle: 'Next-Generation High-Speed Scooter',
      image: '/x4bg.webp',
      tag: 'New',
      price: '₹1,14,999'
    },
    {
      id: 'x3plus',
      name: 'X3 plus',
      subtitle: 'Adventure Ready Plus Smart Scooter',
      image: '/bg-removebg-preview.webp',
      tag: 'New',
      price: '₹1,09,999'
    }
  ],
  battery: [
    {
      id: 'bat_48v',
      name: 'B1-48V PowerPack',
      subtitle: '48V 24Ah Lithium-Ion Battery Pack with Smart BMS',
      image: '/battery2-removebg-preview.webp',
      tag: 'New',
      price: '₹28,999'
    },
    {
      id: 'bat_60v',
      name: 'B2-60V EnergyMax',
      subtitle: '60V 30Ah High-Performance Lithium Battery Pack',
      image: '/battrey3-removebg-preview.webp',
      tag: 'New',
      price: '₹36,999'
    },
    {
      id: 'bat_72v',
      name: 'B3-72V UltraPower',
      subtitle: '72V 35Ah Long-Range Lithium-Ion Battery Pack',
      image: '/battery2-removebg-preview.webp',
      tag: 'New',
      price: '₹45,999'
    }
  ],
  charger: [
    {
      id: 'chg_standard',
      name: 'C1-Standard',
      subtitle: '48V-72V Auto-Detect Smart EV Charger',
      image: '/charger-removebg-preview.webp',
      tag: 'Sale',
      price: '₹4,999'
    },
    {
      id: 'chg_fast',
      name: 'C2-Fast Charger',
      subtitle: '10A Quick Charging Support for EV Scooters',
      image: '/charger3-removebg-preview.webp',
      tag: 'Best Seller',
      price: '₹7,999'
    },
    {
      id: 'chg_smart',
      name: 'C3-Smart IoT Charger',
      subtitle: 'App-Connected Smart Charger with Auto Cut-off',
      image: '/charger-removebg-preview.webp',
      tag: 'New',
      price: '₹11,999'
    }
  ],
  rickshaw: [
    {
      id: 'er_passenger',
      name: 'R1-Passenger',
      subtitle: 'Heavy-Duty 4-Passenger E-Rickshaw for Indian Roads',
      image: '/haion-rickshaw.webp',
      tag: 'Sale',
      price: '₹1,24,999'
    },
    {
      id: 'er_cargo',
      name: 'R2-Cargo',
      subtitle: 'High-Capacity Goods Carrier E-Rickshaw',
      image: '/haion-rickshaw.webp',
      tag: 'New',
      price: '₹1,34,999'
    },
    {
      id: 'er_loader',
      name: 'R3-Loader',
      subtitle: 'Reinforced Closed Cabin Delivery E-Rickshaw',
      image: '/haion-rickshaw.webp',
      tag: 'New',
      price: '₹1,44,999'
    }
  ]
};

export const serviceSectionTitles = {
  scooter: { main: "Electrical", highlight: "Products" },
  battery: { main: "Lithium Battery", highlight: "Packs" },
  charger: { main: "Smart EV", highlight: "Chargers" },
  rickshaw: { main: "E-Rickshaw", highlight: "Vehicles" }
};

export const scooterGalleryImages = [
  { img: '/OXplusf2.webp', title: 'X1 (Matte Black)', desc: 'Front-facing aerodynamic view' },
  { img: '/sc06-removebg-preview.webp', title: 'X1Plus (Aero Pink)', desc: 'Sleek premium commuter look' },
  { img: '/oxplusf1.webp', title: 'X2 (Carbon Grey)', desc: 'Urban street design profile' },
  { img: '/sc013.webp', title: 'X2 (Sport Pink)', desc: 'Stylish side profile' },
  { img: '/scooter-removebg-preview.webp', title: 'X1 (Classic Blue)', desc: 'Traditional clean signature finish' }
];

export const scooter360Images = [
  '/HRF00193.JPG-removebg-preview.webp',
  '/OXplusf2.webp',
  '/OXplusf.webp',
  '/HRF00197.JPG-removebg-preview.webp',
  '/HRF00199.JPG-removebg-preview.webp',
  '/oxplusf1.webp',
  '/oxplusf3.webp',
  '/HRF00202.JPG-removebg-preview.webp'
];


export const safeguardFeatureCards = [
  { title: 'Prevents Electric Shocks', desc: 'Detects leakage currents and instantly cuts off power before injury occurs.', image: '/safeguard_prevent_shock.webp' },
  { title: 'Life-Saving Speed', desc: 'Responds in less than 0.5 seconds, well within the safe human tolerance time for electrical exposure.', image: '/safeguard_fast_speed.webp' },
  { title: 'Continuous Ground Monitoring', desc: 'Alerts you if your ground connection becomes loose or broken, avoiding hidden risks.', image: '/safeguard_ground_monitoring.webp' },
  { title: 'Fire Risk Reduction', desc: 'Stops leakage currents that could cause overheating and electrical fires.', image: '/safeguard_fire_risk.webp' },
  { title: 'Meets Global Safety Standards', desc: 'Built to UL943 specifications, ensuring compliance with international safety norms.', image: '/safeguard_standards.webp' },
  { title: 'Essential for Indian Conditions', desc: 'Designed to handle fluctuating voltage and varied installation quality in India.', image: '/safeguard_indian_conditions.webp' },
];

export const safeguardUserBenefits = [
  { title: 'Protects People', desc: 'Reduces the risk of electrocution, especially in wet areas like kitchens, bathrooms, and outdoors.' },
  { title: 'Protects Appliances', desc: 'Prevents damage to expensive electronics from faulty wiring or surge events.' },
  { title: 'Prevents Fires', desc: 'Cuts power before overheating can ignite surrounding materials.' },
  { title: 'Peace of Mind', desc: 'Continuous monitoring means you are protected 24/7 without manual checks.' },
  { title: 'Easy Installation', desc: 'Compact design fits standard Indian electrical panels with minimal modification.' },
  { title: 'Smart Alerts', desc: 'Instant mobile notifications when a fault is detected or isolated.' },
];

export const safeguardSectionTitles = {
  features: 'Why the Safeguard is Important',
  benefits: 'Key Benefits for Users',
  useCases: 'Protection Use Cases',
  useCasesImage: '/safeguard_protection_usecases.webp',
};

