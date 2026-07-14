import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(__dirname, '../src/features/landing/components/sections/ServiceDetailsPage.jsx');
const outPath = path.join(__dirname, '../src/features/landing/data/servicesDetailFallback.js');

let src = fs.readFileSync(srcPath, 'utf8');
const start = src.indexOf('const servicesContent = {');
const end = src.indexOf('const AnimatedSpeedometer');
let block = src.slice(start, end);

const iconMap = {
  'icon: FiShield': "iconName: 'shield'",
  'icon: FiZap': "iconName: 'zap'",
  'icon: FiBattery': "iconName: 'battery'",
  'icon: FiCpu': "iconName: 'cpu'",
  'icon: FiTruck': "iconName: 'truck'",
};

for (const [from, to] of Object.entries(iconMap)) {
  block = block.split(from).join(to);
}

block = block
  .replace(/^const servicesContent/m, 'export const servicesContent')
  .replace(/^const serviceProducts/m, 'export const serviceProducts')
  .replace(/^const serviceSectionTitles/m, 'export const serviceSectionTitles')
  .replace(/^const scooterGalleryImages/m, 'export const scooterGalleryImages')
  .replace(/^const scooter360Images/m, 'export const scooter360Images')
  .replace(/image: Hprobg/g, "image: '/Hprobg.webp'")
  .replace(/image: iprobg/g, "image: '/iprobg.webp'")
  .replace(/image: x4bg/g, "image: '/x4bg.webp'")
  .replace(/image: bgRemovebgPreview/g, "image: '/bg-removebg-preview.webp'")
  .replace(/image: imgRickshaw/g, "image: '/haion-rickshaw.webp'")
  .replace(/image: imgBattery/g, "image: '/haion-battery.webp'")
  .replace(/image: imgCharger/g, "image: '/haion-charger.webp'");

const safeguardFeatures = `export const safeguardFeatureCards = [
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
`;

fs.writeFileSync(outPath, block + '\n' + safeguardFeatures + '\n');
console.log('Wrote', outPath);
