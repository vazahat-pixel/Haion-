import { expect } from '@playwright/test';

export async function assertPageLoaded(page, { urlPattern, headingPattern }) {
  await expect(page).toHaveURL(urlPattern);
  if (headingPattern) {
    await expect(page.getByRole('heading', { name: headingPattern }).first()).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
  }
}
