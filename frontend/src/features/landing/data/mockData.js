export const statsData = [
  { value: 50, suffix: "K+", label: "Active Customers", description: "Trusting our platform daily" },
  { value: 1, suffix: "M+", label: "Orders Placed", description: "Seamlessly shipped & delivered" },
  { value: 500, suffix: "+", label: "Cities Covered", description: "Superfast delivery network" },
  { value: 4.8, suffix: "★", label: "App Rating", description: "Based on 100K+ reviews" }
];

export const featuresData = [
  {
    title: "100% Genuine Electronics",
    description: "Sourced directly from official brand manufacturers with direct warranty protection.",
    iconName: "shield"
  },
  {
    title: "Unmatched Direct Pricing",
    description: "We bypass middlemen to bring you top-tier products at direct factory-to-consumer prices.",
    iconName: "tag"
  },
  {
    title: "Hyperfast Express Delivery",
    description: "Get your items delivered within 2 hours in supported metro cities, or 24 hours nationwide.",
    iconName: "truck"
  },
  {
    title: "Military-Grade Security",
    description: "Every purchase is protected with multi-layered encryption and flexible payment methods.",
    iconName: "lock"
  },
  {
    title: "1-Year Brand Warranty",
    description: "Every household appliance comes with an official 1-year manufacturer warranty and free home maintenance.",
    iconName: "shield"
  },
  {
    title: "Elite 24/7 Expert Support",
    description: "Not bots. Chat instantly with real electronics experts who can guide your setup.",
    iconName: "chat"
  }
];

export const categoriesData = [
  {
    id: "ac",
    title: "Air Conditioners",
    emoji: "❄️",
    description: "Energy-efficient smart inverter cooling",
    count: "5-Star Rated",
    gradient: "from-blue-600/30 to-indigo-600/30",
    color: "#3b82f6",
    subtitle: "Smart Cooling Solutions",
    longDescription: "Keep your home perfectly cool and comfortable with Haion's range of smart inverter split air conditioners. Designed with 100% copper condensers, advanced air filtration systems, and silent operations to ensure optimal sleep and energy efficiency.",
    features: ["5-Star Inverter Tech", "100% Copper Condenser", "Smart App Schedules"],
    subProducts: [
      { name: "Haion AeroBreeze 1.5T", tag: "5-Star AC", price: "₹36,999", rating: "4.8" },
      { name: "Haion AeroBreeze 2.0T", tag: "Heavy Duty", price: "₹45,999", rating: "4.9" },
      { name: "Haion AeroBreeze 1.0T", tag: "Compact Rooms", price: "₹29,999", rating: "4.7" }
    ]
  },
  {
    id: "tv",
    title: "Smart LED TVs",
    emoji: "📺",
    description: "Cinematic 4K UHD & QLED displays",
    count: "Premium Quality",
    gradient: "from-purple-600/30 to-pink-600/30",
    color: "#a855f7",
    subtitle: "Immersive Visuals",
    longDescription: "Reimagine your home entertainment with Haion's ultra-thin bezel-less smart TVs. Experience cinema-like visuals right in your living room with Dolby Vision support, HDR10+, quantum dot displays, and powerful Dolby Audio speakers.",
    features: ["Dolby Vision Support", "120Hz Refresh Rate", "Google TV OS Integrated"],
    subProducts: [
      { name: "Haion CinemaMax 55", tag: "4K UHD TV", price: "₹38,999", rating: "4.8" },
      { name: "Haion VisionPro 65", tag: "QLED Panel", price: "₹48,999", rating: "4.9" },
      { name: "Haion OLED Q1 50", tag: "Infinite Contrast", price: "₹59,999", rating: "4.9" }
    ]
  },
  {
    id: "washing",
    title: "Washing Machines",
    emoji: "🧺",
    description: "Fully automatic front & top load washers",
    count: "Ultra-Clean Tech",
    gradient: "from-amber-500/30 to-orange-600/30",
    color: "#f59e0b",
    subtitle: "Smart Care Laundry",
    longDescription: "Gentle on clothes, tough on stains. Haion's range of fully automatic front-loading and top-loading washing machines are engineered with advanced inverter direct-drive motors, custom steam-wash programs, and smart Wi-Fi scheduling.",
    features: ["Inverter Direct Drive", "Hygiene Steam Wash", "Smart Diagnosis Support"],
    subProducts: [
      { name: "Haion HydroClean Pro 7kg", tag: "Best Seller", price: "₹24,999", rating: "4.8" },
      { name: "Haion HydroClean Max 8.5kg", tag: "Large Family", price: "₹32,999", rating: "4.9" },
      { name: "Haion Semi-Auto Duo 7.5kg", tag: "Eco Wash", price: "₹12,999", rating: "4.7" }
    ]
  },
  {
    id: "refrigerator",
    title: "Refrigerators",
    emoji: "❄️",
    description: "IoT double-door & multi-door smart refrigerators",
    count: "Next-Gen Cooling",
    gradient: "from-amber-600/30 to-yellow-600/30",
    color: "#d97706",
    subtitle: "Smart Freshness Technology",
    longDescription: "Keep your food fresh longer and manage your kitchen effortlessly with Haion's IoT-enabled smart refrigerators. Featuring triple-cooling technology, digital inverter compressors, energy-efficient operations, and Wi-Fi smart controls for temperature adjustments on the fly.",
    features: ["Digital Inverter Tech", "Triple Cooling System", "Wi-Fi Smart Control"],
    subProducts: [
      { name: "Haion SmartChill Pro 450L", tag: "Best Seller", price: "₹54,999", rating: "4.8" },
      { name: "Haion FrostBreeze Duo 600L", tag: "Luxury French", price: "₹84,999", rating: "4.9" }
    ]
  },
  {
    id: "mixer",
    title: "Mixer Grinders",
    emoji: "🌪️",
    description: "Heavy duty high-torque blenders & grinders",
    count: "Kitchen Companion",
    gradient: "from-cyan-500/30 to-blue-500/30",
    color: "#06b6d4",
    subtitle: "Precision Food Prep",
    longDescription: "Tackle daily grinding, blending, and food preparation in seconds. Powered by 1000W high-torque commercial copper motors, featuring leak-proof stainless steel jars, active speed sensors, and silent fan-cooling.",
    features: ["1000W High-Torque Motor", "Leak-Proof SS Jars", "Smart Speed Sensors"],
    subProducts: [
      { name: "Haion PowerBlend X1", tag: "Heavy Duty", price: "₹8,999", rating: "4.8" },
      { name: "Haion TurboMix Pro", tag: "High Speed", price: "₹6,499", rating: "4.7" },
      { name: "Haion QuickPrep 750W", tag: "Compact", price: "₹4,999", rating: "4.6" }
    ]
  }
];

export const appExperienceScreens = [
  {
    id: "search",
    title: "AI-Powered Smart Search",
    description: "Take a photo of any gadget or describe your need. Our neural search engines match and recommend the exact models suited for you in milliseconds.",
    badge: "Discovery",
    screenContent: {
      title: "Discover gadgets",
      searchPlaceholder: "Search 'wireless noise cancelling headphones'...",
      categoryText: "Recommended for you",
      items: [
        { name: "Sony WH-1000XM5", tag: "Best ANC", price: "$349" },
        { name: "Nothing Ear (a)", tag: "Transparent Design", price: "$99" }
      ]
    }
  },
  {
    id: "wishlist",
    title: "Collaborative Wishlists",
    description: "Compare products side-by-side with full spec sheets. Share your list with friends and let them vote or add suggestions in real-time.",
    badge: "Curation",
    screenContent: {
      title: "Co-Wishlist: Setup",
      owner: "Alex + 2 friends",
      items: [
        { name: "Studio Monitor Studio 2", status: "2 votes", price: "$1999" },
        { name: "Keychron Q1 Max", status: "3 votes", price: "$219" }
      ]
    }
  },
  {
    id: "cart",
    title: "Instant Cart & Dynamic Bundling",
    description: "Add accessories dynamically. The app automatically calculates bundle discounts, saving you an average of 15% on complementary items.",
    badge: "Saving",
    screenContent: {
      title: "Your Cart",
      items: [
        { name: "MacBook Air M4", price: "$1,299", count: "1" },
        { name: "USB-C Multiport Adapter", price: "$49 (Save $20)", count: "1" }
      ],
      total: "$1,348",
      discount: "Saved $20 on bundle"
    }
  },
  {
    id: "checkout",
    title: "Biometric 1-Click Checkout",
    description: "Double tap to authenticate via FaceID or TouchID. Integrated with Apple Pay, Google Pay, credit cards, and flexible interest-free split payments.",
    badge: "Security",
    screenContent: {
      title: "Secure Checkout",
      paymentMethod: "Apple Pay (•••• 9012)",
      shipping: "Express (Delivered today by 6 PM)",
      total: "$1,348.00",
      buttonText: "Double Click to Pay"
    }
  },
  {
    id: "tracking",
    title: "Live Hyper-Local Tracking",
    description: "Watch your delivery partner on a live 3D map. From warehouse sorting to your doorstep, get live updates and estimated arrival times down to the minute.",
    badge: "Delivery",
    screenContent: {
      title: "Order #HN-8902",
      status: "Out for delivery",
      eta: "14 mins away",
      partner: "Marcus (Electric Scooter)",
      progress: 85
    }
  },
  {
    id: "notifications",
    title: "Contextual Smart Alerts",
    description: "Receive price drop alerts, flash sale countdowns, and restock notifications tailored precisely to your browsing preferences without spam.",
    badge: "Personalization",
    screenContent: {
      title: "Smart Alerts",
      alerts: [
        { title: "Price Drop Alert! 📉", desc: "Sony WH-1000XM5 fell by $50. Now $299", time: "Just now" },
        { title: "Flash Sale Alert! ⚡", desc: "AirPods Pro 2 starts in 10 minutes", time: "5m ago" }
      ]
    }
  }
];

export const productsData = [
  {
    name: "AeroPhone Pro Max",
    category: "Smartphones",
    price: "$1,099",
    rating: "4.9",
    tag: "Flagship",
    gradient: "from-indigo-600 to-purple-600",
    glowColor: "rgba(99, 102, 241, 0.4)",
    specs: ["120Hz LTPO OLED", "200MP Triple Camera", "100W Wireless Charge"]
  },
  {
    name: "QuantumBook Pro M4",
    category: "Laptops & Computing",
    price: "$1,699",
    rating: "4.8",
    tag: "Performance",
    gradient: "from-pink-600 to-purple-600",
    glowColor: "rgba(236, 72, 153, 0.4)",
    specs: ["M4 Liquid Retina", "32GB Unified Memory", "22-hour Battery Life"]
  },
  {
    name: "Aura Sound ANC-9",
    category: "Premium Audio",
    price: "$399",
    rating: "4.9",
    tag: "Audiophile",
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.4)",
    specs: ["Hi-Res Wireless Sound", "-45dB Hybrid ANC", "60 Hours Playback"]
  },
  {
    name: "Chronos Watch Ultra 3",
    category: "Smart Watches",
    price: "$449",
    rating: "4.7",
    tag: "Sports & Health",
    gradient: "from-amber-500 to-orange-600",
    glowColor: "rgba(245, 158, 11, 0.4)",
    specs: ["Dual-Frequency GPS", "7-Day Active Battery", "Advanced ECG Sensor"]
  }
];

export const offersData = [
  {
    title: "Mega Electronics Carnival",
    subtitle: "Up to 50% Off on Premium Computing",
    tag: "Festival Offer",
    badge: "Limited Time",
    gradient: "from-indigo-900/60 via-purple-900/40 to-[#030303]",
    actionText: "Claim on App",
    timeRemaining: "Ends in: 18h 42m"
  },
  {
    title: "Dynamic Cashback Deals",
    subtitle: "Earn up to 10% instant cashback with Apple Pay & crypto payments",
    tag: "Cashback",
    badge: "Always On",
    gradient: "from-cyan-900/60 via-blue-900/40 to-[#030303]",
    actionText: "Check Rewards",
    timeRemaining: "Exclusive App Reward"
  },
  {
    title: "Mid-Year Flash Sale",
    subtitle: "Premium headphones starting at just $49. Every hour, new deals.",
    tag: "Flash Sale",
    badge: "Hourly Deals",
    gradient: "from-rose-900/60 via-pink-900/40 to-[#030303]",
    actionText: "Enter Queue",
    timeRemaining: "Next batch: 09 mins"
  },
  {
    title: "EcoSmart Smart Home Bundles",
    subtitle: "Buy 3 IoT appliances, save 25% instantly. Smart styling made affordable.",
    tag: "Bundle Deal",
    badge: "Best Value",
    gradient: "from-emerald-900/60 via-teal-900/40 to-[#030303]",
    actionText: "Assemble Bundle",
    timeRemaining: "Free setup included"
  }
];

export const stepsData = [
  {
    step: "01",
    title: "Download the App",
    description: "Scan our secure QR code or find 'Haion' on the App Store or Google Play Store."
  },
  {
    step: "02",
    title: "Discover Premium Gear",
    description: "Browse 3D immersive views, compare specs, and consult our interactive shopping agent."
  },
  {
    step: "03",
    title: "One-Tap Secure Checkout",
    description: "Place your order securely using FaceID/TouchID or multi-split premium credit plans."
  },
  {
    step: "04",
    title: "Track & Receive Today",
    description: "Watch your express courier move in real-time. Delivery arrives at your desk in hours."
  }
];

export const brandsData = [
  "Apple", "Samsung", "Sony", "HP", "Dell", "Lenovo", "LG", "Bose", "JBL", "OnePlus",
  "Apple", "Samsung", "Sony", "HP", "Dell", "Lenovo", "LG", "Bose", "JBL", "OnePlus" // Duplicated for seamless marquee
];

export const testimonialsData = [
  {
    quote: "Haion completely changed how I buy gadgets. Ordering a MacBook at 1 PM and having it on my desk by 3:15 PM was mind-blowing. The packaging was absolutely pristine.",
    rating: 5,
    name: "Sarah Jenkins",
    role: "Lead Designer at Stripe",
    avatar: "👩‍💻"
  },
  {
    quote: "I was skeptical about the pricing initially, but everything is 100% official and serial numbers register directly with Apple/Sony. Support was instant and highly knowledgeable.",
    rating: 5,
    name: "David Chen",
    role: "Tech YouTuber & Creator",
    avatar: "🎥"
  },
  {
    quote: "The visual design of their app is a masterpiece. Dynamic bundling saved me $120 on my camera, microphone, and ring-light combo. Seamless 1-tap checkout via FaceID.",
    rating: 5,
    name: "Elena Rostova",
    role: "Fullstack Developer",
    avatar: "💻"
  },
  {
    quote: "Setting up my smart AC and television via the Haion app was incredibly seamless. The device synchronized instantly, and I can now schedule cooling routines with ease.",
    rating: 5,
    name: "Marcus Vance",
    role: "Hardware Engineer",
    avatar: "⚙️"
  }
];

export const faqsData = [
  {
    question: "Are all electronics on Haion genuine?",
    answer: "Absolutely. We hold direct partnership agreements with global tech companies like Apple, Sony, and Samsung. Every product is brand new, factory sealed, and includes a full official manufacturer warranty valid worldwide."
  },
  {
    question: "How does 2-hour express delivery work?",
    answer: "For major metropolitan areas, we operate local micro-fulfillment hubs. If your address falls within our delivery radius, the option will appear at checkout. A dedicated delivery partner picks up the item and drives directly to you."
  },
  {
    question: "What payment options do you support?",
    answer: "We support Apple Pay, Google Pay, all major international credit/debit cards, and premium split-payment services (Buy Now Pay Later) with 0% interest options over 3, 6, or 12 months."
  },
  {
    question: "How do I claim a discount code displayed on the web?",
    answer: "Simply tap any of the promotional cards. The app will launch automatically (or take you to the store) with the discount code pre-copied to your clipboard, and automatically applied at checkout!"
  }
];
