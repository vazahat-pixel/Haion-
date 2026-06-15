import * as mupdf from 'mupdf';
import fs from 'node:fs';
import path from 'node:path';

const pdfPath = 'c:/Users/admin/Desktop/Haion-/FINAL UI.pdf';
const outDir = 'c:/Users/admin/Desktop/Haion-/.pdf-pages';

const data = fs.readFileSync(pdfPath);
const doc = mupdf.Document.openDocument(data, 'application/pdf');
const count = doc.countPages();
console.log(`Pages: ${count}`);

for (let i = 0; i < count; i++) {
  const page = doc.loadPage(i);
  // Scale 1.5 for a good balance of readability and file size
  const pixmap = page.toPixmap(mupdf.Matrix.scale(1.5, 1.5), mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pixmap.asPNG();
  fs.writeFileSync(path.join(outDir, `page-${String(i + 1).padStart(2, '0')}.png`), Buffer.from(png));
  pixmap.destroy();
  page.destroy();
}
console.log('Done');
