import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('brand title in navbar should navigate back to selection page from HSR page', async ({
    page,
  }) => {
    // Start at HSR page
    await page.goto('/honkai-star-rail');

    // Check we are actually on the HSR page by looking for specific content
    // Based on App.tsx, the HsrPage is element
    // Let's assume there is something that identifies it
    await expect(page).toHaveURL(/\/honkai-star-rail/);

    // Click the brand title
    const brandLabel = page.locator('.nav-brand');
    await brandLabel.click();

    // Verify we are back on the selection page
    await expect(page).toHaveURL(/\/$/);
    const selectionTitle = page.locator('h1');
    await expect(selectionTitle).toContainText('Select Game');
  });

  test('brand title in navbar should navigate back to selection page from Reverse 1999 page', async ({
    page,
  }) => {
    // Start at Reverse 1999 page
    await page.goto('/reverse-1999');

    await expect(page).toHaveURL(/\/reverse-1999/);

    // Click the brand title
    const brandLabel = page.locator('.nav-brand');
    await brandLabel.click();

    // Verify we are back on the selection page
    await expect(page).toHaveURL(/\/$/);
  });
});
