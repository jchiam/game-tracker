## Why

P5X is the only equip-tracking game without a match score. HSR scores relics
(`calculateRelicScore`) and N2E scores cartridges (`calculateCartridgeScore`), each
surfacing a header tier badge that tells the user at a glance how well their equipped
gear matches their build preferences. P5X already stores everything a score needs —
`revelationPreferences` (preferred Heavens set, preferred Space set, per-slot main-stat
chains, sub-stat chain) and the five equipped `revelations` — but computes nothing from
them. This adds the missing score.

The one structural novelty: P5X set bonuses are **emergent from composition** (the four
Heavens cards form 2pc/4pc breakpoints; the Space card is its own one-card set), unlike
HSR (sets not scored at all) and N2E (a single cartridge whose set is directly scored).
So the set term scores the **whole five-card hand**, not any one card.

## What Changes

- **New pure scorer** `calculateRevelationScore(thief)` in `src/utils/revelationScoring.ts`,
  returning `0–100`, or `-1` for insufficient data (no preferences at all, or no cards
  equipped) — mirroring N2E's `-1` sentinel.
- **Three weighted terms**, N2E parity `set 0.35 / main 0.30 / sub 0.35`:
  - **Set term** (whole-hand): `heavensMatch·0.75 + spaceMatch·0.25`.
    `heavensMatch = min(#Heavens cards matching preferred Heavens set, 4) / 4` — graded
    progress toward the preferred 4pc. `spaceMatch = 1` only when a preferred Space set is
    set **and** the equipped Space card matches, else `0`.
  - **Main term**: average over all five slots of per-slot main match. Sun and Space (fixed
    mains) score `1.0` when a card is equipped; Moon/Star/Sky score best-in-chain against
    their main-stat preferences (empty chain → 0). Empty slot → 0.
  - **Sub term**: average over all five slots of per-slot sub match (best-match-per-sub, /4),
    matching HSR's sub scoring. Empty slot or no sub preferences → 0.
- **Absent set preference scores its term as 0** (zero-and-cap, matching N2E): a user with
  stat preferences but no set preference is not credited for the set term, so their ceiling
  falls — a wrong/absent set with perfect stats caps at 65. A null Space preference must NOT
  be credited by a `null == null` equality (the bug this design closes explicitly).
- **Header score badge** on the Thief card, surfaced through `GameCardShell`'s `headerExtra`
  slot exactly like HSR/N2E, tier-classed and hidden when the score is `-1`.
- **Recolor the revelation summary chip by score.** Today the chip's investment-gradient color
  is keyed on the top Heavens bonus's raw piece count (`getProgressStyle(pieces, 0, 4)`). It
  SHALL instead be keyed on the match score (`getProgressStyle(score, 0, 100)`), so the chip
  color reflects build quality, not piece count. When the score is `-1` (no preferences / no
  cards) the chip keeps the piece-count color as a fallback.

## Capabilities

### New Capabilities

- `p5x-revelation-scoring`: the revelation match-score model — range and sentinel, term
  weights, the emergent set term (graded Heavens + gated Space), per-slot main/sub scoring,
  fixed-slot handling, and partial-preference semantics.

### Modified Capabilities

- `p5x-thief-detail`: the Thief card gains a header revelation-score badge (tier-classed,
  hidden on `-1`), rendered via `GameCardShell`'s `headerExtra`, matching the HSR/N2E score
  badge convention; and the revelation summary chip is recolored from raw piece count to the
  match score (falling back to piece count on `-1`).

## Impact

- **New:** `src/utils/revelationScoring.ts` + `src/utils/revelationScoring.test.ts` (pure
  math, directly tested like `relicScoring`/`cartridgeScoring` — not leaning on card tests).
- **Modified:** `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — compute score,
  render `headerExtra` badge, and key the revelation chip color on the score (piece-count
  fallback on `-1`); `ThiefCard.css` — add the per-game `score-badge` + tier classes
  (duplicated from HSR/N2E per current convention; unified in the later alignment change);
  `ThiefCard.test.tsx` — badge shown/hidden + chip-color coverage.
- No DB, service, hook, type-file, or migration changes — preferences and equipped
  revelations already exist on `P5xTrackedThief`.
- **Deferred (explicitly out of scope):** converging HSR's 3-tier / N2E's 5-grade thresholds
  and the duplicated score-badge CSS into one shared helper — a separate alignment change.
