## 1. Scoring core

- [x] 1.1 Add `makeStatMatcher(shapeMap)` to `src/utils/scoring/statMatch.ts` returning `{ getStatMatchScore, bestMatch }`, with the identity-shape fallback inside the factory; export from `src/utils/scoring/index.ts`.
- [x] 1.2 Add factory tests to `src/utils/scoring/scoring.test.ts` with a toy vocabulary: adapter-supplies-only-vocabulary behaviour, unmapped-id exact-match-only, best-match over a chain (incl. empty chain → 0).

## 2. Adapter adoption

- [x] 2.1 `relicScoring.ts`: replace `toStatShape`/`getStatMatchScore`/`bestMatch` with `makeStatMatcher(HSR_STAT_SHAPES)`; re-export `getStatMatchScore`; delete dead `SET_WEIGHT`/`MAIN_STAT_WEIGHT`/`SUB_STAT_WEIGHT`.
- [x] 2.2 `cartridgeScoring.ts`: same replacement with `N2E_STAT_SHAPES`; delete dead `CARTRIDGE_ID_WEIGHT`/`MAIN_STAT_WEIGHT`/`SUB_STAT_WEIGHT`; keep `getCartridgeIdMatchScore` (game-unique).
- [x] 2.3 `revelationScoring.ts`: same replacement with `P5X_STAT_SHAPES`; delete dead `SET_WEIGHT`/`MAIN_STAT_WEIGHT`/`SUB_STAT_WEIGHT`.

## 3. Verify

- [x] 3.1 `npm test` — per-game scoring suites pass unchanged (scores byte-identical).
- [x] 3.2 `npm run lint && npm run format:check && npm run build`.
- [x] 3.3 `npx openspec validate --all`.
