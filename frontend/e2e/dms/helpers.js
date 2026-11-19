import path from 'node:path';
import fs from 'node:fs';
import { expect } from '@playwright/test';

/** Demo accounts created by backend/scripts/dms-demo-seed.js (local demo database only). */
export const DEMO_PASSWORD = 'DmsDemo@123';
export const ROLES = {
  admin: 'dms.admin@demo.haion.local',
  ho: 'ho@demo.haion.local',
  branch: 'agra@demo.haion.local',
  dealer: 'kma@demo.haion.local',
};
export const SHOTS = path.resolve(process.cwd(), '../reference-audit/final-screenshots/localhost');

export async function login(page, email) {
  await page.goto('/distributor/login');
  await page.evaluate(() => localStorage.removeItem('erp:auth'));
  await page.goto('/distributor/login');
  await page.getByLabel('USER ID').fill(email);
  await page.getByLabel('PASSWORD').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/distributor/login'), { timeout: 45_000, waitUntil: 'commit' });
  await expect(page.locator('.dms-side')).toBeVisible();
}

/** Expand every sidebar group and return the visible menu links [{ group, label, href }]. */
export async function menuLinks(page) {
  const groups = page.locator('.dms-menu > li > button.dms-mi');
  const n = await groups.count();
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const g = groups.nth(i);
    const label = (await g.innerText()).trim();
    if (/logout/i.test(label)) continue;
    if ((await g.getAttribute('aria-expanded')) !== 'true') await g.click();
    const links = page.locator('.dms-menu > li.open .dms-sub a');
    for (let j = 0; j < (await links.count()); j += 1) {
      const a = links.nth(j);
      out.push({ group: label, label: (await a.innerText()).trim(), href: await a.getAttribute('href') });
    }
  }
  for (const a of await page.locator('.dms-menu > li > a.dms-mi').all()) {
    out.push({ group: '', label: (await a.innerText()).trim(), href: await a.getAttribute('href') });
  }
  return out;
}

/** Collect browser errors, failed API calls and 403s while a page is in use. */
export function watch(page) {
  const log = { pageErrors: [], api5xx: [], api403: [], console: [] };
  page.on('pageerror', (e) => log.pageErrors.push(String(e.message).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|DevTools|Download the React/i.test(m.text())) log.console.push(m.text().slice(0, 200)); });
  page.on('response', (r) => {
    if (!r.url().includes('/api/dms')) return;
    if (r.status() >= 500) log.api5xx.push(`${r.status()} ${new URL(r.url()).pathname}`);
    if (r.status() === 403) log.api403.push(new URL(r.url()).pathname);
  });
  return log;
}

export const slug = (s) => s.replace(/^\/distributor\//, '').replace(/[^\w-]+/g, '_').slice(0, 80);
export const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });

/** The form row (label + control) whose label text matches. */
export const field = (page, label) => page.locator('.dms-form > div').filter({ has: page.locator('label', { hasText: label }) }).first();
