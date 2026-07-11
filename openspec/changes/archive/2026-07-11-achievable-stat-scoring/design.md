# Design: achievable-stat-scoring

## Context

`createEquipmentScore` (`src/utils/scoring/equipmentScore.ts`) computes the main term as a per-slot average and the sub term as `min(sum, 4) / 4` per slot. Both measure against an impossible ideal: no legal item can carry four copies of one preferred substat (duplicate rule), no item can carry its own main stat as a substat (main-exclusion rule), and an empty preference chain is treated as a failed preference rather than the absence of one. The exploration's canonical failure: sub pref `[HP]` only, best legal HP gear in every slot, score ≈ 19 (grade D).

The stat matcher (`makeStatMatcher`) lives in the adapters, bound to each game's vocabulary; the core never sees stat ids today.

## Goals / Non-Goals

**Goals:**

- Sub denominator = what a perfect _legal_ item achieves: top-4 distinct pool stats (minus occupied mains) scored against the sub chain.
- Empty main/sub preference chains are don't-care (1.0) on occupied slots.
- Keep the core game-agnostic; adapters keep owning vocabulary and preference-shape knowledge.

**Non-Goals:**

- Set term, term weights (0.35/0.30/0.35), `-1` sentinel triggers, grade thresholds — all unchanged. Set absence still costs its 0.35 by design; handled separately.
- UI substat guards (N2E main exclusion, sibling dedupe) — separate change.
- Stat-match rule changes (partial values stay 1.0/0.5).

## Decisions

### D1 — Achievable sum is the weighted top-4 pool sum (partials count on both sides)

Denominator = sum of the top 4 distinct pool-stat matches vs the chain. Pref `[crit-rate]` → achievable 1.5; crit-rate alone 0.67, crit-mult alone 0.33, both 1.0. User-confirmed semantics: covering everything achievable is full marks; a half-relevant stat the item lacks is genuinely missing value.

Rejected: full-relevance-only denominator (count only 1.0 matches). Numerator could exceed denominator, needs an asymmetric clamp, and misstates "best possible" when partials are all that can exist (pref `[HP%]` with main `HP%` occupied — flat HP at 0.5 is the true optimum and should read 1.0).

### D2 — Denominator depends on the equipped item's main

Pool exclusion uses the slot's _occupied_ main(s): the equipped main for variable slots, the game-defined fixed main(s) for fixed slots (HSR head HP / hands ATK; P5X Sun `hp`, Space dual `attack` + `defense`). Meaning: "subs as good as possible given this item's main." Two different items in the same slot can have different denominators — intended, each is judged against its own legal optimum. Variable slot with no main entered excludes nothing.

### D3 — Don't-care is 1.0, not slot exclusion

An occupied slot with an empty chain scores 1.0 rather than being dropped from the average. Keeps the slot count `n` constant so empty-_slot_ dilution (perfect gear is fully equipped) is preserved, and avoids a variable-denominator average.

Guard rails against inflation: `-1` sentinel still fires when _no_ preference exists anywhere, and the set term still zeroes without a set preference, so a single tiny preference cannot reach 100.

### D4 — Config surface: nullable `SlotScore` + adapter-computed matches, core-owned normalization

`slots` config becomes `(entity) => (SlotScore | null)[]` — `null` is an empty slot (0 for both terms, dilutes both averages). Occupied slots carry:

```ts
interface SlotScore {
  mainMatch: number; // adapter-resolved: 1.0 fixed, 1.0 empty chain (don't-care),
  // bestMatch(chain, main), 0 when chain set but main absent
  subMatches: number[]; // best match per equipped sub, as today
  subAchievable: number; // top-4 pool sum vs sub chain, minus occupied mains;
  // 0 = don't-care/vacuous → core scores the slot's sub 1.0
}
```

Core rule per occupied slot: `sub = subAchievable <= 0 ? 1 : min(sum(subMatches), subAchievable) / subAchievable`. The `subAchievable: 0` convention deliberately merges "empty sub chain" and "achievable-zero guard" — both mean "a perfect item does no better," both score 1.0.

Rationale: the matcher and the preference shapes (per-slot chains HSR/P5X vs single chain N2E) live in adapters; passing matcher + pool + chains + mains into the core would drag vocabulary knowledge across the seam. Adapters stay the vocabulary owners; the core owns normalization, clamping, and averaging.

### D5 — Shared `achievableSubSum` helper in the core

`achievableSubSum(bestMatch, pool, excludedStats, chain): number` exported from `src/utils/scoring/` — dedupes the pool, drops excluded mains, scores each stat via the passed `bestMatch`, sums the top 4. Adapters call it instead of hand-writing the mechanics three times (same discipline as `makeStatMatcher`). Returns 0 for an empty chain, collapsing into the D4 convention.

### D6 — No memoization

Achievable sums recompute per score call over arrays of ≤ 15 stats × ≤ 6 slots. Negligible; scorers already run per render without caching.

## Risks / Trade-offs

- [Scores rise globally; existing users see different grades overnight] → Intended recalibration; scores are computed live, never persisted, so nothing migrates. Grade thresholds untouched.
- [Denominator varies with the equipped main — same subs can score differently after a main swap] → Correct under "judged against this item's legal optimum," but can surprise; the D2 rationale lives in this doc and the spec scenarios pin it.
- [Duplicate substats still enterable in the UI until the guards change lands] → `min(sum, achievable)` clamp caps the exploit at 1.0; spec scenario covers it.
- [Don't-care could mask data-entry gaps (occupied slot, chain never filled, term silently maxed)] → Sentinel + set term keep sparse-preference scores well below 100; acceptable.

## Migration Plan

Pure computation change: core + three adapters + tests in one commit. No DB, no persisted data, no UI. Rollback = revert.

## Open Questions

None — partial-match semantics, don't-care symmetry, and set-term freeze were resolved in the exploration.
