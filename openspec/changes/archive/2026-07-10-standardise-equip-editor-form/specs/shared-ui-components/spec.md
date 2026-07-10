## MODIFIED Requirements

### Requirement: LevelSlider renders the canonical range control

The shared `LevelSlider` component SHALL render a `.level-slider` range `<input>` bound to a numeric
`value` between `min` and `max`, with a fill gradient up to the current value and, when `showValue`
is set, a `.level-value` readout. The fill colour SHALL be computed internally from the shared
`progressGradient` util over `[min, max]` — not passed in — so every level slider shares the
cross-game investment gradient. Props: `value`, `min`, `max`, `onChange((n: number) => void)`,
`name`, optional `showValue`, and optional `disabled` (disables the range input, e.g. when gated
behind an unmet precondition such as no equipped item). The N2E cartridge editor SHALL use
`LevelSlider showValue` rather than the bespoke `.cartridge-level-slider`, which is removed,
conforming its previously-static fill to the shared gradient.

#### Scenario: Value-bound fill

- **WHEN** `LevelSlider` is rendered with `value`, `min`, and `max`
- **THEN** the track fills proportionally to `(value - min) / (max - min)` and dragging emits the new
  integer value via `onChange`

#### Scenario: Optional readout

- **WHEN** `showValue` is set
- **THEN** a `.level-value` element shows the current value; **WHEN** unset, no readout renders

#### Scenario: Disabled range input

- **WHEN** `LevelSlider` is rendered with `disabled`
- **THEN** the range `<input>` is disabled and does not emit `onChange` on interaction

### Requirement: FormGroup wraps a labeled control

The shared `FormGroup` component SHALL render a `.form-group` wrapper containing a `<label>` (text
from `label`, optional `htmlFor`) followed by its `children`. Call sites SHALL use `FormGroup`
rather than hand-writing the `.form-group` → `<label>` markup. `FormGroup` SHALL accept an optional
`className` that is appended to the `.form-group` wrapper, so a call site can attach a state
modifier (e.g. a gated/disabled `is-gated` hook) without hand-writing the markup.

#### Scenario: Labeled control

- **WHEN** `FormGroup` is rendered with `label="Main Stat"` and a `Select` child
- **THEN** it renders `.form-group` → `<label>Main Stat</label>` → the `Select`

#### Scenario: Optional modifier class

- **WHEN** `FormGroup` is rendered with `className="is-gated"`
- **THEN** the wrapper carries both `form-group` and `is-gated` classes; **WHEN** `className` is
  omitted, the wrapper carries only `form-group`

### Requirement: SubStatList renders a bounded repeatable stat list

The shared `SubStatList` component SHALL render an ordered list of removable stat rows plus an
add button, capped at `max` (default 4), using the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup defined once in `src/styles/controls.css`. Each row is
a stat `Select`; `values` are `string[]` (stat-type ids). Props: `values`, `options`, `onChange`,
`namePrefix`, optional `max`, `addLabel`, `label`, `disabled`, and `excludeValues` (a
`readonly string[]` of option **values** omitted from every row's option list except the row whose
own current value is already that value). There is no per-row value input — substats are tracked as
stat types only. When `disabled` is set, every row `Select` and every row remove button SHALL be
disabled and the add button SHALL be suppressed, so a host can gate the whole list behind a
precondition with no editing (add, change, or remove) possible.

`options` SHALL be a `readonly (string | { value, label })[]`: a bare string is an option whose
value equals its label; a `{ value, label }` pair is an option whose stored value differs from its
shown label. Rows SHALL display the option `label` and emit the option `value` (so a persisted stat
id can differ from the in-game label shown). The add button SHALL be hidden when
`values.length >= max`. `SubStatList` SHALL treat `values` as immutable — add, update, and remove
SHALL each emit a new `string[]`, never mutating the input. The HSR relic, P5X revelation, and N2E
cartridge editors SHALL use `SubStatList` rather than re-implementing the sub-stat row markup and
its duplicated CSS.

#### Scenario: Add button hidden at the cap

- **WHEN** `SubStatList` has `max={4}` and four values
- **THEN** no add button is rendered; **WHEN** a row is removed, the add button reappears

#### Scenario: Row change emits a new string array

- **WHEN** a row's `Select` changes
- **THEN** `onChange` emits a new `string[]` with only that index replaced, with the original input
  array not mutated

#### Scenario: excludeValues omits a conflicting option

- **WHEN** `excludeValues={['attack']}` is passed (e.g. the equipped main stat id)
- **THEN** no row offers the `attack` option as selectable, except a row whose own current value is
  already `attack`

#### Scenario: Distinct value and label options

- **WHEN** `options={[{ value: 'damage-mult', label: 'Damage Mult. +' }]}`
- **THEN** each row's `Select` displays `Damage Mult. +` while `onChange` emits `damage-mult`

#### Scenario: Disabled suppresses editing

- **WHEN** `SubStatList` is rendered with `disabled`
- **THEN** every row `Select` and every row remove button is disabled and no add button is rendered

### Requirement: Build-preference editor modal layout pattern

The system SHALL enforce a canonical layout pattern for all build-preference editor
modals (HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, P5X
`RevelationEditorModal`, and any future game equivalents). Each modal SHALL use the
shared `Modal` component with a `className` for the game-specific body selector,
render `.modal-tabs` with `.tab-btn` buttons for "Equip" and "Preferences" tabs
(class names and styling inherited from `Modal.css`), render a single
`*-editor-body` container (`relic-editor-body`, `revelation-editor-body`, etc.)
that is a flex column with `gap: var(--spacing-lg)`, `overflow-y: auto`,
`max-height: 50vh`, and `padding: var(--spacing-lg)`, and return each tab's content
as a React fragment (`<>…</>`) so its children land directly inside the body container.

The body's **direct children** SHALL provide uniform inter-field spacing solely via the body's
`gap` — no margin, padding, or border-bottom on the children. Each direct child SHALL be one of:
a `FormGroup` (a labeled control), a per-slot **grouping container** (a bordered slot card that
arranges that slot's own `FormGroup`s — used by multi-slot editors like P5X that render every slot
in one body), or a thin **state wrapper** around a single primitive (e.g. an `is-gated` `<div>`
around a `SubStatList`). Single-slot editors (HSR, N2E) render `FormGroup`s directly; multi-slot
editors group per slot. The per-game CSS file SHALL define ONLY the body layout rule, any per-slot
grouping-card rule, and their mobile overrides — all other styling (tabs, form-group label/control
layout, select surfaces, preference-chain rows, substat rows, the shared `.readonly-stat` and
`is-gated` treatments) SHALL be inherited from `Modal.css` and `controls.css`. A mobile breakpoint
(`max-width: 600px`) SHALL reduce gap and padding to `var(--spacing-md)` and raise max-height to
`60vh`.

#### Scenario: Body children provide inter-field spacing via gap

- **WHEN** a build-preference editor modal's body renders multiple direct children
- **THEN** spacing between them is provided solely by the body's `gap` — no margin, padding, or
  border-bottom rules on the children

#### Scenario: Single-slot editors render FormGroups directly

- **WHEN** a single-slot editor body (HSR relic, N2E cartridge) is inspected
- **THEN** its `FormGroup`s (`.form-group`) are direct children of the `*-editor-body` container,
  with no intermediate grouping element between the body and the form groups

#### Scenario: Multi-slot editors group per slot

- **WHEN** a multi-slot editor body (P5X revelations) is inspected
- **THEN** each slot is a grouping container (a bordered slot card) that is a direct child of the
  body and holds that slot's labeled `FormGroup`s, and the body's `gap` spaces the slot cards

#### Scenario: Per-game CSS is minimal

- **WHEN** a build-preference editor modal's CSS file is reviewed
- **THEN** it contains only the body layout rule (flex-direction, gap, overflow-y, max-height,
  padding), any per-slot grouping-card rule (for multi-slot editors), and their mobile overrides —
  all other styling (tabs, form-group, selects, preference-chain rows, substat rows, the shared
  `.readonly-stat` and `is-gated` treatments) resolves from `Modal.css` and `controls.css`

#### Scenario: Tabs inherit from Modal.css

- **WHEN** a build-preference editor modal renders its tab row
- **THEN** it uses `.modal-tabs` and `.tab-btn` class names without any per-game tab CSS overrides

## ADDED Requirements

### Requirement: Equipment editors share labeled, set-gated stat controls

Every Set/Main/Sub equipment editor SHALL present its Equip form consistently, per the three rules
below. This covers the HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, and P5X
`RevelationEditorModal` — editors that model an equipped item as a Set/item plus a Main Stat and a
Substats list. The rules are labeled controls, read-only fixed mains, and set-gated editable
controls:

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

#### Scenario: Fixed main renders read-only and is never gated

- **WHEN** an HSR head/hands or P5X Sun/Space slot renders with no item selected
- **THEN** its fixed main stat is shown via `.readonly-stat` (no inline style) and is not dimmed

#### Scenario: HSR fixed main uses the shared class, not an inline style

- **WHEN** `RelicEditorModal` renders the head or hands fixed main stat
- **THEN** it uses the shared `.readonly-stat` class and no inline `style` attribute or hardcoded
  `rgba(...)` color
