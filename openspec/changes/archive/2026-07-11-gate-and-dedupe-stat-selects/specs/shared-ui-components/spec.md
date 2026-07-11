## MODIFIED Requirements

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

`SubStatList` SHALL also dedupe across its own rows: a row's option list SHALL omit any stat
already chosen by another row, keeping only the row's own current value visible (so a
pre-existing duplicate stays editable rather than disappearing). Sibling exclusion SHALL
compose with `excludeValues` — a row offers a stat only when it is neither in `excludeValues`
nor selected by a sibling, plus always its own current value. The add button SHALL append the
first option that is neither excluded (`excludeValues`) nor already chosen by an existing row,
and SHALL be suppressed when no such option remains (in addition to the existing cap and
`disabled` suppressions). Dedupe is by option **value**, so it works for both bare-string and
`{ value, label }` options.

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

#### Scenario: Sibling rows never offer a stat another row already holds

- **WHEN** two rows hold `hp` and `def` and a third row's `Select` is opened
- **THEN** the third row's options exclude `hp` and `def`, while the `hp` and `def` rows each still
  show their own current value

#### Scenario: Add button appends the first unchosen option and hides when exhausted

- **WHEN** the add button is clicked with some options already chosen or excluded
- **THEN** the appended row takes the first option that is neither in `excludeValues` nor already
  chosen by a row; **WHEN** every option is excluded or already chosen, the add button is not
  rendered

#### Scenario: Distinct value and label options

- **WHEN** `options={[{ value: 'damage-mult', label: 'Damage Mult. +' }]}`
- **THEN** each row's `Select` displays `Damage Mult. +` while `onChange` emits `damage-mult`

#### Scenario: Disabled suppresses editing

- **WHEN** `SubStatList` is rendered with `disabled`
- **THEN** every row `Select` and every row remove button is disabled and no add button is rendered

### Requirement: PreferenceChain renders an ordered stat-priority chain

The shared `PreferenceChain` component SHALL render an ordered list of `.pref-item` rows
inside a `.pref-chain`, supporting two modes selected by prop:

**Stat-chain mode** (default — HSR relic / N2E cartridge / P5X revelation editors): each row is
a stat `<select>` plus, for non-tail items, an operator `<select>` (`>`, `>=`, `OR`), and
for the tail item a `.remove-pref-btn` — followed by an `.add-pref-btn`. Appending SHALL
set the previous tail's operator to `>`; removing the tail SHALL clear the new tail's
operator to `null`. Values are `StatPreference[]`. `options` is a
`readonly (string | { value, label })[]`: a bare string is an option whose value equals its
label; a `{ value, label }` pair is an option whose stored value (e.g. a stat id) differs from
its shown label. Rows SHALL display the `label` and persist the `value`. A `string[]` behaves
exactly as before, keeping existing HSR and N2E call sites unchanged.

Stat-chain mode SHALL dedupe across rows, matching ranked-list mode: each row's stat
`<select>` SHALL omit stats chosen by other rows (keeping the row's own current value
visible); appending SHALL add the first option not already present in the chain rather than a
fixed `options[0]`; and the add button SHALL be disabled when every option is already chosen.
Dedupe is by option **value**.

**Ranked-list mode** (AE weapon preferences): rows stack full-width in a
`.pref-chain-ranked` container; each `.pref-ranked-item` row is a rank label, a single
`<select>` carrying the shared `.game-select` control styling (so it matches standalone
dropdowns elsewhere) with **no operator select**, a per-item `.remove-pref-btn`, and
up/down reorder controls; followed by an `.add-pref-btn`. There are no comparison
operators between items — the list is a pure ranking ordered by position. `options` is a
`readonly { value, label }[]` so the persisted value (e.g. a weapon `id`) differs from the
shown label; values are the bare ordered value strings. Appending adds the first
not-yet-selected option; reordering swaps adjacent items; removing drops the targeted item
with no operator fixup.

Common props: `onChange`, `namePrefix`. Mode-specific props (`values` shape, `options`
shape, and the mode/variant selector) are defined by the component's TypeScript surface.

#### Scenario: Appending a priority

- **WHEN** "+ Add Priority" is clicked on a non-empty stat-chain
- **THEN** the previous tail's operator becomes `>` and a new tail item is appended with operator
  `null`, taking the first stat not already present in the chain

#### Scenario: Removing the tail

- **WHEN** the tail item's remove button is clicked in stat-chain mode
- **THEN** the item is dropped and the new tail's operator is reset to `null`

#### Scenario: Stat-chain rows dedupe across the chain

- **WHEN** a stat-chain holds `crit-rate` and `crit-mult` and another row's stat `<select>` is opened
- **THEN** that row's options exclude `crit-rate` and `crit-mult` except its own current value, and
  **WHEN** every option is already chosen the add button is disabled

#### Scenario: Stat-chain distinct value and label

- **WHEN** stat-chain `options` are provided as `{ value, label }[]`
- **THEN** each row's stat `<select>` displays the label while `onChange` persists the corresponding
  value, and a newly appended item uses the first not-yet-chosen option's value

#### Scenario: Stat-chain bare string options unchanged

- **WHEN** stat-chain `options` are a `readonly string[]`
- **THEN** each option's value equals its label and appending/dedupe behave over those values

#### Scenario: Appending in ranked-list mode

- **WHEN** the add control is clicked in ranked-list mode
- **THEN** a new row is appended with the first option not already present, and no operator select is rendered on any row

#### Scenario: Removing any item in ranked-list mode

- **WHEN** any row's remove button is clicked in ranked-list mode
- **THEN** that item is dropped, the remaining items keep their relative order, and no operator fixup occurs

#### Scenario: Reordering in ranked-list mode

- **WHEN** a row's up or down control is clicked in ranked-list mode
- **THEN** the item swaps position with its neighbor and `onChange` emits the reordered value list

#### Scenario: Distinct value and label in ranked-list mode

- **WHEN** ranked-list options are provided as `{ value, label }[]`
- **THEN** each row's `<select>` displays the label while `onChange` emits the corresponding value

### Requirement: Equipment editors share labeled, set-gated stat controls

Every Set/Main/Sub equipment editor SHALL present its Equip form consistently, per the rules
below. This covers the HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, and P5X
`RevelationEditorModal` — editors that model an equipped item as a Set/item plus a Main Stat and a
Substats list. The rules are labeled controls, read-only fixed mains, set-gated editable
controls, main-gated substats, and the substats-exclude-main invariant:

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
  stored) is never locked out.
- **Substats exclude and never duplicate the main**: each editor SHALL pass the slot's equipped
  main stat to `SubStatList` as `excludeValues`, and SHALL prune from the substats any value equal
  to a newly chosen main stat within its main-stat change handler. This SHALL hold for all three
  editors — the N2E cartridge editor SHALL supply `excludeValues` and prune in its
  `cartridgeMainStat` handler to match the HSR and P5X editors.

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

#### Scenario: Substats never offer or keep the equipped main stat

- **WHEN** any of the three editors has an equipped main stat
- **THEN** the Substats list does not offer that stat as an option
- **WHEN** the main stat is changed to a value already present in the substats
- **THEN** that substat is pruned from the list, in every one of the three editors including N2E

#### Scenario: Fixed main renders read-only and is never gated

- **WHEN** an HSR head/hands or P5X Sun/Space slot renders with no item selected
- **THEN** its fixed main stat is shown via `.readonly-stat` (no inline style) and is not dimmed

#### Scenario: HSR fixed main uses the shared class, not an inline style

- **WHEN** `RelicEditorModal` renders the head or hands fixed main stat
- **THEN** it uses the shared `.readonly-stat` class and no inline `style` attribute or hardcoded
  `rgba(...)` color
