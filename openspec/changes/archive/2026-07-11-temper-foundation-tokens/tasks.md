## 1. Tokens (L1)

- [x] 1.1 `design-tokens.json`: re-point neutral values per design D1 (`bg.base` → `#0e1014`, `bg.surface` → `rgba(26,30,38,0.7)`, `bg.surfaceHover` → `rgba(38,44,56,0.8)`, `bg.elevated` → `rgba(30,35,45,0.9)`, `text.primary` → `#e9e4d8`, `text.secondary` → `#b3ad9e`, `text.dim` → `#9a9484`); update the file's `$description` (no longer "cosmic")
- [x] 1.2 `design-tokens.json`: add `color.temper.{rust,amber,gold,verdigris}` anchor group; convert `color.score.gradeS/A/B/D` and `color.brand.primary` to Style Dictionary references (`{color.temper.*}`); leave `gradeC` literal
- [x] 1.3 `design-tokens.json`: add `typography.fontFamily.display` and `typography.fontFamily.data`; re-point `typography.fontFamily.base` from Inter to the Segoe UI stack (stacks per design D3)
- [x] 1.4 Run `npm run build:tokens`; verify compiled `tokens.css` — grade vars resolve to the same hex as before, new `--typography-font-family-*` and `--color-temper-*` vars exist
- [x] 1.5 Verify WCAG AA: compute contrast of `text.primary`/`secondary`/`dim` against all four surfaces composited over Ink; nudge secondary/dim lightness if any pair < 4.5:1

## 2. Global chrome

- [x] 2.1 `src/index.css`: delete the Google Fonts `@import` (line 1); apply `--typography-font-family-display` to headings/page titles
- [x] 2.2 `src/styles/card.css`: `.game-card-name` + `.section-header` take the display face (letter-spacing tweak on the uppercase section labels)
- [x] 2.3 `src/styles/controls.css` + `src/components/ScoreBadge.css`: `.level-value`, `.stat-chip` value, `.score-badge` take `--typography-font-family-data` + `font-variant-numeric: tabular-nums`
- [x] 2.4 `src/utils/progressGradient.ts`: add comment linking `COLOR_STOPS` to the `color.temper.*` tokens (values must stay identical; no code change)

## 3. CSP

- [x] 3.1 `vercel.json`: remove `fonts.googleapis.com` / `fonts.gstatic.com` from CSP; grep confirms no `fonts.` host remains
- [x] 3.2 Run `npm run verify:csp`

## 4. Storybook + verification

- [x] 4.1 `src/styles/DesignTokens.stories.tsx`: new neutrals, `color.temper.*` group, font-role specimens (display/base/data)
- [x] 4.2 `src/styles/InvestmentGradient.stories.tsx`: anchor names updated to temper naming (rust/amber/gold/verdigris)
- [x] 4.3 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 4.4 Visual QA in dev server: roster cards, modals, selection page — confirm no cool-grey remnants, Bahnschrift renders on Windows, numerals tabular
