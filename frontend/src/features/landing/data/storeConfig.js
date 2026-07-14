// Initial config for the enhanced EV storefront page
export const DEFAULT_STORE_CONFIG = {
  brandContent: {
    heading: "Powering the Future of Electric Mobility",
    description: "Explore our range of advanced electric scooters designed for efficiency, reliability, performance, and everyday convenience. Built with modern technology and customer-focused engineering, our vehicles deliver an exceptional riding experience while supporting sustainable transportation.",
    features: [
      { id: "f1", title: "Advanced Lithium Battery Technology", description: "High-density cells with intelligent BMS for maximum safety and life." },
      { id: "f2", title: "Reliable Performance", description: "High-torque motors providing smooth acceleration and effortless climbing." },
      { id: "f3", title: "Low Maintenance", description: "Engineered with durable components that require minimal upkeep and checkups." },
      { id: "f4", title: "Eco-Friendly Transportation", description: "Zero emissions for cleaner cities, protecting tomorrow's environment today." },
      { id: "f5", title: "Wide Service Network", description: "Authorized touchpoints always within reach for total peace of mind." },
      { id: "f6", title: "Modern Design", description: "Futuristic aesthetics combined with ergonomic comfort and style." }
    ]
  },
  productRange: {
    heading: "Our Electric Scooter Range",
    description: "Discover multiple scooter models designed to meet different riding needs, offering excellent range, comfort, durability, and style."
  },
  warrantyInfo: {
    heading: "Warranty Protection",
    description: "Every vehicle is backed by a customer-focused warranty program to ensure peace of mind and long-term ownership confidence.",
    cards: [
      { id: "w1", title: "Battery", duration: "Up to 3 Years Warranty", coverage: "Repair or Replacement Coverage" },
      { id: "w2", title: "Motor", duration: "1 Year Warranty", coverage: "Repair or Replacement Coverage" },
      { id: "w3", title: "Controller", duration: "1 Year Warranty", coverage: "Repair or Replacement Coverage" },
      { id: "w4", title: "Charger", duration: "1 Year Warranty", coverage: "Repair or Replacement Coverage" }
    ]
  },
  warrantyTerms: {
    heading: "Warranty Terms & Conditions",
    covers: [
      "Warranty covers manufacturing defects only."
    ],
    exclusions: [
      "Physical damage",
      "Accident damage",
      "Overloading damage",
      "Improper usage",
      "Unauthorized modifications",
      "Electrical alterations",
      "Negligence-related damage"
    ],
    note: "Company warranty policies may change with prior notice."
  },
  showroomInfo: {
    heading: "Our Showroom & Service Presence",
    description: "We are committed to delivering quality sales and service experiences through authorized showrooms and trained support teams.",
    features: [
      "Authorized Showrooms",
      "Trained Technicians",
      "Genuine Spare Parts",
      "Customer Support",
      "Service Assistance"
    ],
    images: [
      { id: "img1", src: "/store1.webp", title: "Haion Flagship Store", location: "Delhi NCR" },
      { id: "img2", src: "/store2.webp", title: "Haion Hub", location: "Bengaluru" },
      { id: "img3", src: "/store3.webp", title: "Haion Studio", location: "Mumbai" }
    ]
  },
  dealerInfo: {
    heading: "Become a Dealer",
    description: "Join our growing electric mobility network and build a successful business with our dealership program.",
    plans: [
      { id: "p1", level: "District Level", investment: "Investment Starting Around ₹26 Lakhs", requirement: "Large Showroom Requirement" },
      { id: "p2", level: "Tehsil Level", investment: "Investment Starting Around ₹13 Lakhs", requirement: "Medium Showroom Requirement" },
      { id: "p3", level: "Rural Level", investment: "Investment Starting Around ₹6.25 Lakhs", requirement: "Compact Showroom Requirement" }
    ],
    benefits: [
      "Brand Support",
      "Training Programs",
      "Product Assistance",
      "Marketing Support",
      "Service Guidance"
    ]
  },
  banners: {
    heroTitle: "Visit Our Stores",
    heroSubtitle: "Step into the world of Haion. Experience first-class tech solutions, witness connected smart homes in action, and take your favorite EV scooter out for a ride."
  }
};

export const getStoreConfig = () => {
  const stored = localStorage.getItem("haion_store_config");
  if (!stored) {
    localStorage.setItem("haion_store_config", JSON.stringify(DEFAULT_STORE_CONFIG));
    return DEFAULT_STORE_CONFIG;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse store config, resetting to default", e);
    return DEFAULT_STORE_CONFIG;
  }
};

export const saveStoreConfig = (config) => {
  localStorage.setItem("haion_store_config", JSON.stringify(config));
  // Dispatch a custom event to notify other components on the same page
  window.dispatchEvent(new Event("store_config_updated"));
};

export const getDealerInquiries = () => {
  const stored = localStorage.getItem("haion_dealer_inquiries");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const saveDealerInquiry = (inquiry) => {
  const inquiries = getDealerInquiries();
  const newInquiry = {
    ...inquiry,
    id: "inq_" + Date.now(),
    submittedAt: new Date().toISOString()
  };
  inquiries.push(newInquiry);
  localStorage.setItem("haion_dealer_inquiries", JSON.stringify(inquiries));
  return newInquiry;
};
