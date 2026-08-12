## Context

See proposal.md — Why. Relevant current state:

- `src/utils/scoring/` is the shared three-term core (`createEquipmentScore`, unified `SCORE_WEIGHTS`) used by HSR, N2E, and P5X scorers as config adapters. Its weights are deliberately game-uniform.
- `src/utils/relicScoring.ts` exports `calculateRelicScore` (0–100 or `-1`) built on that core.
- `CharacterCard.tsx` computes the score once and feeds it to `ScoreBadge` (`headerExtra`) and `temperScore`; it already computes the cone rank (`lightConePreferences.indexOf(lightConeId)`) for the summary-line match badge.
- `HsrPage.tsx` passes `calculateRelicScore` as the score-sort comparator to `getFilteredRoster`.
- The cone term is HSR-only; no other game has an equivalent single-equip preference list.

## Goals / Non-Goals

**Goals:**

- One blended 0–100 build score consumed by the badge and the sort, with the exact semantics in `specs/hsr-build-scoring/spec.md`.
- Zero changes to the shared scoring core, `SCORE_WEIGHTS`, the relic score formula, or N2E/P5X scorers.

**Non-Goals:**

- No persistence changes — the score is derived, never stored.
- No investment (cone level / superimposition) in the score.
- No generalization of the blend into the shared core for other games; revisit only if a second game grows an equivalent single-equip preference.
- No change to the summary-line cone rank badge (visual gradient stays linear over list length — it communicates position-in-list, not score).

## Decisions

### D1: Compose above the core, not inside it

The blend is a wrapper over `calculateRelicScore`, not a fourth term in `createEquipmentScore`. Alternative — extending the core with an optional extra-term seam — was rejected: it would break the unified-weights invariant (`set + main + sub = 1.0`) that keeps the three adapters comparable, for a term only one game uses.

### D2: New `src/utils/buildScore.ts`

`calculateBuildScore(char)` lives in a new file (with colocated `buildScore.test.ts`), importing `calculateRelicScore`. Alternative — adding the export to `relicScoring.ts` — was rejected: that file's name and its spec (`hsr-relic-scoring`) stay truthful, and the new file maps 1:1 to the new `hsr-build-scoring` capability.

### D3: Active-side renormalization, not fixed weights with zero-fill

```
coneActive  = lightConePreferences.length > 0
relicActive = relicScore !== -1

both      → (0.25 × coneTerm + 0.75 × relicScore/100) × 100
cone only → coneTerm × 100
relic only→ relicScore
neither   → -1
```

Zero-filling an inactive side would punish characters for not declaring preferences, contradicting the codebase's don't-care convention (empty chain = vacuous, not zero). Renormalization keeps relic-only characters byte-identical to today.

### D4: Fixed-step rank decay, floored

`max(1 − 0.25·r, 0.25)` — length-independent so editing the list tail never re-scores the head; the 0.25 floor keeps "listed but low" strictly above "off-build" (0). Alternatives: linear `(n−r)/n` (list length changes scores of unchanged ranks) and binary listed/not (throws away the rank ordering the user curated) — both rejected.

### D5: Card computes the blend once

`CharacterCard` swaps `calculateRelicScore` → `calculateBuildScore` for `headerExtra`/`temperScore`; `HsrPage` swaps the sort comparator the same way. `ScoreBadge` and its `-1`-hides contract are untouched.

## Risks / Trade-offs

- [Score drops surprise the user: off-build cone now caps a perfect-relic character at 75/A] → Intentional and stated in the proposal; the summary-line rank badge explains _why_ at a glance.
- [Cone-prefs-only characters jump from badge-less to a loud 0–100 badge] → Correct per the sentinel spec; the score is honest (declared preference, measurable match).
- [Blend weights (0.25/0.75) are judgment, not measurement] → Constants isolated at the top of `buildScore.ts`; a later tuning change is one-line + spec scenario updates.
- [Future games might want the same pattern and copy the wrapper] → Acceptable duplication until a second real case exists; noted as a non-goal.
