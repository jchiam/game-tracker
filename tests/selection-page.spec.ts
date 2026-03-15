import { test, expect } from '@playwright/test';

test.describe('Selection Page UI and Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show the brand title in the navbar', async ({ page }) => {
    const brand = page.locator('.nav-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('The JonZone Tracker');
  });

  test('should display both game cards', async ({ page }) => {
    const hsrCard = page.locator('.game-card', { hasText: 'Honkai Star Rail' });
    const r1999Card = page.locator('.game-card', { hasText: 'Reverse: 1999' });

    await expect(hsrCard).toBeVisible();
    await expect(r1999Card).toBeVisible();
  });

  test('should show "Requires Login" badge on game cards', async ({ page }) => {
    const loginBadges = page.locator('.requires-login-badge');
    await expect(loginBadges).toHaveCount(2);
    await expect(loginBadges.first()).toContainText('Requires Login');
  });

  test('should have correct developer tags', async ({ page }) => {
    const hoyoverseTag = page.locator('.game-tag-badge', { hasText: 'HoYoverse' });
    const bluepochTag = page.locator('.game-tag-badge', { hasText: 'Bluepoch' });

    await expect(hoyoverseTag).toBeVisible();
    await expect(bluepochTag).toBeVisible();
  });

  test('should show character images in cards', async ({ page }) => {
    const images = page.locator('.game-character-image');
    await expect(images).toHaveCount(2);

    // Check if images have loaded paths
    const hsrImage = images.nth(0);
    const r1999Image = images.nth(1);

    await expect(hsrImage).toHaveAttribute(
      'src',
      /\/assets\/honkai-star-rail\/selection-cover\.png/,
    );
    await expect(r1999Image).toHaveAttribute('src', /\/assets\/reverse-1999\/selection-cover\.jpg/);
  });
});
