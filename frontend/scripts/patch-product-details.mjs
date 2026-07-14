import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/features/landing/components/sections/ProductDetails.jsx');
let content = fs.readFileSync(file, 'utf8');

const start = content.indexOf('// Full specifications for all products');
const end = content.indexOf('const AnimatedSpeedometer');

const replacement = `import { productDetailsFallback as productDetailsData } from '../../data/productDetailsFallback';
import { useCMSProductDetail } from '../../cms/hooks/useCMSProducts';

`;

content = content.slice(0, start) + replacement + content.slice(end);
fs.writeFileSync(file, content);
console.log('ProductDetails.jsx patched');
