## MODIFIED Requirements

### Requirement: SubStatList renders a bounded repeatable stat list

The shared `SubStatList` component SHALL render an ordered list of removable stat rows plus an
add button, capped at `max` (default 4), using the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup defined once in `src/styles/controls.css`. Each row is
a stat `Select`; `values` are `string[]` (stat-type ids). Props: `values`, `options`, `onChange`,
`namePrefix`, optional `max`, `addLabel`, and `excludeValues` (a `readonly string[]` of option
**values** omitted from every row's option list except the row whose own current value is already
that value). There is no per-row value input — substats are tracked as stat types only.

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
