import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { productsCatalogFallback } from '../src/features/landing/data/productsCatalogFallback.js';
import { productDetailsFallback } from '../src/features/landing/data/productDetailsFallback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, '../../backend/src/data/products.seed.json');

const items = [];
let order = 0;

const allCategories = ['evs', 'battery', 'charger', 'rickshaw', 'appliances', 'inverters'];

for (const category of allCategories) {
  for (const row of productsCatalogFallback[category] || []) {
    const detail = productDetailsFallback[row.id] || {};
    const effectiveCategory = detail.category || (category === 'evs' ? 'evs' : category);
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
        category: effectiveCategory,
        image: typeof row.image === 'string' ? row.image : detail.images?.[0],
        link: row.link,
      },
    });
  }
}

fs.writeFileSync(out, JSON.stringify(items, null, 2));
console.log(`Wrote ${items.length} products to ${out}`);
