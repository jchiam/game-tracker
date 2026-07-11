# Tasks: temper-audit

## 1. Literal cleanup

- [x] 1.1 `src/index.css`: retint selection-card glass literals — overlay gradient stops (`rgba(10,10,15,0.3)`, `rgba(20,20,30,0.95)`), `.requires-login-badge` (`rgba(40,40,55,0.8)`), `.selection-card-body` (`rgba(20,20,30,0.4)`) — to `color-mix` over `--color-bg-base` or true-neutral black per D1
- [x] 1.2 `src/styles/card.css`: `.game-card-overlay` bottom stop `rgba(20,20,30,0.9)` per D1
- [x] 1.3 `src/App.css`: `.primary-action` gradient end `#b8960c` → `color-mix` derivation of `--color-brand-primary` (D2)
- [x] 1.4 `src/components/RosterPageLayout.css`: drop the `#6c63ff` fallback from `var(--color-brand-accent, #6c63ff)`

- [x] 1.5 Tokenise `.bg-*-sel`: add `color.{gameId}.selStart`/`.selMid` (5 games) + `color.bg.selectionFade` to `design-tokens.json`, rebuild tokens, reference vars in `index.css` (D4); document new tokens in `DesignTokens.stories.tsx`

## 2. Storybook

- [x] 2.1 `CardPatterns.stories.tsx`: add anodized-edge pattern block (low + high `--temper` examples, `temperScore` pointer) (D3)

## 3. Verification

- [x] 3.1 Grep audit: no ramp anchor hexes outside `tokens.css` / `COLOR_STOPS` / gradient stories; no hue-carrying `rgba()` literals outside sanctioned white/black (D5)
- [x] 3.2 Visual pass: selection page + roster card overlay + `.primary-action` button before/after — near-imperceptible retints only
- [x] 3.3 Full check: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:e2e`
- [x] 3.4 `npx openspec validate temper-audit`
