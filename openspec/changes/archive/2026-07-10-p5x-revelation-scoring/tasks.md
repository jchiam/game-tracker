## 1. Pure scorer

- [x] 1.1 Create `src/utils/revelationScoring.ts` exporting term-weight constants (`SET_WEIGHT` 0.35, `MAIN_STAT_WEIGHT` 0.30, `SUB_STAT_WEIGHT` 0.35), a local `getStatMatchScore(pref, equipped)` (1.0 exact; 0.5 for %/flat and cross-crit near-misses on P5X stat labels; else 0), and `calculateRevelationScore(thief): number`.
- [x] 1.2 Implement the insufficient-data gate: return `-1` when no preference exists (all of `heavensSetId`, `spaceSetId`, Moon/Star/Sky chains, sub chain empty/null) OR no card is equipped (all five slots null).
- [x] 1.3 Implement the set term: `heavensMatch = heavensSetId == null ? 0 : min(#Heavens cards matching heavensSetId, 4)/4`; `spaceMatch = spaceSetId == null ? 0 : (equippedSpace?.setId === spaceSetId ? 1 : 0)` — guard `spaceSetId != null` first so a null preference never scores via `null === null`. `setTerm = heavensMatch·0.75 + spaceMatch·0.25`.
- [x] 1.4 Implement `mainTerm`: average over all five slots; Sun/Space equipped → 1.0; Moon/Star/Sky → best `getStatMatchScore` over that slot's main-stat chain (empty chain → 0); empty slot → 0.
- [x] 1.5 Implement `subTerm`: average over all five slots; per slot = sum of best-per-sub match, capped at 4, / 4; empty slot / no equipped subs / no sub prefs → 0.
- [x] 1.6 Combine `(setTerm·0.35 + mainTerm·0.30 + subTerm·0.35)·100`, clamp to `[0, 100]`; add a local `getScoreGrade(score)` matching N2E's scale (S ≥ 90 / A ≥ 70 / B ≥ 50 / C ≥ 30 / D; `< 0 → ''`).

## 2. Scorer tests

- [x] 2.1 Create `src/utils/revelationScoring.test.ts` covering: perfect 100; the 82.5 and 65 weight examples; floor/cap.
- [x] 2.2 Cover the `-1` sentinel: no prefs at all; no cards equipped; and the stats-only-with-cards case scoring numerically (not `-1`).
- [x] 2.3 Cover the set term: Heavens graded (4→1.0, 2→0.5, 3→0.75), `heavensSetId` null → 0; `spaceMatch` gated (match→1.0, wrong/absent card→0, null pref + no card → 0 not 1.0), heavens-null/space-set and space-null/heavens-set splits.
- [x] 2.4 Cover `mainTerm` (all-match 1.0; empty variable chains → 0.4; empty slot dilution) and `subTerm` (all-match 1.0; no sub prefs → 0; partial 0.5-in-one-slot).

## 3. Card header badge

- [x] 3.1 In `ThiefCard.tsx`, compute `const score = calculateRevelationScore(thief)` and `const showScore = score >= 0`; render a `score-badge` with the grade class in `GameCardShell`'s `headerExtra` when `showScore`, showing `${score.toFixed(0)}%`.
- [x] 3.2 Recolor the revelation chip: change `revPs` from `getProgressStyle(heavensBonuses[0]?.pieces ?? 0, 0, 4)` to `showScore ? getProgressStyle(score, 0, 100) : getProgressStyle(heavensBonuses[0]?.pieces ?? 0, 0, 4)` — score-keyed when scored, piece-count fallback on `-1`. Reuse the single `score` from 3.1; chip text/presence unchanged.
- [x] 3.3 Add `.score-badge` + grade classes to `ThiefCard.css`, mirroring the HSR/N2E per-game badge styling using design tokens (no hardcoded colours).
- [x] 3.4 Update `ThiefCard.test.tsx`: badge shown with grade class for a scored thief; no badge when the score is `-1` (no prefs / no cards); revelation chip color keyed on score when scored, and on piece count when `-1`.

## 4. Verify

- [x] 4.1 `npm test` (scorer + card suites green), `npm run lint`, `npm run format:check`, `npm run build`.
- [x] 4.2 `npx openspec validate p5x-revelation-scoring --strict`.
