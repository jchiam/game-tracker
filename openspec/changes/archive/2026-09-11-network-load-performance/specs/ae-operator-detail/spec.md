## MODIFIED Requirements

### Requirement: Operator weapon preferences

The system SHALL track an ordered list of preferred weapons per operator as
`weaponPreferences`: an array of `ALL_WEAPONS` **ids** (string slugs), highest priority
first. The list is a pure ranking — there are no comparison operators between entries —
and SHALL NOT contain duplicate ids. It defaults to an empty array on add. The list is
persisted via the operator field-update path as a single ordered array column (see
shared-save-behaviour) — never as preference rows. Order is significant: index 0 is the
first choice.

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
