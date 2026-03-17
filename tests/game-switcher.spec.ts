import { test, expect } from '@playwright/test';

test.describe('Game Switcher', () => {
  test('should NOT be visible on the selection page', async ({ page }) => {
    await page.goto('/');
    const switcher = page.locator('.game-switcher');
    await expect(switcher).not.toBeVisible();
  });

  test('should be visible on tracker pages', async ({ page }) => {
    // Go to HSR page
    await page.goto('/honkai-star-rail');
    const hsrSwitcher = page.locator('.game-switcher');
    await expect(hsrSwitcher).toBeVisible();

    // Go to Reverse 1999 page
    await page.goto('/reverse-1999');
    const r1999Switcher = page.locator('.game-switcher');
    await expect(r1999Switcher).toBeVisible();
  });

  test('should allow switching between games', async ({ page }) => {
    // Start at HSR
    await page.goto('/honkai-star-rail');

    // Open switcher
    await page.click('.switcher-trigger');
    const dropdown = page.locator('.switcher-dropdown');
    await expect(dropdown).toBeVisible();

    // Click Reverse 1999
    await page.click('.dropdown-item:has-text("Reverse: 1999")');

    // Verify navigation
    await expect(page).toHaveURL(/\/reverse-1999/);

    // Open switcher again
    await page.click('.switcher-trigger');

    // Click Honkai Star Rail
    await page.click('.dropdown-item:has-text("Honkai Star Rail")');

    // Verify navigation back
    await expect(page).toHaveURL(/\/honkai-star-rail/);
  });

  test('should close dropdown when searching outside', async ({ page }) => {
    await page.goto('/honkai-star-rail');
    await page.click('.switcher-trigger');
    await expect(page.locator('.switcher-dropdown')).toBeVisible();

    // Click on the page background or some other element
    await page.click('body', { position: { x: 0, y: 0 } });
    await expect(page.locator('.switcher-dropdown')).not.toBeVisible();
  });

  test('should allow navigating back to selection page from dropdown', async ({ page }) => {
    await page.goto('/honkai-star-rail');
    await page.click('.switcher-trigger');
    await page.click('.back-link');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.game-switcher')).not.toBeVisible();
  });
});
