import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landing = path.join(__dirname, '../src/features/landing');

const imgMap = {
  evX1: '/x1bg2.webp',
  evX1Plus: '/sc06-removebg-preview.webp',
  evX2: '/oxplusf1.webp',
  applianceVacuum: '/appliance-vacuum.webp',
  appliancePurifier: '/appliance-purifier.webp',
  applianceTv: '/appliance-tv.webp',
  refri1: '/refri-removebg-preview.webp',
  refri2: '/refri2-removebg-preview.webp',
  mixer2: '/mixer2-removebg-preview.webp',
  mixer1: '/mixer1-removebg-preview.webp',
  tv2: '/tv2.webp',
  tv3: '/tv3.webp',
  tv4: '/tv4.webp',
  tv5: '/tv5.webp',
  ac: '/ac-removebg-preview.webp',
  imgBattery: '/haion-battery.webp',
  imgCharger: '/haion-charger.webp',
  imgRickshaw: '/haion-rickshaw.webp',
  bgRemovebgPreview: '/bg-removebg-preview.webp',
  Hprobg: '/Hprobg.webp',
  iprobg: '/iprobg.webp',
  x3plusbg: '/x3plusbg.webp',
  x4bg: '/x4bg.webp',
};

function replaceImages(text) {
  let out = text;
  for (const [key, url] of Object.entries(imgMap)) {
    out = out.replace(new RegExp(`image:\\s*${key}\\b`, 'g'), `image: '${url}'`);
    out = out.replace(new RegExp(`images:\\s*\\[${key}`, 'g'), `images: ['${url}'`);
    out = out.replace(new RegExp(`,\\s*${key}([,\\]])`, 'g'), `, '${url}'$1`);
    out = out.replace(new RegExp(`\\[${key}([,\\]])`, 'g'), `['${url}'$1`);
    out = out.replace(new RegExp(`,\\s*${key}\\s*\\]`, 'g'), `, '${url}']`);
  }
  return out;
}

// Product details
const pdPath = path.join(landing, 'components/sections/ProductDetails.jsx');
const pdContent = fs.readFileSync(pdPath, 'utf8');
const pdStart = pdContent.indexOf('const productDetailsData = {');
const speedIdx = pdContent.indexOf('const AnimatedSpeedometer');
let pdBlock = pdContent.slice(pdStart, speedIdx).trim();
pdBlock = pdBlock.replace(/^const productDetailsData = /, 'export const productDetailsFallback = ');
pdBlock = replaceImages(pdBlock);
fs.writeFileSync(path.join(landing, 'data/productDetailsFallback.js'), `${pdBlock}\n`);

// Products catalog
const ptPath = path.join(landing, 'components/sections/ProductsTabs.jsx');
const ptContent = fs.readFileSync(ptPath, 'utf8');
const ptStart = ptContent.indexOf('export const productsData = {');
const ptEnd = ptContent.indexOf('};', ptStart) + 2;
let ptBlock = ptContent.slice(ptStart, ptEnd);
ptBlock = ptBlock.replace('export const productsData', 'export const productsCatalogFallback');
ptBlock = replaceImages(ptBlock);
fs.writeFileSync(path.join(landing, 'data/productsCatalogFallback.js'), `${ptBlock}\n`);

console.log('Extracted landing data files');
