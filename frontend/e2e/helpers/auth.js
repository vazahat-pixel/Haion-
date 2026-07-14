export async function loginAs(page, { email, password }) {
  await page.goto('/auth/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

export async function logoutIfNeeded(page) {
  const logout = page.getByRole('button', { name: /log out|logout|sign out/i });
  if (await logout.isVisible().catch(() => false)) {
    await logout.click();
  }
}
