import { test, expect } from '@playwright/test';

test.describe('Cross-Game Navigation', () => {
  test('should navigate to each game page via direct URL', async ({ page }) => {
    await page.goto('/honkai-star-rail');
    await expect(page.locator('h1')).toContainText('Honkai Star Rail');

    await page.goto('/reverse-1999');
    await expect(page.locator('h1')).toContainText('Reverse: 1999');

    await page.goto('/neverness-to-everness');
    await expect(page.locator('h1')).toContainText('Neverness to Everness');

    await page.goto('/arknights-endfield');
    await expect(page.locator('h1')).toContainText('Arknights: Endfield');

    await page.goto('/persona-5-phantom-x');
    await expect(page.locator('h1')).toContainText('Persona 5: The Phantom X');

    await page.goto('/zenless-zone-zero');
    await expect(page.locator('h1')).toContainText('Zenless Zone Zero');
  });

  test('should switch between all six games via game switcher', async ({ page }) => {
    await page.goto('/honkai-star-rail');
    await expect(page.locator('h1')).toContainText('Honkai Star Rail');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Reverse: 1999")');
    await expect(page).toHaveURL(/\/reverse-1999/);
    await expect(page.locator('h1')).toContainText('Reverse: 1999');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Neverness to Everness")');
    await expect(page).toHaveURL(/\/neverness-to-everness/);
    await expect(page.locator('h1')).toContainText('Neverness to Everness');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Arknights: Endfield")');
    await expect(page).toHaveURL(/\/arknights-endfield/);
    await expect(page.locator('h1')).toContainText('Arknights: Endfield');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Persona 5: The Phantom X")');
    await expect(page).toHaveURL(/\/persona-5-phantom-x/);
    await expect(page.locator('h1')).toContainText('Persona 5: The Phantom X');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Zenless Zone Zero")');
    await expect(page).toHaveURL(/\/zenless-zone-zero/);
    await expect(page.locator('h1')).toContainText('Zenless Zone Zero');

    await page.click('.switcher-trigger');
    await page.click('.dropdown-item:has-text("Honkai Star Rail")');
    await expect(page).toHaveURL(/\/honkai-star-rail/);
  });
});
