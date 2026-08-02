## MODIFIED Requirements

### Requirement: Equipment editors share labeled, set-gated stat controls

Every Set/Main/Sub equipment editor SHALL present its Equip form consistently, per the rules
below. This covers the HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, and P5X
`RevelationEditorModal` — editors that model an equipped item as a Set/item plus a Main Stat and a
Substats list. The rules are labeled controls, read-only fixed mains, set-gated editable
controls, main-gated substats, and the substats-exclude-main invariant (which applies to the
hoyoverse-style editors only):

- **Labeled controls**: every editable stat control SHALL be wrapped in a `FormGroup` with an
  explicit label (`Set` / `Relic Set` / `Cartridge`, `Main Stat`, `Substats`), so the main-stat
  control is never visually ambiguous with a substat control. `SubStatList` SHALL carry its section
  `label`.
- **Fixed mains are read-only, not gated**: a slot whose main stat is fixed (HSR head/hands, P5X
  Sun/Space) SHALL render that stat via the shared `.readonly-stat` class (in `controls.css`), never
  an inline style, and SHALL always show it regardless of whether an item is selected.
- **Set-gated editable controls**: the editable Main Stat control, the Substats list, and any
  editable level control SHALL be **dimmed (`is-gated`) and disabled** while no Set / Cartridge is
  selected, and enabled once one is; a fixed-main read-only display is exempt. Gating uses the
  primitives' `disabled` prop for interaction and an `is-gated` wrapper for the dim.
- **Main-gated substats**: on a slot with a **variable** main stat (HSR body/feet/sphere/rope, P5X
  Moon/Star/Sky, the N2E cartridge), the Substats list SHALL stay gated (`is-gated` + disabled)
  until the slot's main stat has a value, in addition to the set gate. The gate SHALL key off the
  slot's main-stat **type** (variable vs fixed), not the presence of a stored `mainStat` value: a
  fixed-main slot SHALL NOT be main-gated, so P5X Space (whose dual fixed mains are derived, not
  stored) is never locked out. This gate is retained for the N2E cartridge editor for consistent
  user flow (pick a main before entering substats), independent of any exclusion rule.
- **Substats exclude and never duplicate the main (HSR and P5X only)**: the HSR `RelicEditorModal`
  and P5X `RevelationEditorModal` SHALL pass the slot's equipped main stat to `SubStatList` as
  `excludeValues`, and SHALL prune from the substats any value equal to a newly chosen main stat
  within their main-stat change handler — because in those games a piece's main stat is excluded
  from its own sub-roll pool. The **N2E cartridge editor SHALL NOT apply this exclusion**: N2E
  cartridge main and sub stats roll independently, so the same stat may appear as both main and sub
  on one cartridge. The N2E editor SHALL therefore offer the equipped main stat as a selectable
  substat and SHALL NOT prune a substat that equals the main stat. Substat rows SHALL still dedupe
  against one another in every editor (no stat appears in two substat rows).

This standard SHALL apply only to Set/Main/Sub equipment editors and SHALL NOT apply to the AE
weapon editor (a single inline weapon `Select` + `LevelSlider` in the operator card, with no
set/main/substat model and no fixed main).

#### Scenario: Every editable equip control is labeled

- **WHEN** an HSR relic, N2E cartridge, or P5X revelation editor renders its Equip tab
- **THEN** the item Set/Cartridge control, the Main Stat control, and the Substats list each render
  under an explicit label

#### Scenario: Editable stat controls are set-gated

- **WHEN** the editor has no Set / Cartridge selected
- **THEN** the editable Main Stat control, the Substats list (and, for N2E, the Level control) are
  disabled and carry the `is-gated` dim
- **WHEN** a Set / Cartridge is then selected
- **THEN** those controls become enabled

#### Scenario: Variable-main substats are gated until a main is chosen

- **WHEN** a variable-main slot has a Set / Cartridge selected but no main stat value
- **THEN** the Substats list stays disabled and `is-gated`
- **WHEN** a main stat is then chosen
- **THEN** the Substats list becomes enabled

#### Scenario: Fixed-main substats are not main-gated

- **WHEN** a fixed-main slot (HSR head/hands, P5X Sun/Space) has its Set selected
- **THEN** its Substats list is enabled without requiring a separate main-stat selection, and P5X
  Space (derived dual main, no stored `mainStat`) is not locked out

#### Scenario: HSR and P5X substats never offer or keep the equipped main stat

- **WHEN** an HSR relic or P5X revelation editor has an equipped main stat
- **THEN** the Substats list does not offer that stat as an option
- **WHEN** the main stat is changed to a value already present in the substats
- **THEN** that substat is pruned from the list

#### Scenario: N2E substats may offer and keep the equipped main stat

- **WHEN** the N2E cartridge editor has an equipped main stat (e.g. `Cycle Intensity`)
- **THEN** the Substats list still offers `Cycle Intensity` as a selectable option
- **WHEN** the main stat is changed to a value already present in the substats
- **THEN** that substat is NOT pruned — the same stat remains as both main and sub

#### Scenario: Substat rows still dedupe against each other

- **WHEN** any editor's Substats list holds a stat in one row
- **THEN** no other substat row offers that same stat, in every editor including N2E

#### Scenario: Fixed main renders read-only and is never gated

- **WHEN** an HSR head/hands or P5X Sun/Space slot renders with no item selected
- **THEN** its fixed main stat is shown via `.readonly-stat` (no inline style) and is not dimmed

#### Scenario: HSR fixed main uses the shared class, not an inline style

- **WHEN** `RelicEditorModal` renders the head or hands fixed main stat
- **THEN** it uses the shared `.readonly-stat` class and no inline `style` attribute or hardcoded
  `rgba(...)` color
