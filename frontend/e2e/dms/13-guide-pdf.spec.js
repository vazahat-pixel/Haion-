/**
 * Builds docs/HAION-System-Guide.pdf from docs/guide/guide.html with fresh screenshots of the running app.
 * Runs only when GUIDE=1 (it is a build step, not a test):
 *   GUIDE=1 PLAYWRIGHT_BASE_URL=http://localhost:5273 npx playwright test -c playwright.dms.config.js 13-guide
 */
import path from 'node:path';
import fs from 'node:fs';
import { test, expect } from '@playwright/test';

const DOCS = path.resolve(process.cwd(), '../docs');
const IMG = path.join(DOCS, 'guide', 'img');
const PASS = 'DmsDemo@123';

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
async function shot(page, url, name, waitFor) {
  await page.goto(url);
  if (waitFor) await expect(page.locator(waitFor).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(IMG, `${name}.png`) });
}

test('build the system guide PDF', async ({ page, browser }) => {
  test.skip(process.env.GUIDE !== '1', 'set GUIDE=1 to build the PDF');
  test.setTimeout(600_000);
  fs.mkdirSync(IMG, { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });

  await shot(page, '/distributor/service/login', 'crm-login', '#crm-user');
  await page.goto('/distributor/login'); await page.waitForTimeout(1200); await page.screenshot({ path: path.join(IMG, 'dms-login.png') });

  await login(page, 'CRMADMIN');
  await shot(page, '/distributor/service/home', 'crm-admin-home', '.dms-tile');
  await shot(page, '/distributor/service/dash/asp-tat', 'crm-report', 'h1.dms-title');
  await login(page, 'ANJU');
  await page.goto('/distributor/service/call-booking');
  await page.getByLabel('Mobile Number').fill('8826693947');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('Registered Product Details')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(IMG, 'crm-call-booking.png') });
  await login(page, 'PY0003');
  await shot(page, '/distributor/service/jobs/asp', 'crm-asp-jobs', '.dms-table tbody tr td');
  const firstJob = await page.locator('.dms-table tbody tr a[href*="/jobs/view/"]').first().getAttribute('href');
  await shot(page, firstJob, 'crm-job-view', 'text=History');
  const id = firstJob.split('/').pop();
  await shot(page, `/distributor/service/print/job/${id}`, 'crm-jobsheet', 'text=CUSTOMER COPY');
  await login(page, 'CWH47');
  await shot(page, '/distributor/service/wh/po', 'crm-wh-po', 'h1.dms-title');

  const dmsHome = 'C:/Users/admin/AppData/Local/Temp/mshots/m-home.png';
  if (fs.existsSync(dmsHome)) fs.copyFileSync(dmsHome, path.join(IMG, 'dms-home.png'));

  const html = fs.readFileSync(path.join(DOCS, 'guide', 'guide.html'), 'utf8').replace('{{DATE}}', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
  const tmp = path.join(DOCS, 'guide', '_render.html');
  fs.writeFileSync(tmp, html);
  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file:///${tmp.replace(/\\/g, '/')}`);
  await pdfPage.waitForTimeout(800);
  await pdfPage.pdf({
    path: path.join(DOCS, 'HAION-System-Guide.pdf'), format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">HAION — Distributor &amp; Service System Guide · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  });
  fs.unlinkSync(tmp);
  expect(fs.statSync(path.join(DOCS, 'HAION-System-Guide.pdf')).size).toBeGreaterThan(100_000);
});
