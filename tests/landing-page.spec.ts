import { test, expect } from '@playwright/test';

test.describe('Navigation and Initial Load', () => {
  test('should load the home page and show the brand title', async ({ page }) => {
    await page.goto('/');

    // Check if the brand title is present in the navbar
    const brand = page.locator('.nav-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('Astral Express Tracker');
  });

  test('should show the hero section and title', async ({ page }) => {
    await page.goto('/');

    // Check for the main hero title
    const title = page.locator('.hero .title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Trailblazer Roster');
  });

  test('should show AuthGate when not signed in', async ({ page }) => {
    await page.goto('/');

    // By default, the user is not signed in, so AuthGate should be visible
    const authGate = page.locator('.auth-gate');
    await expect(authGate).toBeVisible();

    const signInButton = page.locator('.auth-gate .primary-action');
    await expect(signInButton).toBeVisible();
    await expect(signInButton).toContainText('Sign In with Google');
  });
});
