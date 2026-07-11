# Tasks: achievable-stat-scoring

## 1. Scoring core

- [x] 1.1 Extend `equipmentScore.ts`: `SlotScore` gains `subAchievable`, `slots` config returns `(SlotScore | null)[]` (null = empty slot, 0 for both terms); per-slot sub becomes `subAchievable <= 0 ? 1 : min(sum(subMatches), subAchievable) / subAchievable`; export `achievableSubSum(bestMatch, pool, excludedStats, chain)` (dedupe pool, drop excluded, top-4 sum, 0 for empty chain)
- [x] 1.2 Core tests in `scoring.test.ts`: achievable normalization, clamp above achievable, `subAchievable: 0` don't-care/vacuous 1.0, null-slot dilution of both terms, partial-match numerator/denominator symmetry (crit 0.67 / 0.33 / 1.0 example), `achievableSubSum` unit cases (dedupe, exclusion, top-4 cutoff, empty chain 0)

## 2. HSR adapter

- [x] 2.1 `relicScoring.ts`: slots return null when empty; mainMatch don't-care 1.0 for empty variable chains (fixed head/hands stay 1.0); `subAchievable` via `achievableSubSum` over `ALL_SUB_STATS` minus the slot's equipped/fixed main
- [x] 2.2 Update HSR scoring tests: recalibrated expectations + all-HP canonical case (sub pref `[HP]` only, perfect legal gear → main term 1.0, sub term 1.0, score 65)

## 3. N2E adapter

- [x] 3.1 `cartridgeScoring.ts`: single pseudo-slot null when no cartridge data; main don't-care on empty `mainStats`; `subAchievable` over `CARTRIDGE_SUB_STATS` minus the equipped main
- [x] 3.2 Update N2E scoring tests: recalibrated expectations + main-exclusion case (main `HP %`, sub pref `[HP %]` → achievable = flat `HP` at 0.5, equipped `HP` scores 1.0)

## 4. P5X adapter

- [x] 4.1 `revelationScoring.ts`: slots return null when empty; main don't-care for empty moon/star/sky chains (sun/space stay fixed 1.0); `subAchievable` over `SUB_STATS` minus occupied mains — Sun excludes `hp`, Space excludes both `attack` and `defense`, variable slots exclude the equipped main
- [x] 4.2 Update P5X scoring tests: recalibrated expectations + Space dual-main exclusion case

## 5. Verify

- [x] 5.1 `npm test` full suite green; `npm run lint` + `npm run format:check` clean; `npx openspec validate --all` passes
