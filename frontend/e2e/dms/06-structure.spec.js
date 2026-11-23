/**
 * Extracts the structure of every local Distributor page (title, table columns, form labels, fields, buttons, tabs,
 * and the "Add" form behind the page's add button) into reference-audit/reference-structure/local-pages.json, in the
 * same shape as the reference crawl, so tools/compare-structure.mjs can list the differences page by page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { login, ROLES, menuLinks } from './helpers.js';

const OUT = path.resolve(process.cwd(), '../reference-audit/reference-structure/local-pages.json');

async function extract(page) {
  await page.locator('.dms-loading').first().waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const main = document.querySelector('.dms-main') || document.body;
    const t = (e) => (e?.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      url: location.pathname,
      title: t(main.querySelector('h1')),
      tables: [...main.querySelectorAll('table')].map((tb) => [...tb.querySelectorAll('thead th')].map(t)).filter((h) => h.length),
      labels: [...main.querySelectorAll('label.dms-label, .dms-filter label, label')].map(t).filter(Boolean),
      fields: [...main.querySelectorAll('input, select, textarea')].filter((e) => e.type !== 'hidden').map((e) => ({ tag: e.tagName.toLowerCase(), type: e.type, name: e.name || e.getAttribute('aria-label') || '', options: e.tagName === 'SELECT' ? [...e.options].map((o) => t(o)).slice(0, 15) : undefined })),
      buttons: [...main.querySelectorAll('button, a.dms-btn')].map((b) => ({ text: t(b), go: b.getAttribute('href') || '' })).filter((b) => b.text),
      tabs: [...main.querySelectorAll('[role=tab]')].map(t),
      rowActions: (() => { const r = main.querySelector('table tbody tr'); return r ? [...r.querySelectorAll('a, button')].map((a) => a.getAttribute('title') || a.getAttribute('aria-label') || t(a)).filter(Boolean) : []; })(),
    };
  });
}

test('extract local page structure', async ({ page }) => {
  test.setTimeout(1_800_000);
  await login(page, ROLES.admin);
  const links = await menuLinks(page);
  const out = [];
  for (const l of links) {
    if (!l.href || /logout/i.test(l.label)) continue;
    const row = { group: l.group, label: l.label };
    try {
      await page.goto(l.href);
      Object.assign(row, await extract(page));
      const add = row.buttons.find((b) => b.go && /add|new/i.test(b.text) && b.go.startsWith('/distributor'));
      if (add) { await page.goto(add.go); row.addPage = await extract(page); }
    } catch (e) { row.error = String(e).slice(0, 200); }
    out.push(row);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
});
