## 1. CSS

- [x] 1.1 Add `.selection-content { max-width: 1400px; }` rule to `src/pages/SelectionPage.css` with a comment explaining the shell escape
- [x] 1.2 Update `.selection-grid` in `src/pages/SelectionPage.css`: `max-width` 900px → 1400px, `minmax(320px, 1fr)` → `minmax(360px, 1fr)`, with a comment noting the 3-column cap arithmetic

## 2. Markup

- [x] 2.1 Add `selection-content` to the `<main>` className in `src/pages/SelectionPage.tsx` (alongside `main-content`)

## 3. Verification

- [x] 3.1 Run `npm test` — SelectionPage tests still pass
- [x] 3.2 Run `npm run lint && npm run format:check`
- [x] 3.3 Visual check in dev server: 3 columns at ≥1280px viewport, never 4 on ultra-wide, 2 at ~1000px, 1 at mobile width; eyeball each game's cover crop at 3-column card width; confirm roster pages unchanged at 1200px shell
