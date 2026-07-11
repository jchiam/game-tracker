# Tasks: temper-scale-score-badge

## 1. Gradient token

- [x] 1.1 Add `gradient.temperRamp` to `src/styles/design-tokens.json` with Style Dictionary references to `color.temper.*` at 0/33/67/100% stops
- [x] 1.2 Run `npm run build:tokens`; verify compiled `--gradient-temper-ramp` in `tokens.css` contains the four resolved anchor hexes (fall back to literal hexes + lock comment if refs don't resolve)
- [x] 1.3 Extend the `COLOR_STOPS` lock comment in `src/utils/progressGradient.ts` to note the `--gradient-temper-ramp` token mirrors the stop positions

## 2. ScoreBadge component

- [x] 2.1 Rewrite `ScoreBadge.tsx` markup: `.score-badge grade-{g}` root, `.score-badge-readout` (value + grade letter), `.score-badge-rail` with `--score-pos` inline custom property; keep negative-sentinel early return
- [x] 2.2 Rewrite `ScoreBadge.css`: neutral glass backing, data-face grade-coloured value, display-face grade letter, 3px ramp rail (`var(--gradient-temper-ramp)`) with porcelain `::after` marker at `var(--score-pos)`
- [x] 2.3 Add `ScoreBadge.test.tsx`: value + grade letter render, `--score-pos` equals score%, negative renders nothing, grade classes at 30/50/70/90 boundaries

## 3. Storybook

- [x] 3.1 Update `ScoreBadge.stories.tsx` for the new anatomy (existing grade/sentinel/all-grades stories verified against new markup)
- [x] 3.2 Document `--gradient-temper-ramp` in `DesignTokens.stories.tsx`

## 4. Verification

- [x] 4.1 Consumer tests pass (`CharacterCard` HSR/N2E, `ThiefCard` P5X); grade-class + `getByText` assertions unchanged, two exact-textContent assertions and the e2e typography probe retargeted to `.score-badge-value` (grade letter now in badge textContent)
- [x] 4.2 Full check: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 4.3 Visual check on a game page (badge footprint fits `headerExtra` row; marker legible over card art)
- [x] 4.4 `npx openspec validate temper-scale-score-badge`
