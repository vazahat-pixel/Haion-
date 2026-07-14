import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { productsCatalogFallback } from '../src/features/landing/data/productsCatalogFallback.js';
import { productDetailsFallback } from '../src/features/landing/data/productDetailsFallback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '../../backend/src/data/products.seed.json');

const items = [];
let order = 0;

for (const category of ['evs', 'appliances']) {
  for (const row of productsCatalogFallback[category] || []) {
    const detail = productDetailsFallback[row.id] || {};
    items.push({
      collection: 'products',
      order: order++,
      isVisible: true,
      data: {
        ...detail,
        id: row.id,
        name: row.name ?? detail.name,
        subtitle: row.subtitle ?? detail.subtitle,
        price: row.price ?? detail.price,
        tag: row.tag,
        category: detail.category || category.replace(/s$/, '') === 'ev' ? 'evs' : category,
        image: typeof row.image === 'string' ? row.image : detail.images?.[0],
        link: row.link,
      },
    });
  }
}

// Inverters
const inverters = [
  { id: 'inv1', name: 'Haion PowerGuard 1100', subtitle: 'Smart Sine Wave Home UPS Inverter with IoT Battery Monitoring', image: '/haion_inverter.webp', price: '₹ 6,999', tag: 'Best Seller', category: 'inverters', features: ['Pure Sine Wave Output', 'Smart WiFi App Tracking', 'Turbo Charging (Fast recovery)'] },
  { id: 'inv2', name: 'Haion SuperCharge 1500', subtitle: 'Heavy-Duty Smart Inverter with Eco & UPS Dual Mode Toggle', image: '/haion_inverter.webp', price: '₹ 9,499', tag: 'New Launch', category: 'inverters', features: ['High Load Capacity', 'Eco & UPS Dual Mode', 'Short Circuit & Overload protection'] },
  { id: 'inv3', name: 'Haion Solar Hybrid 2000', subtitle: 'Advanced Solar Hybrid Inverter with Intelligent Grid Sharing', image: '/haion_inverter.webp', price: '₹ 14,999', tag: 'Solar Tech', category: 'inverters', features: ['High Efficiency MPPT Charger', 'Solar Grid Intelligent Sharing', 'Digital LCD Status Display'] },
];
for (const inv of inverters) {
  items.push({ collection: 'products', order: order++, isVisible: true, data: inv });
}

fs.writeFileSync(out, JSON.stringify(items, null, 2));
console.log(`Wrote ${items.length} products to ${out}`);
