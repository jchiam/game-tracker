## Why

The equipment-scoring core (`createEquipmentScore`, `matchStatShapes`) is shared, but each game's scoring adapter still carries three copied helpers: `toStatShape` and `getStatMatchScore` (identical delegates over the game's `*_STAT_SHAPES` vocabulary map) and `bestMatch` (a byte-identical 7-line loop) — ~30 LOC duplicated across `relicScoring.ts`, `cartridgeScoring.ts`, `revelationScoring.ts`. Separately, all three adapters export dead "parity" weight constants (`SET_WEIGHT`/`MAIN_STAT_WEIGHT`/`SUB_STAT_WEIGHT`, plus N2E's `CARTRIDGE_ID_WEIGHT`) that nothing imports and that falsely imply per-game weights are tunable — the real source of truth is `SCORE_WEIGHTS` in the core.

## What Changes

- Add `makeStatMatcher(shapeMap)` to the scoring core (`src/utils/scoring/`), returning `{ getStatMatchScore, bestMatch }` bound to the supplied vocabulary map. It becomes the only implementation of vocabulary-bound stat matching.
- Each game adapter shrinks to its `*_STAT_SHAPES` vocabulary map (genuinely per-game — Stat Fidelity) plus a `makeStatMatcher` call; the copied `toStatShape`/`getStatMatchScore`/`bestMatch` bodies are deleted. The public per-game `getStatMatchScore` export survives (re-exported from the factory result) — test suites and the `shared-equipment-scoring` spec reference it.
- Delete the dead weight constants from all three adapters (~10 lines). No spec change needed: the spec already mandates a single shared weight constant, which `SCORE_WEIGHTS` is.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-equipment-scoring`: ADDED requirement — per-game stat matchers SHALL be produced by a shared `makeStatMatcher` factory from a vocabulary map; game adapters SHALL NOT hand-write the matching/best-match mechanics.

## Impact

- **Code:** `src/utils/scoring/statMatch.ts` (+factory), `src/utils/scoring/index.ts` (+export), `src/utils/relicScoring.ts`, `src/utils/cartridgeScoring.ts`, `src/utils/revelationScoring.ts` (helpers + dead weights deleted).
- **Behavior:** none — same match rules, same public exports, byte-identical scores.
- **Tests:** factory behaviour tested once in `scoring.test.ts` with a toy vocabulary; existing per-game scoring tests continue to pass unchanged (they exercise the public exports).
