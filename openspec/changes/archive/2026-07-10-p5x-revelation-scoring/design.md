## Context

P5X already stores `revelationPreferences` (preferred Heavens set, preferred Space set,
Moon/Star/Sky main-stat chains, sub-stat chain) and five equipped `revelations` on
`P5xTrackedThief`, but derives no score. HSR (`src/utils/relicScoring.ts`) and N2E
(`src/utils/cartridgeScoring.ts`) each expose a pure scorer and surface a header tier badge.
P5X's revelation model is richer than either: four Heavens cards form emergent 2pc/4pc set
bonuses and the Space card is a one-card set, so the "set" is a property of the whole hand,
not of any single card. Sub-stat _values_ were dropped earlier, so equipped subs are plain
`string[]` — stat-only matching, exactly like HSR/N2E.

## Goals / Non-Goals

**Goals:**

- A pure `calculateRevelationScore(thief): number` (0–100, or `-1` insufficient data) in a new
  `src/utils/revelationScoring.ts`, directly unit-tested like its HSR/N2E siblings.
- A header score badge on the Thief card via `GameCardShell`'s `headerExtra`, matching the
  HSR/N2E convention, hidden on `-1`.
- Scoring conventions that keep P5X aligned with N2E (its closest analog), minimizing the debt
  the later HSR/N2E/P5X alignment change must resolve.

**Non-Goals:**

- Converging the three games' tier/grade thresholds or de-duplicating the per-game
  `score-badge` CSS — deferred to a dedicated alignment change.
- Any DB / service / hook / type / migration work — the data already exists.
- A _new_ revelation-score summary chip in the card body. The collapsed summary is a fixed
  two-line height with a width-capped Revelations chip; adding a chip risks the height budget.
  The score surfaces as the header badge (matching HSR; N2E's extra `Cart X%` body chip is not
  copied) — but the _existing_ revelation set-summary chip is recolored by the score (see
  Decisions), which adds no element and no width.

## Decisions

**Term model — N2E parity, adapted set term.** Weights `set 0.35 / main 0.30 / sub 0.35`,
identical to `cartridgeScoring`. Main/sub are averaged per-slot over all five slots (empty slot
= 0), mirroring HSR's "empty slots contribute 0" — completeness is encoded in the averages. The
set term is the one departure: it scores the whole hand as `heavensMatch·0.75 + spaceMatch·0.25`
(four Heavens cards vs one Space card).

**Heavens match is graded progress toward 4pc, not the active-bonus breakpoint.**
`heavensMatch = min(matching, 4)/4`. This deliberately scores a 3rd matching card at 0.75 even
though in-game 2pc == 3pc. Framed as "progress toward the preferred 4pc," it rewards partial
build-out smoothly; it is intentionally _not_ the step function `getRevelationSummary` uses for
displaying _active_ bonuses. Locked call — stated so verify treats it as deliberate.

**`-1` insufficient-data sentinel (N2E convention), not HSR's `0%`.** When prefs exist but zero
cards are equipped, the score is `-1` and the badge hides — diverging from HSR's `0%`. Chosen
for N2E parity even though P5X's five-slot shape is otherwise HSR-like. Locked call.

**Partial-preference handling — zero-and-cap, closing the null-equals-null bug.** Absent set
preferences zero _their own_ term rather than voiding the score:

- `heavensMatch = heavensSetId == null ? 0 : min(matching, 4)/4`
- `spaceMatch   = spaceSetId  == null ? 0 : (equippedSpace?.setId === spaceSetId ? 1 : 0)`

The Space guard checks `spaceSetId != null` _first_, so a null preference against a missing
Space card never yields `null === null → 1.0` (the inversion this design exists to prevent). A
stats-only Thief therefore scores with `setTerm` 0 and caps at 65 — matching N2E's
absent/wrong-set ceiling — and is NOT gated to `-1` (that gate is "no prefs at all OR no cards").

**Revelation chip recolored by score, piece-count fallback.** Today the chip color is
`getProgressStyle(revSummary.heavensBonuses[0]?.pieces ?? 0, 0, 4)` — top Heavens bonus piece
count. It becomes `getProgressStyle(score, 0, 100)` when `score >= 0`, so the chip's color
communicates build _quality_, aligning with the header badge. The single computed `score` is
reused for both surfaces (one call in `ThiefCard`). When `score === -1` (no preferences or no
cards) the chip retains the old piece-count color — the chip can still be present (an active
bonus with no preferences set), and piece count is then the only meaningful signal. The chip's
_text_ (space-first set consolidation) and _presence_ (active bonus) are unchanged; only its
color source moves. Locked call: chip color now diverges from raw piece count by design.

**Stat matching reuses the HSR/N2E shape.** A local `getStatMatchScore(pref, equipped)` returns
1.0 exact, 0.5 for %/flat and cross-crit near-misses (adapted to P5X stat labels), else 0.
Kept local to `revelationScoring.ts` rather than shared, consistent with HSR/N2E each owning
their own copy; de-duplication is alignment-change scope.

**Grade thresholds duplicated locally.** The badge grade uses N2E's `getScoreGrade` scale
(S ≥ 90 / A ≥ 70 / B ≥ 50 / C ≥ 30 / D). P5X duplicates these thresholds (and the `score-badge`
CSS) locally rather than importing N2E's util — cross-game import would be worse coupling than
the existing per-game duplication. The alignment change unifies all three.

## Risks / Trade-offs

- **Cross-game scale gap.** Because P5X encodes completeness in _both_ the set term (matching
  count) and the main/sub averages (empty = 0), its scores trend lower than HSR for equal
  completeness. Acceptable to ship; it is exactly the scale mismatch the alignment pass must
  reconcile, and is noted here so that pass has the context.
- **Duplication debt.** Grade thresholds, `getStatMatchScore`, and `score-badge` CSS now exist
  in three places. Deliberate and bounded — the alignment change is the single place to collapse
  them.
- **Graded-vs-breakpoint mismatch.** `heavensMatch` (graded) and `getRevelationSummary`
  (breakpoint) disagree on the 3rd card. They serve different purposes (score vs active-bonus
  display); documented so the divergence reads as intentional, not a bug.
