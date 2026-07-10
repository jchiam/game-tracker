## MODIFIED Requirements

### Requirement: SubStatList renders a bounded repeatable stat list

The shared `SubStatList` component SHALL render an ordered list of removable stat rows plus an
add button, capped at `max` (default 4), using the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup defined once in `src/styles/controls.css`. It SHALL
support two variants: `stat-only` (each row is a stat `Select`; values are `string[]`) and
`stat-value` (each row is a stat `Select` plus a free-text value `<input>`; values are
`{ type, value }[]`). Props: `variant`, `values`, `options`, `onChange`, `namePrefix`, optional
`max`, `addLabel`, `excludeValues` (a `readonly string[]` of option **values** omitted from every
row's option list except the row whose own current value is already that value), and `placeholder`
(the `stat-value` row's value input, default `"Value"`).

`options` SHALL be a `readonly (string | { value, label })[]`: a bare string is an option whose
value equals its label; a `{ value, label }` pair is an option whose stored value differs from its
shown label. Rows SHALL display the option `label` and emit the option `value` (so a persisted stat
id can differ from the in-game label shown). A `string[]` therefore behaves exactly as before
(value === label), keeping existing HSR relic and N2E cartridge call sites unchanged. The add
button SHALL be hidden when `values.length >= max`. `SubStatList` SHALL treat `values` as immutable
— add, update, and remove SHALL each emit a new array of new row objects, never mutating the input.
The HSR relic and N2E cartridge editors SHALL use `SubStatList` rather than re-implementing the
sub-stat row markup and its duplicated CSS.

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

- **WHEN** `excludeValues={['attack']}` is passed (e.g. the equipped main stat id)
- **THEN** no row offers the `attack` option as selectable, except a row whose own current value is
  already `attack`

#### Scenario: Distinct value and label options

- **WHEN** `options={[{ value: 'damage-mult', label: 'Damage Mult. +' }]}`
- **THEN** each row's `Select` displays `Damage Mult. +` while `onChange` emits `damage-mult`

#### Scenario: Bare string options unchanged

- **WHEN** `options={['ATK', 'HP%']}`
- **THEN** each option's value equals its label and behaviour is identical to before this change

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
  `null`

#### Scenario: Removing the tail

- **WHEN** the tail item's remove button is clicked in stat-chain mode
- **THEN** the item is dropped and the new tail's operator is reset to `null`

#### Scenario: Stat-chain distinct value and label

- **WHEN** stat-chain `options` are provided as `{ value, label }[]`
- **THEN** each row's stat `<select>` displays the label while `onChange` persists the corresponding
  value, and a newly appended item uses the first option's value

#### Scenario: Stat-chain bare string options unchanged

- **WHEN** stat-chain `options` are a `readonly string[]`
- **THEN** each option's value equals its label and behaviour is identical to before this change

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

## ADDED Requirements

### Requirement: Stat labels mirror in-game strings and decouple id from label

Player-facing stat labels rendered by build-preference and equipment editors SHALL be the
verbatim in-game strings for that game — mirroring the game's own abbreviation and spacing
conventions (e.g. P5X abbreviates Multiplier → `Mult.` and Accuracy → `Acc.`, and marks percent
variants with a trailing `%` and no space). Labels SHALL be single-sourced in the game's
`data/{game}/*.ts` catalog.

Where a stat label may be re-pinned to track in-game text, the persisted value SHALL be a stable
id decoupled from the label, supplied to the shared primitives (`Select`, `SubStatList`,
`PreferenceChain`) as `{ value, label }` options so that changing a label never invalidates a
stored row. A stored id with no matching label SHALL resolve to the raw id rather than rendering
blank.

#### Scenario: Editor shows the in-game label, stores the id

- **WHEN** a build-preference editor renders a stat option whose id is `damage-mult` and label is
  `Damage Mult. +`
- **THEN** the control displays `Damage Mult. +` and any saved row stores `damage-mult`

#### Scenario: Relabel does not break saved rows

- **WHEN** a stat's display label is re-pinned while its id is unchanged
- **THEN** rows saved before the relabel still resolve to the new label with no data migration

#### Scenario: Unknown id degrades gracefully

- **WHEN** a stored stat id has no entry in the game's label map
- **THEN** the id string itself is shown, not a blank option
