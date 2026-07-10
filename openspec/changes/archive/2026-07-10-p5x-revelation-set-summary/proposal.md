## Why

Two problems in P5X revelation tracking, both display-only:

1. **Space renders last.** The equip modal lists slots `sun, moon, star, sky, space`, and the
   consolidated summary leads with the Heavens set. The Space card should come **first**
   everywhere — slot editor, summary chip, and edit readout.
2. **Set info is lossy.** The card summarises only the single _dominant_ Heavens set
   (`ThiefCard` picks the highest-count set). A 2pc+2pc split hides the second set; the Space set
   only surfaces when Heavens is 4pc; the edit-mode "Revelations" section shows even less (dominant
   set, never the Space set). The result reads as incomplete.

Scoring is explicitly **out of scope** — there is none today, and whether to add one (comparing
equipped vs `revelationPreferences`, like HSR/N2E) is a separate decision.

## What Changes

- **Space-first ordering.** `REVELATION_SLOTS` becomes `['space', 'sun', 'moon', 'star', 'sky']`
  (its only consumer is the equip modal, so the editor now lists Space first). The consolidated
  summary — chip and edit readout — leads with the Space set, then Heavens.
- **Lossless consolidated set summary.** A pure helper `getRevelationSummary(revelations)` returns
  every _active_ set bonus: the Space set (if equipped) plus each Heavens set at its active
  breakpoint — **2pc** for 2–3 matching cards, **4pc** for 4. Single-card sets contribute no bonus
  and are omitted.
- **Both surfaces render from that one helper**, showing **names + piece counts** (no effect text):
  - **Summary chip** (collapsed): space-first, dot-joined — e.g. `Meditation · Power 2pc · Peace 2pc`.
  - **Edit readout** (Revelations `ProgressSection`): a per-set list, space-first, the Space set
    tagged `(Space)` — e.g. `Meditation (Space)` / `Power 2pc` / `Peace 2pc` — above the Edit button.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `p5x-revelation-catalog`: `REVELATION_SLOTS` reordered Space-first; `HEAVENS_SLOTS` unchanged.
- `p5x-thief-detail`: the revelation summary chip becomes a lossless, space-first consolidation of
  all active set bonuses (not just the dominant Heavens set); a consolidated set readout is added to
  the edit-mode Revelations section; both derive from `getRevelationSummary`.

## Impact

- `src/data/persona-5-phantom-x/revelations.ts` — reorder `REVELATION_SLOTS`; add
  `RevelationSetBonus` / `RevelationSummary` types + `getRevelationSummary(revelations)` helper.
- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — replace the dominant-only chip logic
  with `getRevelationSummary`; render the consolidated chip (space-first) and the edit readout list.
- `src/pages/persona-5-phantom-x/components/ThiefCard.css` — readout list styling.
- `src/data/persona-5-phantom-x/revelations.test.ts` — cover `getRevelationSummary` (2+2, 4pc,
  space-only, singles omitted, ordering) and the new `REVELATION_SLOTS` order.
- `src/pages/persona-5-phantom-x/components/ThiefCard.test.tsx` — update revelation-chip
  expectations (consolidated, space-first) + add edit-readout coverage.
- No DB, service, hook, type-file, or migration changes. Equip-modal slot order shifts (Space first)
  as a consequence of the `REVELATION_SLOTS` reorder; the modal's own tests assert slot presence, not
  order.
