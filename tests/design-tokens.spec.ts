import { test, expect } from '@playwright/test';

// Temper font-role tokens — jsdom can't apply stylesheet rules, so the
// "computed font-family" scenarios from shared-design-tokens are asserted
// here against the real cascade.
test.describe('Temper typography roles', () => {
  test('body uses the base role, headings use the display role', async ({ page }) => {
    await page.goto('/');

    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont).toContain('Segoe UI');

    const headingFont = await page
      .locator('h1')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont).toContain('Bahnschrift');
  });

  test('numeral surfaces use the data role with tabular numerals', async ({ page }) => {
    // A game route, not '/': ScoreBadge.css ships in the route-split page chunk,
    // so its rule only exists once a game page's module graph has loaded.
    await page.goto('/honkai-star-rail');
    await page.waitForSelector('h1');

    // Shared stylesheets load globally; probe the rules through a detached-in-page
    // element so the assertion doesn't depend on auth-gated roster content.
    const probe = await page.evaluate(() => {
      const results: Record<string, { font: string; numeric: string }> = {};
      for (const cls of ['level-value', 'stat-chip', 'score-badge-value']) {
        const el = document.createElement('span');
        el.className = cls;
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        results[cls] = { font: cs.fontFamily, numeric: cs.fontVariantNumeric };
        el.remove();
      }
      return results;
    });

    for (const cls of ['level-value', 'stat-chip', 'score-badge-value'] as const) {
      expect(probe[cls].font, `${cls} font-family`).toContain('Cascadia Mono');
      expect(probe[cls].numeric, `${cls} font-variant-numeric`).toBe('tabular-nums');
    }
  });

  test('no external font is requested', async ({ page }) => {
    const externalFontRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com|\.woff2?(\?|$)/.test(url)) {
        externalFontRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(externalFontRequests).toEqual([]);
  });
});
