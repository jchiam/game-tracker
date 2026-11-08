# Proposal

## Why

The R1999 roster still declares the pre-facet chip set: two bare, glyph-prefixed chips (`💠 Resonating`, `🍽️ Amplifying`) whose prefixes name nothing the card shows (`R{n}`, `E{n}`, no psychube chip), and whose coverage stops short of the grind: Resonance has an "in progress" chip but no "not started" sibling (the same disjoint-milestone shape that motivated P5X's `one` facets), Euphoria has no chip at all, and the psychube is filterable only by amplification, not by "none equipped" or "below Lv 60". The shared Chip Facet pattern (`2026-11-08-add-exclusive-filter-chip-groups`) now carries the dimension label and the exclusivity; R1999 should adopt it with the same vocabulary.

## What Changes

- **R1999 chip set grows from two bare chips to three facets holding seven chips**, in the card's section order (Portrait excluded — dupe-bound; Level has the `Lv` sort), with the P5X noun-phrase vocabulary and no glyph prefixes:
  - **Resonance** (`one`): **new** `Not started` (`resonanceLevel === 0`) · `In progress` (`resonanceLevel > 0 && resonanceLevel < 15`, replaces `💠 Resonating`)
  - **Euphoria** (`one`): **new** `Not started` (`hasEuphoria && euphoriaStage === 0`) · **new** `In progress` (`hasEuphoria && euphoriaStage > 0 && euphoriaStage < 4`); arcanists without the Euphoria system never match either chip
  - **Psychube** (`any`): **new** `None equipped` (`psychubeName === null`, exclusive with the other two) · **new** `Under Lv 60` (equipped and `psychubeLevel < 60`) · `Under A5` (equipped and `psychubeAmplification < 5`, replaces `🍽️ Amplifying`)
- **Exclusive chips in the shared roster view.** A chip inside an `any` facet may be declared `exclusive`: activating it deactivates every sibling, activating any sibling deactivates it, and the non-exclusive siblings still intersect. The layout divides exclusive chips from the rest of the row. Neither existing mode fits a facet where one state ("none equipped") rules out the others ("below Lv 60", "below A5") while those others combine.
- **The collapsible filter block appears on R1999 for the first time** — three rows cross the two-row threshold — with no new behaviour: the shared disclosure, count, and removable facet-labelled summary pills (`Resonance · In progress ×`).
- Held-card ghost tags compose the facet label (`no longer matches Psychube · Under A5`).
- No DB or service changes; no other game is touched (P5X and ZZZ declare no exclusive chips and render as today).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `roster-predicate-filter`: the Chip facets requirement gains the exclusive-chip semantics inside `any` facets and the divider rendering; the Collapsible filter block requirement's example swaps the retired `💠 Resonating` chip for ZZZ's `🐹 Gated` (example only).
- `shared-roster`: the view-hook requirement's enumerated exclusivity semantics extend from `one` facets to exclusive `any` chips.
- `roster-projection-stability`: example text only — the held-card requirement's ghost-tag example names the retired `💠 Resonating` chip; no behaviour change.
- `r1999-arcanist-detail`: the four roster-filter requirements (resonance-gate predicate and chip, gluttony-gate predicate and chip) are replaced by one consolidated three-facet, seven-chip requirement with the new labels, the `one`-mode exclusivity of Resonance and Euphoria, the exclusive `None equipped` chip, and the Euphoria gating on `hasEuphoria`.

## Impact

- `src/pages/reverse1999/Reverse1999Page.tsx` (+ test): `FILTER_CHIPS` becomes a `RosterFilterEntry<R1999TrackedArcanist>[]` of three facets; page tests asserting `💠 Resonating` / `🍽️ Amplifying` labels and ghost tags move to the new labels and facet-composed copy; new wiring tests for the added chips, `one`-mode exclusivity through the UI, Euphoria gating, and the disclosure header.
- `src/hooks/useRosterView.ts` (+ test): `exclusive?` on `RosterFilterChip`, exclusivity-aware `toggleChip`, `exclusive` on the descriptor chip.
- `src/components/RosterPageLayout.tsx`: divider between exclusive and non-exclusive chips in an `any` row; `src/styles/controls.css`: `.filter-facet-divider`; `ControlPatterns.stories.tsx`: Psychube row with the divider.
- `openspec/specs/r1999-arcanist-detail/spec.md`: four requirements removed, one added; `roster-predicate-filter` and `shared-roster`: one requirement modified each.
- `CONTEXT.md` Roster View entry: one sentence on exclusive chips.
