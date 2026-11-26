/**
 * Service CRM (/distributor/service) — every menu page of every role opens cleanly, and a complaint goes
 * through the whole UI flow: Call Centre books it → ASP acknowledges, assigns, repairs, confirms → job sheet prints.
 * Needs the local stack seeded with backend/scripts/crm-demo-seed.js (logins below, local demo only).
 */
import { test, expect } from '@playwright/test';

const PASS = 'DmsDemo@123';
const ROLES = { admin: 'CRMADMIN', cc: 'ANJU', asp: 'PY0003', wh: 'CWH47' };

async function login(page, id) {
  await page.context().clearCookies();
  await page.goto('/distributor/service/login');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('/distributor/service/login');
  await page.getByLabel('USER ID').fill(id);
  await page.getByLabel('PASSWORD').fill(PASS);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 45_000, waitUntil: 'commit' });
  await expect(page.locator('.dms-side')).toBeVisible();
}

const go = async (page, url) => { await page.evaluate((u) => { window.history.pushState({}, '', u); window.dispatchEvent(new PopStateEvent('popstate')); }, url); await page.waitForLoadState('networkidle').catch(() => {}); };

async function menuLinks(page) {
  const groups = page.locator('.dms-menu > li > button.dms-mi');
  const out = [];
  for (let i = 0; i < (await groups.count()); i += 1) {
    const g = groups.nth(i);
    if (/logout/i.test(await g.innerText())) continue;
    if ((await g.getAttribute('aria-expanded')) !== 'true') await g.click();
    const links = page.locator('.dms-menu > li.open .dms-sub a');
    for (let j = 0; j < (await links.count()); j += 1) out.push({ label: (await links.nth(j).innerText()).trim(), href: await links.nth(j).getAttribute('href') });
  }
  for (const a of await page.locator('.dms-menu > li > a.dms-mi').all()) out.push({ label: (await a.innerText()).trim(), href: await a.getAttribute('href') });
  return out;
}

for (const [role, id] of Object.entries(ROLES)) {
  test(`${role}: every menu page opens without errors`, async ({ page }) => {
    test.setTimeout(900_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
    await login(page, id);
    const links = await menuLinks(page);
    expect(links.length).toBeGreaterThan(8);
    const bad = [];
    for (const l of links) {
      const before = errors.length;
      await page.goto(l.href, { waitUntil: 'commit' });
      await expect(page.locator('h1.dms-title').first()).toBeVisible({ timeout: 30_000 }).catch(() => bad.push(`${l.label}: no title`));
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      const alert = await page.locator('.dms-alert:not(.ok)').first().textContent({ timeout: 500 }).catch(() => '');
      if (alert && /fail|error|denied|permission|not found|unknown/i.test(alert)) bad.push(`${l.label}: ${alert}`);
      if (await page.getByText(/Unknown (master|report)/).count()) bad.push(`${l.label}: unknown config`);
      if (errors.length > before) bad.push(`${l.label}: ${errors.slice(before).join(' | ')}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

test('UI flow: book complaint → acknowledge → assign → repair → confirm → print', async ({ page, context }) => {
  test.setTimeout(300_000);
  await login(page, ROLES.cc);
  await page.goto('/distributor/service/call-booking');
  await page.getByLabel('Mobile Number').fill('9123456780');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'New Complaint' }).click();
  const sel = (label, i = 1) => page.locator('.dms-form > div', { has: page.locator('label', { hasText: new RegExp(`^${label}`) }) }).locator('select').first().selectOption({ index: i });
  const fill = (label, v) => page.locator('.dms-form > div', { has: page.locator('label', { hasText: new RegExp(`^${label}`) }) }).locator('input,textarea').first().fill(v);
  await sel('Customer Category');
  await fill('Pincode', '201002');
  await fill('Customer Name', 'UI Flow Customer');
  await page.waitForTimeout(400);
  await sel('State'); await page.waitForTimeout(200); await sel('City');
  await fill('Contact No', '9123456780');
  await fill('Address', '12, Test Street');
  await page.locator('.dms-form > div', { has: page.locator('label', { hasText: /^Assign Location/ }) }).locator('select').selectOption({ label: 'TEST SERVICE (PY0003)' });
  await sel('Product'); await sel('Brand'); await page.waitForTimeout(200); await sel('Model');
  await fill('Bill Purchase Date', '2026-10-01');
  await sel('Call Type');
  await sel('Call source', 4);
  await sel('Service Type', 2);
  await page.waitForTimeout(300);
  await sel('VOC');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Complaint Details' })).toBeVisible({ timeout: 30_000 });
  const jobNo = (await page.getByText(/^Job No\.- \d+/).innerText()).replace(/\D/g, '');
  expect(jobNo).toMatch(/^\d{10}$/);
  const jobUrl = page.url();
  const jobId = jobUrl.split('/').pop();

  // ASP
  await login(page, ROLES.asp);
  await go(page, `/distributor/service/jobs/ack/${jobId}`);
  await page.locator('select').first().selectOption('Accepted');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForURL((u) => !u.pathname.includes('/jobs/ack/'), { timeout: 30_000 });
  await go(page, `/distributor/service/jobs/assign/${jobId}`);
  await page.locator('.dms-form select').first().selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Update' }).click();
  await page.waitForURL((u) => !u.pathname.includes('/jobs/assign/'), { timeout: 30_000 });
  await go(page, `/distributor/service/jobs/repair/${jobId}`);
  await page.locator('.dms-form select').first().selectOption('Repair Done');
  await page.locator('.dms-form > div', { has: page.locator('label', { hasText: /^Close Type/ }) }).locator('select').selectOption('Nothing');
  const row = page.locator('.dms-table tbody tr').first();
  await row.locator('select').nth(0).selectOption({ index: 1 });
  await row.locator('select').nth(1).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.includes('/jobs/repair/'), { timeout: 30_000 });
  await go(page, `/distributor/service/jobs/handover/${jobId}`);
  await fill('Confirm By', 'UI Flow Customer');
  await fill('Contact No', '9123456780');
  await fill('Remark', 'Working fine');
  await sel('Service Rating', 5);
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForURL((u) => !u.pathname.includes('/jobs/handover/'), { timeout: 30_000 });
  await go(page, `/distributor/service/jobs/view/${jobId}`);
  await expect(page.locator('.dms-kv').getByText('Set Delivered').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Accepted By ASC')).toBeVisible();

  // job sheet
  const print = await context.newPage();
  await print.goto(`/distributor/service/print/job/${jobId}`);
  await expect(print.getByText('CUSTOMER COPY')).toBeVisible({ timeout: 20_000 });
  await expect(print.getByText('SERVICE CENTRE COPY')).toBeVisible();
  await expect(print.getByText(jobNo).first()).toBeVisible();
  await print.close();
});

test('login rules: wrong password stays on the page, field staff cannot open the panel', async ({ page }) => {
  await page.goto('/distributor/service/login');
  await page.getByLabel('USER ID').fill('PY0003');
  await page.getByLabel('PASSWORD').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.locator('.dms-alert')).toBeVisible({ timeout: 20_000 });
  await page.getByLabel('USER ID').fill('PY0003U1');
  await page.getByLabel('PASSWORD').fill(PASS);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.locator('.dms-alert')).toContainText(/engineer app|access/i, { timeout: 20_000 });
});
