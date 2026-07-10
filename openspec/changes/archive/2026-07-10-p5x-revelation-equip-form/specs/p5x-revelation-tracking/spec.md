## ADDED Requirements

### Requirement: Revelation equip-tab form presentation

The Revelations modal "Equip Cards" tab SHALL render each of the five slots as a discrete
**slot card** — a bordered container headed by the slot name (Space, Sun, Moon, Star, Sky) —
so the stacked slots are individually scannable rather than one flat run of controls.

Within each slot card, every control SHALL be wrapped in a labeled `FormGroup`, matching the
HSR relic and N2E cartridge editors:

- **Set** — the set `Select`.
- **Main Stat** — the main-stat control. On variable-main slots (Moon, Star, Sky) this is a
  `Select`; on fixed-main slots (Sun, Space) this is a read-only display of the fixed stat(s).
  Both variants SHALL carry the `Main Stat` label, so all five slots read consistently and the
  main stat is never visually ambiguous with a substat.
- **Substats** — the `SubStatList`, rendered with its `Substats` section label.

The fixed-main read-only display SHALL use the shared `.readonly-stat` class (in `controls.css`),
not an inline style.

The **editable** stat controls SHALL be **set-gated**: while the slot has no Set selected, the
variable-main `Select` (Moon/Star/Sky) and the Substats list are dimmed and disabled (a card with
no set has no stats to record); selecting a Set enables them, and clearing the Set disables them
again. A **fixed main** (Sun, Space) is always known regardless of the Set and SHALL NOT be gated —
its `.readonly-stat` display stays fully visible even with no Set selected.

#### Scenario: Every equip control is labeled

- **WHEN** the Equip Cards tab renders a slot card
- **THEN** the slot's Set, Main Stat, and Substats controls each render under a visible label (`Set`, `Main Stat`, `Substats`)

#### Scenario: Fixed-main slot labels its read-only main stat

- **WHEN** the Sun or Space slot card renders
- **THEN** its fixed main stat(s) render as `.readonly-stat` element(s) under a `Main Stat` label (Sun: one; Space: two)

#### Scenario: Variable-main slot main select is distinguishable from substats

- **WHEN** the Moon, Star, or Sky slot card renders with a Set selected
- **THEN** the main-stat `Select` sits under a `Main Stat` label, distinct from the `Substats` list below it

#### Scenario: Editable stat controls are set-gated

- **WHEN** a variable-main slot (Moon/Star/Sky) card has no Set selected
- **THEN** its main-stat `Select` and Substats list are disabled and visually dimmed
- **WHEN** a Set is then selected for that slot
- **THEN** its main-stat `Select` and Substats list become enabled

#### Scenario: Fixed main is never gated

- **WHEN** the Sun or Space slot card has no Set selected
- **THEN** its `.readonly-stat` fixed-main display is fully visible (not dimmed), while that slot's Substats list remains gated

#### Scenario: Slot cards are bordered and slot-named

- **WHEN** the Equip Cards tab renders
- **THEN** each of the five slots is a bordered card headed by its slot name, in the space-first slot order
