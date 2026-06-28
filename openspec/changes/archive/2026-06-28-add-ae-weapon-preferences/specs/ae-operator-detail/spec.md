## ADDED Requirements

### Requirement: Operator weapon preferences

The system SHALL track an ordered list of preferred weapons per operator as
`weaponPreferences`: an array of `ALL_WEAPONS` **ids** (string slugs), highest priority
first. The list is a pure ranking — there are no comparison operators between entries —
and SHALL NOT contain duplicate ids. It defaults to an empty array on add. The list is
persisted via the operator field-update path as a single ordered array (see
shared-save-behaviour; this field is NOT subject to the non-atomic delete-then-reinsert
limitation). Order is significant: index 0 is the first choice.

#### Scenario: Preference added

- **WHEN** user adds a weapon to the operator's preferred list
- **THEN** the weapon's `id` is appended to `weaponPreferences` and the array is queued for DB write via debounced save

#### Scenario: Preference removed

- **WHEN** user removes a weapon from the preferred list
- **THEN** that id is removed from `weaponPreferences`, remaining ids keep their relative order, and the array is queued for DB write

#### Scenario: Preference reordered

- **WHEN** user moves a preferred weapon up or down in the list
- **THEN** `weaponPreferences` is reordered to the new ranking and queued for DB write

#### Scenario: Duplicate rejected

- **WHEN** a weapon already present in `weaponPreferences` would be added again
- **THEN** the list is unchanged (a weapon id appears at most once)

#### Scenario: Picker scoped to operator weapon class

- **WHEN** the preferred-weapon editor renders its options
- **THEN** the selectable set is exactly `ALL_WEAPONS.filter(w => w.type === operator.weapon)`, presented as `{ value: id, label: "{name} ({rarity}★)" }` so the persisted value is the id and the shown text matches the equipped-weapon picker's label exactly

#### Scenario: Preferred-weapon dropdown matches the equipped-weapon picker

- **WHEN** the preferred-weapon editor renders a row's dropdown
- **THEN** the `<select>` uses the shared `.game-select` control (same border, background, and chevron as the equipped-weapon picker) and lists the same class-scoped weapons with the same `{name} ({rarity}★)` labels

#### Scenario: Default preferences state

- **WHEN** an operator is added to the roster
- **THEN** `weaponPreferences` is an empty array

### Requirement: Equipped-weapon preference match badge

The system SHALL render a match badge on the operator card that reports whether the
equipped weapon is one of the operator's preferred weapons and, if so, how highly it
ranks. Because the equipped weapon is stored as `weaponName` (display name) and
preferences are stored as ids, the badge SHALL resolve the equipped name to an id via
`ALL_WEAPONS` before locating its rank in `weaponPreferences`. The badge color SHALL use
the shared `getProgressStyle` rust→teal language, with the first-choice weapon reading
full (teal) and lower ranks stepping toward rust. Any resolution failure SHALL degrade
to the off-build state, never throw.

#### Scenario: Equipped weapon is first choice

- **WHEN** the equipped weapon resolves to the id at index 0 of `weaponPreferences`
- **THEN** the badge shows the top rank (e.g. `#1`) colored full/teal via `getProgressStyle(listLength, 0, listLength)`

#### Scenario: Equipped weapon is a lower-ranked choice

- **WHEN** the equipped weapon resolves to an id at index `rank` (> 0) of `weaponPreferences`
- **THEN** the badge shows that rank (e.g. `#2`) colored via `getProgressStyle(listLength - rank, 0, listLength)`, warmer than rust but below first choice

#### Scenario: Equipped weapon not in preference list

- **WHEN** a weapon is equipped, preferences exist, and the equipped id is not found in `weaponPreferences` (including when `weaponName` does not resolve to any `ALL_WEAPONS` entry)
- **THEN** the badge shows an off-build state in the rust (lowest) color

#### Scenario: No preferences set

- **WHEN** `weaponPreferences` is empty
- **THEN** no match badge is rendered, regardless of whether a weapon is equipped

#### Scenario: No weapon equipped

- **WHEN** preferences exist but `weaponName` is null
- **THEN** no match badge is rendered

### Requirement: Weapon preferences edit-body editor

The expanded (edit) state of the operator card SHALL present a preferred-weapons editor
using the shared `PreferenceChain` component in ranked-list mode, scoped to the
operator's weapon class. The collapsed (read-only) state SHALL NOT render the editor;
the match badge is the only preference signal in the collapsed summary.

#### Scenario: Editor present in edit body

- **WHEN** the operator card is expanded
- **THEN** a preferred-weapons editor renders the current `weaponPreferences` as an ordered, reorderable list with per-item remove and an add control, options scoped to the operator's weapon class

#### Scenario: Editor absent in collapsed summary

- **WHEN** the operator card is collapsed
- **THEN** no preferred-weapons editor is rendered

### Requirement: Edit body grows to fit the weapon-preference list

The system SHALL size the operator card's edit-body height budget
(`--game-card-edit-max-height`) from the editor's actual rendered content height rather
than a fixed value. The edit body is height-capped to drive its expand/collapse
transition, and the preferred-weapons editor grows by one row per added weapon, so a
fixed budget would clip the list; sizing from measured content makes the expanded card
lengthen to fit, keeping the bottom of the editor and its padding visible for any number
of preferred weapons.

#### Scenario: Card lengthens as weapons are added

- **WHEN** the card is expanded and the user adds preferred weapons to the list
- **THEN** the edit-body height budget grows to the measured content height so the full editor and its bottom padding remain visible (no clipping)

#### Scenario: Card shrinks as weapons are removed

- **WHEN** preferred weapons are removed from the list
- **THEN** the edit-body height budget shrinks back to the measured content height
