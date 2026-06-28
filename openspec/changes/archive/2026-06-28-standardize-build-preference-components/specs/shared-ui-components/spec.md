## ADDED Requirements

### Requirement: Select renders the canonical styled dropdown

The shared `Select` component SHALL render a single `<select>` carrying the canonical dropdown
styling (surface, border, focus, and chevron) defined once in `src/styles/controls.css`. It SHALL
accept `value` (string), `onChange((value: string) => void)`, `options` (a `readonly` array of
either `string` or `{ value, label }`), and `name`; and optional `placeholder` (rendered as a
leading empty-value option), `disabled`, `size` (`'sm' | 'md'`, default `'md'`), and `className`.
Build-preference editors, picker modals, and party editors SHALL use `Select` rather than
re-declaring per-host `select` styling. No call site SHALL re-declare the select surface/focus
rules (`.relic-editor-body select`, `.cartridge-editor-body select`, and `.form-group select`
surface rules are removed in favour of the `Select` canonical class).

#### Scenario: Options provided as strings

- **WHEN** `Select` is rendered with `options={['HP%', 'ATK%']}` and a `value`
- **THEN** it renders one `<option>` per string whose value equals its label, and the matching
  option is selected

#### Scenario: Options with distinct value and label

- **WHEN** `Select` is rendered with `options={[{ value: 'w1', label: 'Blade (5★)' }]}`
- **THEN** the option displays the label while `onChange` emits the `value`

#### Scenario: Placeholder option

- **WHEN** a `placeholder` is supplied and `value` is empty
- **THEN** a leading empty-value `<option>` showing the placeholder text is rendered and selected

### Requirement: FormGroup wraps a labeled control

The shared `FormGroup` component SHALL render a `.form-group` wrapper containing a `<label>` (text
from `label`, optional `htmlFor`) followed by its `children`. Call sites SHALL use `FormGroup`
rather than hand-writing the `.form-group` → `<label>` markup.

#### Scenario: Labeled control

- **WHEN** `FormGroup` is rendered with `label="Main Stat"` and a `Select` child
- **THEN** it renders `.form-group` → `<label>Main Stat</label>` → the `Select`

### Requirement: SubStatList renders a bounded repeatable stat list

The shared `SubStatList` component SHALL render an ordered list of removable stat rows plus an
add button, capped at `max` (default 4), using the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup defined once in `src/styles/controls.css`. It SHALL
support two variants: `stat-only` (each row is a stat `Select`; values are `string[]`) and
`stat-value` (each row is a stat `Select` plus a free-text value `<input>`; values are
`{ type, value }[]`). Props: `variant`, `values`, `options`, `onChange`, `namePrefix`, optional
`max`, `addLabel`, `excludeValues` (a `readonly string[]` omitted from every row's option list
except the row's own current value), and `placeholder` (the `stat-value` row's value input, default
`"Value"`). The add button SHALL be hidden when `values.length >= max`.
`SubStatList`
SHALL treat `values` as immutable — add, update, and remove SHALL each emit a new array of new row
objects, never mutating the input. The HSR relic and N2E cartridge editors SHALL use `SubStatList`
rather than re-implementing the sub-stat row markup and its duplicated CSS.

#### Scenario: Add button hidden at the cap

- **WHEN** `SubStatList` has `max={4}` and four values
- **THEN** no add button is rendered; **WHEN** a row is removed, the add button reappears

#### Scenario: stat-value variant row

- **WHEN** `variant="stat-value"` and a row's value input changes
- **THEN** `onChange` emits a new array whose changed row is a new `{ type, value }` object and whose
  other rows are unchanged references-by-value, with the original input array not mutated

#### Scenario: stat-only variant row

- **WHEN** `variant="stat-only"` and a row's `Select` changes
- **THEN** `onChange` emits a new `string[]` with only that index replaced

#### Scenario: excludeValues omits a conflicting option

- **WHEN** `excludeValues={['ATK']}` is passed (e.g. the equipped main stat)
- **THEN** no row offers `ATK` as a selectable option, except a row whose own current value is already
  `ATK`

### Requirement: LevelSlider renders the canonical range control

The shared `LevelSlider` component SHALL render a `.level-slider` range `<input>` bound to a numeric
`value` between `min` and `max`, with a fill gradient up to the current value and, when `showValue`
is set, a `.level-value` readout. The fill colour SHALL be computed internally from the shared
`progressGradient` util over `[min, max]` — not passed in — so every level slider shares the
cross-game investment gradient. Props: `value`, `min`, `max`, `onChange((n: number) => void)`,
`name`, and optional `showValue`. The N2E cartridge editor SHALL use `LevelSlider showValue` rather
than the bespoke `.cartridge-level-slider`, which is removed, conforming its previously-static fill
to the shared gradient.

#### Scenario: Value-bound fill

- **WHEN** `LevelSlider` is rendered with `value`, `min`, and `max`
- **THEN** the track fills proportionally to `(value - min) / (max - min)` and dragging emits the new
  integer value via `onChange`

#### Scenario: Optional readout

- **WHEN** `showValue` is set
- **THEN** a `.level-value` element shows the current value; **WHEN** unset, no readout renders

### Requirement: SegmentedButtons renders a pill-button selection row

The shared `SegmentedButtons` component SHALL render a row of pill buttons over the canonical base
button class defined once in `src/styles/controls.css` (consolidating `.toggle-btn`, `.rarity-btn`,
`.tier-btn`, and `.phase-btn`). Props: `options` (`readonly { value, label, modifier? }[]`),
`value` (`string | null`), `onChange((value: string | null) => void)`, optional `allowDeselect`,
`coloring` (`'static' | 'investment'`, default `'static'`), `name`, `disabled`, `size`
(`'md' | 'compact'`), and `className` (applied to the button-row container so a host can keep its
game-specific row-wrapper class, e.g. `.euphoria-row`). Selection is **single-exact**: exactly one
option — the one whose `value` matches — is active; there is no threshold/cumulative mode. With
`allowDeselect`, clicking the active option clears the selection (`null`). With `coloring="static"`
(categorical rows — rarity, tier) each option's optional `modifier` SHALL be emitted as a class hook
so game stylesheets supply per-option colour (e.g. `rarity-s`, `tier-splus`) without the shared
component owning the palette. With `coloring="investment"` (level rows — phase, portrait, euphoria,
amplification, arc-tier) the component SHALL colour the single active button from the shared
`progressGradient` by its position in `options`, owning the colour itself with no per-call style hook
and no colouring of the unselected rungs. Numeric selections are passed as their string form. The
N2E cartridge rarity row, R1999 party tier row, AE operator phase row, the R1999 arcanist portrait /
euphoria / amplification rows, and the N2E character-card **arc-tier** row SHALL use
`SegmentedButtons`. The N2E character-card **awakening** row is explicitly out of scope: it is a
multi-independent-`boolean[]` toggle (each slot toggled on its own), which does not fit the
single-value selection model, so it remains its own inline control.

#### Scenario: Single-exact selection

- **WHEN** an option is clicked
- **THEN** only that option carries the `active` class and `onChange` emits its value

#### Scenario: Deselect the active option

- **WHEN** `allowDeselect` is set and the currently-active option is clicked
- **THEN** `onChange` emits `null` and no option is active

#### Scenario: Per-option colour modifier

- **WHEN** an option carries `modifier="s"`
- **THEN** the rendered button includes the `rarity-s`-style class hook so the game's compound colour
  rule can match, and the shared component declares no colour for it

#### Scenario: Investment colouring owned by the component

- **WHEN** `coloring="investment"` and an option is the active (selected) one
- **THEN** the component colours only that button from `progressGradient` by its position in
  `options`, with no colour value passed in by the host and no colour on the unselected rungs

### Requirement: BuildComments renders a labeled notes textarea

The shared `BuildComments` component SHALL render a labeled textarea for free-text build notes,
reusing the canonical `.form-group textarea` styling rather than the duplicated
`.build-comments-textarea` rule. Props: `value`, `onChange((value: string) => void)`, optional
`label` (default `"Build Comments"`) and `placeholder`. The HSR relic and N2E cartridge editors
SHALL use `BuildComments` for their notes field.

#### Scenario: Notes edited

- **WHEN** the textarea content changes
- **THEN** `onChange` emits the new string value

### Requirement: PreferenceChain treats input values as immutable

`PreferenceChain` SHALL NOT mutate its `values` prop. Append, update, remove, and (ranked-list)
reorder SHALL each produce a new array whose changed items are new objects, leaving the caller's
input array and its item objects unmodified.

#### Scenario: Appending does not mutate the previous tail

- **WHEN** `PreferenceChain` (stat-chain) appends a priority and sets the previous tail's operator
  to `>`
- **THEN** the operator change appears only on a cloned item in the emitted array; the item object
  in the original `values` array is unchanged

### Requirement: Build-preference editors compose the shared input primitives

The build-preference editors SHALL compose the shared input primitives (`Select`, `FormGroup`,
`SubStatList`, `LevelSlider`, `SegmentedButtons`, `BuildComments`) and `PreferenceChain` rather
than re-implementing form controls or their styling — covering HSR `RelicEditorModal`, N2E
`CartridgeEditorModal`, and AE `OperatorCard`. Specifically, the main-stat priority chain in the
HSR and N2E editors SHALL be rendered by `<PreferenceChain variant="stat-chain">`, and the inline
`addMainStatPref` / `updateMainStatPref` / `removeMainStatPref` implementations SHALL be removed.

#### Scenario: No inline main-stat chain remains

- **WHEN** the codebase is searched for `addMainStatPref`, `updateMainStatPref`, or
  `removeMainStatPref`
- **THEN** no such inline implementations remain in `RelicEditorModal` or `CartridgeEditorModal`;
  the main-stat chains render through `PreferenceChain`

#### Scenario: No per-editor control-style duplication remains

- **WHEN** `RelicEditorModal.css` and `CartridgeEditorModal.css` are reviewed
- **THEN** they contain no `select` / `input` surface rules, no `.substat-row` / `.add-substat-btn` /
  `.remove-substat` rules, and no bespoke level-slider rules — those resolve from the shared
  primitives in `controls.css`
