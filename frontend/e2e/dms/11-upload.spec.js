/** A file field really uploads (multipart) and the record keeps the uploaded path. */
import { test, expect } from '@playwright/test';
import { login, ROLES } from './helpers.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('lead visiting card uploads and is saved', async ({ page }) => {
  await login(page, ROLES.admin);
  await page.goto('/distributor/e/lead/new');
  await page.locator('input[type=file][aria-label^="Attach Visiting Card"]').setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('link', { name: 'Current file' })).toHaveAttribute('href', /\/uploads\/.+\.png$/);
});
