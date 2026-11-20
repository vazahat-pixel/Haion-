/**
 * Page-by-page structural comparison: reference crawl (reference-structure/reference-pages.json, read from the live
 * reference sidebar pages + their "Add" pages) vs local crawl (reference-structure/local-pages.json, from
 * frontend/e2e/dms/06-structure.spec.js). Writes reference-audit/structure-diff.md and structure-diff.json.
 *   node reference-audit/tools/compare-structure.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref = JSON.parse(fs.readFileSync(path.join(ROOT, 'reference-structure/reference-pages.json'), 'utf8'));
const loc = JSON.parse(fs.readFileSync(path.join(ROOT, 'reference-structure/local-pages.json'), 'utf8'));

const norm = (s) => String(s || '').replace(/[⇅▲▼*:]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const NOISE = /^(show\s*\d|search|previous|next|\d+|first|last|×|close|export|copy|csv|excel|pdf|print)$/i;
const clean = (arr) => [...new Set((arr || []).map(norm).filter((x) => x && !NOISE.test(x) && !/^show\s*\d/.test(x)))];
const mainTable = (p) => (p?.tables || []).reduce((a, t) => (t.length > a.length ? t : a), []);
const minus = (a, b) => { const B = new Set(b); return a.filter((x) => !B.has(x)); };
const key = (g, l) => `${norm(g)}>${norm(l)}`;
const localByKey = new Map(loc.map((p) => [key(p.group, p.label), p]));

function diffPage(r, l) {
  const out = {};
  if (!l) return { missingPage: true };
  if (norm(r.title) && norm(r.title) !== norm(l.title)) out.title = [r.title, l.title];
  const rc = clean(mainTable(r)); const lc = clean(mainTable(l));
  const mc = minus(rc, lc); const xc = minus(lc, rc);
  if (mc.length) out.missingColumns = mc;
  if (xc.length) out.extraColumns = xc;
  if (rc.length && lc.length && !mc.length && !xc.length && rc.join('|') !== lc.join('|')) out.columnOrder = [rc, lc];
  const ml = minus(clean(r.labels), clean(l.labels));
  if (ml.length) out.missingLabels = ml;
  const mb = minus(clean((r.buttons || []).map((b) => b.text)), clean((l.buttons || []).map((b) => b.text)));
  if (mb.length) out.missingButtons = mb;
  const mt = minus(clean(r.tabs), clean(l.tabs));
  if (mt.length) out.missingTabs = mt;
  if (r.addPage && !r.addPage.error) {
    if (!l.addPage) out.missingAddPage = r.addPage.title || true;
    else {
      const a = diffPage(r.addPage, l.addPage);
      delete a.missingPage;
      if (Object.keys(a).length) out.add = a;
    }
  }
  return out;
}

const rows = ref.map((r) => {
  const l = localByKey.get(key(r.group, r.label));
  return { group: r.group, label: r.label, refUrl: r.url, localUrl: l?.url, diff: r.error ? { refError: r.error } : diffPage(r, l) };
});
const extraLocal = loc.filter((l) => !ref.some((r) => key(r.group, r.label) === key(l.group, l.label))).map((l) => `${l.group} > ${l.label}`);

const count = (d) => (d.missingPage ? 1 : 0) + (d.title ? 1 : 0) + (d.missingColumns?.length || 0) + (d.missingLabels?.length || 0) + (d.missingButtons?.length || 0) + (d.missingTabs?.length || 0) + (d.missingAddPage ? 1 : 0) + (d.add ? count(d.add) : 0);
const fmt = (d) => Object.entries(d).map(([k, v]) => (k === 'add' ? `**add page:** ${fmt(v)}` : `${k}: ${Array.isArray(v) ? (Array.isArray(v[0]) ? v.map((x) => x.join(', ')).join(' ⟶ ') : v.join(', ')) : v}`)).join('; ');

const same = rows.filter((r) => !count(r.diff) && !r.diff.refError);
let md = `# Reference vs local — page structure diff\n\nGenerated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} by tools/compare-structure.mjs.\n`;
md += `Reference pages read: **${ref.length}** (sidebar of the logged-in reference account + each page's Add form). Local pages read: **${loc.length}**.\n`;
md += `Pages with no structural difference: **${same.length}**. Pages with differences: **${rows.length - same.length}**.\n\n`;
md += 'Compared: page title, main table columns (set and order), form labels, buttons, tabs, and the same for the Add page. Ignored: DataTables paging/search chrome.\n\n';
md += '| # | Group | Page | Reference | Local | Differences |\n|---|---|---|---|---|---|\n';
rows.forEach((r, i) => { md += `| ${i + 1} | ${r.group} | ${r.label} | ${r.refUrl || ''} | ${r.localUrl || '—'} | ${count(r.diff) || r.diff.refError ? fmt(r.diff).replace(/\|/g, '/') : 'none'} |\n`; });
md += `\n## Local pages not in this reference account's sidebar\n\n${extraLocal.map((x) => `- ${x}`).join('\n') || '- none'}\n`;
fs.writeFileSync(path.join(ROOT, 'structure-diff.md'), md);
fs.writeFileSync(path.join(ROOT, 'reference-structure/structure-diff.json'), JSON.stringify({ rows, extraLocal }, null, 1));
console.log(`ref ${ref.length} | local ${loc.length} | same ${same.length} | with differences ${rows.length - same.length} | local-only ${extraLocal.length}`);
