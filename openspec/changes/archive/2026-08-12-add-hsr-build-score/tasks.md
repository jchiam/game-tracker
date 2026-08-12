## 1. Build-score wrapper

- [x] 1.1 Create `src/utils/buildScore.ts`: `calculateBuildScore(char)` with cone term (`max(1 − 0.25·r, 0.25)`, off-build/no-cone → 0), active-side renormalization (design D3), weight constants at top, `-1` sentinel only when both sides inactive; re-export `getScoreGrade`
- [x] 1.2 Create `src/utils/buildScore.test.ts` covering every spec scenario: both-sides blend (85 case), cone don't-care (relic-only unchanged), cone-only renormalized 100, rank steps 1.0/0.75/0.5/0.25/floor, off-build 0, no-cone 0, length independence, superimposition/level irrelevance, `-1` neither-side, cone-prefs-declared-gear-misses 0

## 2. Consumers

- [x] 2.1 `CharacterCard.tsx`: swap `calculateRelicScore` → `calculateBuildScore` for `headerExtra` ScoreBadge and `temperScore`; update `CharacterCard.test.tsx` badge expectations (off-build cone lowers grade, cone-prefs-only shows badge)
- [x] 2.2 `HsrPage.tsx`: swap score-sort comparator to `calculateBuildScore`; update any `HsrPage.test.tsx` sort/badge assertions

## 3. Verification

- [x] 3.1 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 3.2 Manual visual pass: relic-only character score unchanged; off-build cone drops badge; cone-prefs-only character gains badge
