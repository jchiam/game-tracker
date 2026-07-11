# Tasks: temper-anodized-card-edge

## 1. Shell

- [x] 1.1 Add optional `temperScore` prop to `GameCardShell`; when ≥ 0 set inline `--temper` from `getProgressStyle(temperScore, 0, 100).color` and add `has-temper-edge` to the root class list; omitted/negative = no-op
- [x] 1.2 Shell tests: class + inline `--temper` for a scored value, absence for `-1` and omitted

## 2. CSS

- [x] 2.1 `card.css`: `position: relative` on `.game-card`; `.game-card.has-temper-edge::before` 3px edge (`var(--temper)`, 40% `color-mix` glow, z-index above image); hover raises glow to 60% with an enumerated `box-shadow` transition
- [x] 2.2 Verify no absolute descendant re-anchors to `.game-card` (grep for `position: absolute` under card selectors)

## 3. Consumers

- [x] 3.1 HSR `CharacterCard`: pass `temperScore={score}`
- [x] 3.2 N2E `CharacterCard`: pass `temperScore={cartridgeScore}`
- [x] 3.3 P5X `ThiefCard`: pass `temperScore={revScore}`
- [x] 3.4 Consumer tests: scored fixture has `has-temper-edge`, sentinel fixture doesn't (one case per game)

## 4. Verification

- [x] 4.1 Full check: `npm test`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:e2e`
- [x] 4.2 Visual check: edge + glow legible over real card art; R1999/AE cards unchanged
- [x] 4.3 `npx openspec validate temper-anodized-card-edge`
