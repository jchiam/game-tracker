import { test, expect } from '@playwright/test';

test.describe('Neverness to Everness Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/neverness-to-everness');
  });

  test('should display the page title', async ({ page }) => {
    const title = page.locator('h1', { hasText: 'Neverness to Everness' });
    await expect(title).toBeVisible();
  });

  test('should show AuthGate when not logged in', async ({ page }) => {
    // Scope to the page body — the navbar also has a "Sign In with Google" button.
    const signInBtn = page.getByRole('main').getByRole('button', { name: /sign in with google/i });
    await expect(signInBtn).toBeVisible();
  });

  test('should show Roster and Lineups view toggle buttons', async ({ page }) => {
    const rosterBtn = page.locator('.view-btn', { hasText: 'Roster' });
    const lineupsBtn = page.locator('.view-btn', { hasText: 'Lineups' });
    await expect(rosterBtn).toBeVisible();
    await expect(lineupsBtn).toBeVisible();
    await expect(rosterBtn).toHaveClass(/active/);
  });

  test('should show game switcher', async ({ page }) => {
    const switcher = page.locator('.game-switcher');
    await expect(switcher).toBeVisible();
  });

  test('should navigate back to selection page via brand link', async ({ page }) => {
    const brand = page.locator('a.nav-brand');
    await brand.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
