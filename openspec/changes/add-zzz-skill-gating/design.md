# Design — add-zzz-skill-gating

## Decision: aggregate over per-track

Jonathan chose the P5X aggregate shape explicitly (2026-09-10) over a per-track tri-state
(5 × SMALLINT 0–2). Rationale: the tracker answers "done / Pass-gated / untouched" per agent, and
the P5X card control, summary badge, and filter chip transfer verbatim. The per-track booleans'
extra granularity was judged not worth five columns and a bespoke tri-state control.

## Decision: state semantics mirror P5X exactly

`skill_progress` is a monotone two-milestone progression:

| Value | Meaning                                                      | P5X analogue    |
| ----- | ------------------------------------------------------------ | --------------- |
| 0     | not started                                                  | not started     |
| 1     | all five combat skills at the base Lv. 11 cap, Pass-gated    | Lv8 incense cap |
| 2     | Hamster Cage Passes spent, all five tracks at the Lv. 12 max | rose-maxed Lv10 |

The single ordered field makes "maxed without the Lv. 11 cap" unrepresentable — no pair CHECK
needed, only the 0–2 range CHECK. Mindscape-derived bonus levels past the base cap stay derived
from `mindscape`, never entered (unchanged from the boolean design).

## Decision: lossy backfill to 0 for partially-maxed rows

The booleans cannot express the gated state, so backfill maps: all five `true` → `2`, anything
else → `0`. A row with e.g. 3/5 tracks maxed collapses to 0 — mapping it to `1` would assert
"parked at Lv. 11 on all tracks", a stronger and likely false claim. Understating is the safe
direction; Jonathan is the only user and can re-set affected agents after deploy. This mirrors the
shape (not the mapping) of P5X migration `20260810000001_p5x_skill_progress.sql`: add, backfill in
the same migration, drop the old columns.

## Decision: 🐹 as the gate emoji

P5X's gate chip is 🌹 (the rose material). The ZZZ gate material is the Hamster Cage Pass, so the
gated badge and filter chip use 🐹. Filter-chip accent: `--color-zzz-rarity-s` (ZZZ gold).

## Decision: keep ToggleChips

Removing the ZZZ skills row leaves `ToggleChips` with zero consumers. It stays: it is a specced
`shared-ui-components` requirement with a Storybook story, and the SegmentedButtons spec already
names the N2E awakening row as belonging to it. Deleting it would force a second shared-spec
removal plus Storybook churn for no functional gain. Only the SegmentedButtons call-site paragraph
loses its mention of the ZZZ maxed row.

## Non-decisions

- Build score unchanged — skill progress is display-only, like Core Skill.
- No per-track history is preserved anywhere; the boolean data is dropped with the columns.
- The edit-row position is unchanged: the Skills section keeps the old row's slot (after Core
  Skill, before the W-Engine group), so the card's section order does not shift.
