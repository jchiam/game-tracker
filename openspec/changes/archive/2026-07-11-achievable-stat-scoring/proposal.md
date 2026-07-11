# Proposal: achievable-stat-scoring

## Why

The equipment-score main and sub terms measure gear against an _impossible_ ideal: the sub denominator is a constant 4 (as if four copies of one preferred substat could roll, which game duplicate rules forbid), and an empty main-stat preference chain scores an occupied slot 0 (as if "no preference" were a failed preference). A user whose only wish is HP, holding the best legal HP gear the game can produce, scores ~19 (grade D). "Theoretically perfect" must mean the best item the game rules allow, given the preferences the user actually expressed.

## What Changes

- Sub-term denominator becomes the **achievable match sum** per slot: the game's substat pool, minus the slot's occupied main stat(s), scored against the sub-preference chain, top 4 distinct stats summed. Equipped sum (clamped to the denominator) divides by it. Partial matches (percent/flat, cross-crit) count identically in numerator and denominator, so covering everything achievable is full marks.
- Empty preference chains become **don't-care** on occupied slots: an occupied slot with an empty main chain scores main 1.0; an occupied slot with an empty sub-preference chain scores sub 1.0. Empty _slots_ still score 0 for both terms (perfect gear is fully equipped).
- Achievable-zero guard: when a sub chain is set but nothing in the (main-excluded) pool can match it, the slot's sub match is 1.0 — a perfect legal item also achieves zero there.
- Scoring core gains the substat-pool / occupied-mains inputs needed to compute achievability; the three game adapters (HSR relics, N2E cartridge, P5X revelations) supply their pools and per-slot mains.
- Out of scope, unchanged: set term and its 0.35 weight (set absence/mismatch handled separately as-is), term weights, `-1` insufficient-data sentinel, grade scale, stat-match rules.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-equipment-scoring`: the `Sub-term denominator` requirement is rewritten from a constant `/4` to the per-slot achievable match sum (with main-stat exclusion, top-4 distinct pool stats, clamp, don't-care and achievable-zero rules); the `Main-term averaging` requirement changes an empty preference chain on an occupied slot from 0 (diluting) to 1.0 (don't-care), keeping fixed-main 1.0 and empty-slot 0 as-is; the `Insufficient-data sentinel` requirement's "absent fields zero their own term" clause becomes "absent set preference zeroes the set term; absent main/sub chains are don't-care".

## Impact

- `src/utils/scoring/equipmentScore.ts` — core: per-slot sub denominator, don't-care rules, config surface for pools/mains.
- `src/utils/scoring/scoring.test.ts` — core test updates + new achievability cases.
- `src/utils/relicScoring.ts`, `src/utils/cartridgeScoring.ts`, `src/utils/revelationScoring.ts` — adapters pass substat pools and occupied mains (incl. HSR fixed head/hands, P5X fixed Sun and dual-fixed Space).
- Score values shift upward globally for entities with sparse preferences; grades recalibrate implicitly (no threshold change).
- No DB, UI, or service changes.
