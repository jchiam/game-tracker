## Why

In the P5X Revelations modal (Equip Cards tab), each of the five slots stacks three
anonymous dropdowns — Set, Main Stat, Substats — with only the slot name labeled. The
main-stat select is visually indistinguishable from a substat select, so on variable-main
slots (Moon/Star/Sky) it is not obvious which dropdown is the main stat. HSR and N2E
equipment editors already wrap every control in a labeled `FormGroup` and edit one slot per
modal; P5X is the lone outlier that dropped the labels _and_ stacks all five slots at once.

## What Changes

- Wrap every equip control in a labeled `FormGroup`: **Set**, **Main Stat**, **Substats** —
  matching the existing HSR/N2E convention. Fixed-main slots (Sun, Space) get the same
  **Main Stat** label so all five slots read consistently.
- Group each slot into a bordered **slot card** with a slot-name header, so the five stacked
  slots become individually scannable instead of one flat run of selects.
- **Set-gate** the stat controls: Main Stat and Substats are dimmed and disabled until a Set
  is chosen for that slot (a card with no set has no stats to record).
- Introduce a shared read-only-stat class `.readonly-stat` in `controls.css`; the P5X
  fixed-main chips adopt it. (HSR migrates onto it in the follow-up standardisation change.)

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `p5x-revelation-tracking`: ADD a requirement for the Equip-tab form presentation — labeled
  Set/Main Stat/Substats controls, per-slot card grouping, and set-gated stat controls.

## Impact

- `src/pages/persona-5-phantom-x/components/RevelationEditorModal.tsx` — label wiring, slot-card
  wrapper, set-gating.
- `src/pages/persona-5-phantom-x/components/RevelationEditorModal.css` — slot-card styling.
- `src/styles/controls.css` — new shared `.readonly-stat` class.
- `RevelationEditorModal.test.tsx` — assert labels, gating, slot-card structure.
- Display-only; no data model, DB, hook, or persistence change.
