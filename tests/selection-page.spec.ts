import { test, expect } from '@playwright/test';

test.describe('Selection Page UI and Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show the brand title link in the navbar', async ({ page }) => {
    const brand = page.locator('a.nav-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('The JonZone Tracker');
    await expect(brand).toHaveAttribute('href', '/');
  });

  test('should display all four game cards', async ({ page }) => {
    const hsrCard = page.locator('.selection-card', { hasText: 'Honkai Star Rail' });
    const r1999Card = page.locator('.selection-card', { hasText: 'Reverse: 1999' });
    const n2eCard = page.locator('.selection-card', { hasText: 'Neverness to Everness' });
    const endfieldCard = page.locator('.selection-card', { hasText: 'Arknights: Endfield' });

    await expect(hsrCard).toBeVisible();
    await expect(r1999Card).toBeVisible();
    await expect(n2eCard).toBeVisible();
    await expect(endfieldCard).toBeVisible();
  });

  test('should show "Requires Login" badge on game cards', async ({ page }) => {
    const loginBadges = page.locator('.requires-login-badge');
    await expect(loginBadges).toHaveCount(4);
    await expect(loginBadges.first()).toContainText('Requires Login');
  });

  test('should have correct developer tags', async ({ page }) => {
    const hoyoverseTag = page.locator('.game-tag-badge', { hasText: 'HoYoverse' });
    const bluepochTag = page.locator('.game-tag-badge', { hasText: 'Bluepoch' });
    const hypergryphTag = page.locator('.game-tag-badge', { hasText: 'Hypergryph' });

    await expect(hoyoverseTag).toBeVisible();
    await expect(bluepochTag).toBeVisible();
    await expect(hypergryphTag).toBeVisible();
  });

  test('should show character images in cards', async ({ page }) => {
    const images = page.locator('.game-character-image');
    await expect(images).toHaveCount(4);

    const hsrImage = images.nth(0);
    const r1999Image = images.nth(1);
    const n2eImage = images.nth(2);
    const endfieldImage = images.nth(3);

    await expect(hsrImage).toHaveAttribute(
      'src',
      /\/assets\/honkai-star-rail\/selection-cover\.png/,
    );
    await expect(r1999Image).toHaveAttribute('src', /\/assets\/reverse-1999\/selection-cover\.jpg/);
    await expect(n2eImage).toHaveAttribute(
      'src',
      /\/assets\/neverness-to-everness\/selection-cover\.png/,
    );
    await expect(endfieldImage).toHaveAttribute(
      'src',
      /\/assets\/arknights-endfield\/selection-cover\.png/,
    );
  });
});
