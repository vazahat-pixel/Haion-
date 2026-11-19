/**
 * Every menu entry each role can see must open without a crash, without a server error and without a 403
 * (a 403 here would mean the menu offers a page the server refuses: a menu/permission mismatch).
 * A screenshot of every page is saved for the evidence package.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { login, menuLinks, watch, ROLES, SHOTS, slug, ensureDir } from './helpers.js';

for (const [role, email] of Object.entries(ROLES)) {
  test(`role crawl: ${role}`, async ({ page }) => {
    test.setTimeout(2_400_000);
    await login(page, email);
    const links = await menuLinks(page);
    expect(links.length).toBeGreaterThan(0);
    const dir = path.join(SHOTS, role);
    ensureDir(dir);
    const results = [];
    let i = 0;
    for (const l of links) {
      i += 1;
      const log = watch(page);
      await page.goto(l.href);
      await page.locator('.dms-side').waitFor({ timeout: 15_000 }).catch(() => {});
      await page.waitForFunction(() => !document.querySelector('.dms-loading') && ![...document.querySelectorAll('.dms-table td')].some((td) => td.textContent === 'Loading…'), null, { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(250);
      const crashed = await page.getByText(/something went wrong|unexpected application error/i).count();
      const title = (await page.locator('.dms-title').first().textContent().catch(() => '')) || '';
      const hasContent = await page.locator('.dms-title, .dms-tiles').count();
      const file = path.join(dir, `${String(i).padStart(3, '0')}-${slug(l.href)}.png`);
      await page.screenshot({ path: file });
      results.push({ ...l, title: title.trim(), crashed: crashed > 0, empty: hasContent === 0, ...log, screenshot: path.relative(SHOTS, file) });
      page.removeAllListeners('pageerror'); page.removeAllListeners('response'); page.removeAllListeners('console');
      fs.writeFileSync(path.join(SHOTS, `crawl-${role}.json`), JSON.stringify(results, null, 2));
    }
    fs.writeFileSync(path.join(SHOTS, `crawl-${role}.json`), JSON.stringify(results, null, 2));
    const bad = results.filter((r) => r.crashed || r.empty || r.pageErrors.length || r.api5xx.length || r.api403.length);
    expect(bad.map((b) => ({ href: b.href, crashed: b.crashed, empty: b.empty, pageErrors: b.pageErrors, api5xx: b.api5xx, api403: b.api403 }))).toEqual([]);
  });
}
