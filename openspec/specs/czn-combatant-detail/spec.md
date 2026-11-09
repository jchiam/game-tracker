# czn-combatant-detail Specification

## Purpose

Chaos Zero Nightmare per-Combatant tracked fields: level (1–62), Manifest Ego rank (T0–T6), Potential attained toggle, favorite toggle, level-based sort, roster search keys, and the combatant card's composition over the shared Game Card Shell.

## Requirements

### Requirement: Combatant level field

The system SHALL track a Combatant's level as an integer in the range 1–62, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting. 62 is the end-game maximum (base cap 60 plus 2 from Unconscious Awakening); per-combatant cap progress is not tracked.

#### Scenario: Level updated within range

- **WHEN** user sets a Combatant's level to a value between 1 and 62 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped

- **WHEN** an update would set level outside 1–62
- **THEN** the persisted value is clamped into range

### Requirement: Combatant Manifest Ego field

The system SHALL track a Combatant's Manifest Ego rank as an integer 0–6, defaulting to 0 on add, where 0 is the base state and 1–6 are the six dupe unlocks. It SHALL be displayed as `T{n}` and edited with a single-select rung control (T0–T6).

#### Scenario: Ego updated

- **WHEN** user selects a Manifest Ego rank 0–6
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Ego displayed with T prefix

- **WHEN** a combatant card renders an Ego value `n`
- **THEN** it is shown as `T{n}` (e.g. `T6`)

### Requirement: Potential attained toggle

The system SHALL track whether a Combatant's Potential tree has been fully unlocked as a boolean, defaulting to false on add. Individual Potential nodes are not tracked.

#### Scenario: Potential toggled on

- **WHEN** user toggles Potential to true
- **THEN** `potentialAttained` is set to true in local state and queued for DB write

#### Scenario: Potential toggled off

- **WHEN** user toggles Potential to false
- **THEN** `potentialAttained` is set to false in local state and queued for DB write

### Requirement: Favorite toggle

The system SHALL allow toggling a Combatant's favorite status optimistically, reverting on failure. Favorited combatants sort ahead of non-favorited combatants in the roster.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a combatant card
- **THEN** `isFavorited` updates in local state immediately and persists via debounced save

### Requirement: CZN roster sort by level

The roster view SHALL offer a level sort mode ordering combatants by level descending (favorites first), alongside the default alphabetical mode.

#### Scenario: Level sort selected

- **WHEN** user switches the roster sort to level
- **THEN** combatants are ordered by level descending within favorite/non-favorite groups

### Requirement: CZN roster search keys

The roster search SHALL match combatants against `name`, `class`, and `element` using the shared fuzzy search.

#### Scenario: Search by class

- **WHEN** user types `Psionic` in the roster search
- **THEN** combatants whose class is Psionic are listed

### Requirement: Combatant card composition

The combatant card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, class and element badges, a rarity indicator (4★/5★), a collapsed summary of level, Ego rank, and Potential state, and edit sections for Level (slider 1–62), Manifest Ego (rung control), and Potential (toggle). The card SHALL NOT re-implement shell mechanics.

#### Scenario: Card renders shell slots

- **WHEN** a tracked combatant renders in the roster grid
- **THEN** the card shows portrait, rarity indicator, class + element badges, and the collapsed summary of level, Ego (`T` prefix), and Potential attained/not

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Manifest Ego, and Potential controls are shown in that order
